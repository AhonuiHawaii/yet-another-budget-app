import { normalizeMerchant, neverRecurringMerchants } from './normalizeMerchant.js'

const RECURRING_KEYWORDS = /\b(RECURRING|AUTOPAY|AUTO[\s-]?PAY|PREAUTH|PRE-AUTH)\b/i
const EXCLUDE_KEYWORDS = /\b(DIRECT\s*DEP(?:OSIT)?|DIR\s*DEP|PAYROLL|SALARY|ACH\s*CREDIT)\b/i
// Subscription/membership signals that override the never-recurring merchant
// list. "Walmart+ Member" is a real subscription even though Walmart is
// otherwise a walk-in store.
const SUBSCRIPTION_KEYWORDS =
  /\b(MEMBER(?:SHIP)?|SUBSCRIPTION|SUBSCRIBE|PRIME|AUTORENEW|AUTO[\s-]?RENEW|MONTHLY|ANNUAL|RENEWAL)\b|\+\s*MEMBER|\bPLUS\s+MEMBER/i

const HISTORY_MONTHS = 6
const SCORE_THRESHOLD = 50

function getDayStandardDeviation(days) {
  if (days.length < 2) return Infinity
  const mean = days.reduce((a, b) => a + b, 0) / days.length
  const variance = days.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / days.length
  return Math.sqrt(variance)
}

// Months as YYYYMM ints (e.g. 202405 → 202410 is a 6-month span).
function monthSpan(sortedYYYYMM) {
  if (sortedYYYYMM.length < 2) return 1
  const lo = sortedYYYYMM[0]
  const hi = sortedYYYYMM[sortedYYYYMM.length - 1]
  const loY = Math.floor(lo / 100)
  const loM = lo % 100
  const hiY = Math.floor(hi / 100)
  const hiM = hi % 100
  return (hiY - loY) * 12 + (hiM - loM) + 1
}

// Group transactions by EXACT amount (currency-precision tolerant)
function groupFixedAmounts(txList) {
  const sorted = [...txList].sort((a, b) => a.amt - b.amt)
  const clusters = []

  for (const tx of sorted) {
    const placed = clusters.find((c) => Math.abs(tx.amt - c[0].amt) < 0.005)
    if (placed) placed.push(tx)
    else clusters.push([tx])
  }

  return clusters.filter((c) => c.length >= 2)
}

/**
 * Classify a single merchant's transactions and return the FITIDs that are recurring.
 * Only FITIDs that participate in a qualifying cluster are returned — never the
 * merchant's full tx list. This is the single source of truth for detection.
 *
 * @param {Array} txs - Per-merchant transactions: {fitid, amt, month, day, rawText}
 * @param {string|null} memoType
 * @returns {Set<string>} Set of recurring FITIDs.
 */
function classifyMerchant(txs, memoType) {
  const recurring = new Set()
  if (!txs || txs.length < 2) return recurring

  // 1. Per-tx exclude — drop only the offending tx, not the merchant.
  const eligible = txs.filter((t) => !EXCLUDE_KEYWORDS.test(t.rawText))
  if (eligible.length < 2) return recurring

  // 2. Per-tx keyword pass — mark only the tx carrying the keyword.
  const remaining = []
  for (const tx of eligible) {
    if (RECURRING_KEYWORDS.test(tx.rawText)) recurring.add(tx.fitid)
    else remaining.push(tx)
  }

  if (remaining.length < 2) return recurring

  const remainingMonths = new Set(remaining.map((t) => t.month))
  if (remainingMonths.size < 2) return recurring

  // 3. Fixed-amount clusters — mark only the FITIDs in qualifying clusters.
  // A real subscription hits the same day-of-month every cycle and runs in
  // consecutive months. Coincidental same-priced purchases (same Costco
  // combo, same Taco Bell order) scatter across the calendar. Require:
  //   - 3+ distinct months AND 3+ txs (2+/2+ if explicit payment memo)
  //   - day-of-month stddev ≤ 4 (tight billing cycle)
  //   - near-consecutive months: distinctMonths / monthSpan ≥ 0.66
  // The day-stddev rule is what distinguishes "Netflix on the 5th" from
  // "Costco hot-dog combo on whatever day I felt like it."
  const fixedClusters = groupFixedAmounts(remaining)
  const clusteredFitids = new Set()

  for (const cluster of fixedClusters) {
    const months = new Set(cluster.map((t) => t.month))
    const sizeOk =
      (months.size >= 3 && cluster.length >= 3) ||
      (memoType === 'payment' && months.size >= 2 && cluster.length >= 2)
    if (!sizeOk) continue

    const days = cluster.map((t) => t.day).filter((d) => !isNaN(d))
    if (days.length < 2 || getDayStandardDeviation(days) > 4) continue

    const monthNums = [...months].map((m) => parseInt(m, 10)).sort((a, b) => a - b)
    const span = monthSpan(monthNums)
    if (span > 0 && months.size / span < 0.66) continue

    for (const tx of cluster) {
      recurring.add(tx.fitid)
      clusteredFitids.add(tx.fitid)
    }
  }

  // 4. Date-regularity pass for variable-amount bills (electric, water, etc.).
  // Strict to avoid false positives from repeat shopping that happens to align
  // on similar days. Requires: 3+ distinct months, ≤1 tx/month, tight day stddev,
  // and amount consistency (coefficient of variation ≤ 0.35).
  const variable = remaining.filter((t) => !clusteredFitids.has(t.fitid))
  if (variable.length < 3) return recurring

  const varMonths = new Set(variable.map((t) => t.month))
  if (varMonths.size < 3) return recurring

  const varTxPerMonth = variable.length / varMonths.size
  if (varTxPerMonth > 1.1) return recurring

  const varDays = variable.map((t) => t.day).filter((d) => !isNaN(d))
  if (varDays.length < 3) return recurring
  if (getDayStandardDeviation(varDays) > 3) return recurring

  const mean = variable.reduce((s, t) => s + t.amt, 0) / variable.length
  if (mean <= 0) return recurring
  const sd = Math.sqrt(variable.reduce((s, t) => s + (t.amt - mean) ** 2, 0) / variable.length)
  if (sd / mean > 0.35) return recurring

  let varScore = 35
  if (memoType === 'payment') varScore += 15
  varScore += 20 // tight day-of-month alignment

  if (varScore >= SCORE_THRESHOLD) {
    for (const tx of variable) recurring.add(tx.fitid)
  }

  return recurring
}

function cutoffYYYYMMDD() {
  const now = new Date()
  const cutoff = new Date(now.getFullYear(), now.getMonth() - HISTORY_MONTHS, 1)
  return `${cutoff.getFullYear()}${String(cutoff.getMonth() + 1).padStart(2, '0')}01`
}

// Build a normalized merchant key. Rows that normalize to 'Unknown Merchant'
// fall back to a synthetic bucket so they can still cluster on amount + date.
function merchantKey(tx) {
  const { merchant, memoType, cleanedText } = normalizeMerchant(tx)
  const rawText = [tx.NAME, tx.MEMO].filter(Boolean).join(' ')
  const isSubscription = SUBSCRIPTION_KEYWORDS.test(rawText)

  if (merchant && merchant !== 'Unknown Merchant') {
    if (neverRecurringMerchants.has(merchant) && !isSubscription) {
      return { key: null, memoType }
    }
    // Subscriptions on otherwise-walk-in brands get their own bucket so
    // Walmart+ Member doesn't cluster with everyday Walmart purchases.
    const key = isSubscription && neverRecurringMerchants.has(merchant)
      ? `${merchant} (Subscription)`
      : merchant
    return { key, memoType }
  }
  const fallback = (cleanedText || tx.NAME || '').slice(0, 24).trim().toUpperCase()
  if (!fallback) return { key: null, memoType }
  return { key: `~${fallback}`, memoType }
}

function buildTxRecord(row) {
  const rawText = [row.NAME, row.MEMO].filter(Boolean).join(' ')
  return {
    fitid: row.FITID,
    amt: Math.abs(Number(row.TRNAMT)),
    month: row.DTPOSTED?.slice(0, 6) ?? '',
    day: parseInt(row.DTPOSTED?.slice(6, 8), 10),
    rawText
  }
}

/**
 * Builds a merchant history Map from the last 6 months of existing expense transactions.
 *
 * @param {import('better-sqlite3').Database} db
 * @returns {Map<string, { txs: Array, memoType: string|null }>}
 */
export function buildMerchantHistory(db) {
  const rows = db
    .prepare(
      `SELECT FITID, NAME, MEMO, TRNAMT, DTPOSTED FROM Transactions WHERE DTPOSTED >= ? AND TRNAMT < 0`
    )
    .all(cutoffYYYYMMDD())

  const map = new Map()
  for (const row of rows) {
    const { key, memoType } = merchantKey(row)
    if (!key) continue
    if (!map.has(key)) map.set(key, { txs: [], memoType })
    map.get(key).txs.push(buildTxRecord(row))
  }

  return map
}

/**
 * Score a single incoming transaction against pre-built merchant history.
 * Returns true if the incoming tx would be classified as recurring.
 *
 * @param {Object} transaction - OFX-shaped tx (NAME, MEMO, TRNAMT, DTPOSTED, FITID)
 * @param {Map} history - From buildMerchantHistory()
 * @returns {boolean}
 */
export function scoreRecurring(transaction, history) {
  if (Number(transaction.TRNAMT) >= 0) return false

  const { key, memoType } = merchantKey(transaction)
  if (!key) return false

  const rawText = [transaction.NAME, transaction.MEMO].filter(Boolean).join(' ')
  if (EXCLUDE_KEYWORDS.test(rawText)) return false
  if (RECURRING_KEYWORDS.test(rawText)) return true

  const entry = history.get(key)
  if (!entry || !entry.txs.length) return false

  const incoming = {
    fitid: '__incoming__',
    amt: Math.abs(Number(transaction.TRNAMT)),
    month: transaction.DTPOSTED?.slice(0, 6) ?? '',
    day: parseInt(transaction.DTPOSTED?.slice(6, 8), 10),
    rawText
  }

  const combined = [...entry.txs, incoming]
  const recurringFitids = classifyMerchant(combined, entry.memoType ?? memoType)
  return recurringFitids.has('__incoming__')
}

/**
 * Re-evaluate every expense transaction in the last 6 months and bulk-update
 * the recurring column. Authoritative pass — the per-tx scoreRecurring call
 * is best-effort; this is the source of truth.
 *
 * @param {import('better-sqlite3').Database} db
 * @returns {number} Count of transactions marked recurring.
 */
export function rescanRecurring(db) {
  const rows = db
    .prepare(
      `SELECT FITID, NAME, MEMO, TRNAMT, DTPOSTED FROM Transactions WHERE DTPOSTED >= ? AND TRNAMT < 0`
    )
    .all(cutoffYYYYMMDD())

  const merchantMap = new Map()
  for (const row of rows) {
    const { key, memoType } = merchantKey(row)
    if (!key) continue
    if (!merchantMap.has(key)) merchantMap.set(key, { txs: [], memoType })
    merchantMap.get(key).txs.push(buildTxRecord(row))
  }

  const recurringFitids = new Set()
  for (const [, entry] of merchantMap) {
    const flagged = classifyMerchant(entry.txs, entry.memoType)
    for (const fitid of flagged) recurringFitids.add(fitid)
  }

  const markOn = db.prepare(`UPDATE Transactions SET recurring = 1 WHERE FITID = ?`)
  const markOff = db.prepare(`UPDATE Transactions SET recurring = 0 WHERE FITID = ?`)

  db.transaction(() => {
    for (const row of rows) {
      if (recurringFitids.has(row.FITID)) markOn.run(row.FITID)
      else markOff.run(row.FITID)
    }
  })()

  return recurringFitids.size
}
