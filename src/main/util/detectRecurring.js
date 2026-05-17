import { normalizeMerchant } from './normalizeMerchant.js'

const RECURRING_KEYWORDS = /\b(RECURRING|AUTOPAY|AUTO[\s-]?PAY|PREAUTH|PRE-AUTH)\b/i

/**
 * Builds a merchant history Map from the last 6 months of existing transactions.
 * Call this once before a bulk import, then pass the result to scoreRecurring.
 *
 * @param {import('better-sqlite3').Database} db
 * @returns {Map<string, { amounts: number[], months: Set<string>, days: number[] }>}
 */
export function buildMerchantHistory(db) {
  const now = new Date()
  const cutoff = new Date(now.getFullYear(), now.getMonth() - 6, 1)
  const cutoffStr = `${cutoff.getFullYear()}${String(cutoff.getMonth() + 1).padStart(2, '0')}01`

  const rows = db
    .prepare(`SELECT NAME, MEMO, TRNAMT, DTPOSTED FROM Transactions WHERE DTPOSTED >= ?`)
    .all(cutoffStr)

  const history = new Map()

  for (const tx of rows) {
    const { merchant } = normalizeMerchant(tx)
    if (!merchant || merchant === 'Unknown Merchant') continue

    if (!history.has(merchant)) {
      history.set(merchant, { amounts: [], months: new Set(), days: [] })
    }

    const entry = history.get(merchant)
    const amt = Math.abs(Number(tx.TRNAMT))
    if (amt > 0) entry.amounts.push(amt)
    if (tx.DTPOSTED?.length >= 6) entry.months.add(tx.DTPOSTED.slice(0, 6))
    const day = parseInt(tx.DTPOSTED?.slice(6, 8), 10)
    if (!isNaN(day)) entry.days.push(day)
  }

  return history
}

/**
 * Scores a single transaction against the pre-built merchant history Map.
 *
 * @param {Object} transaction - Incoming OFX transaction
 * @param {Map} history - Result of buildMerchantHistory()
 * @returns {boolean} true if recurring
 */
export function scoreRecurring(transaction, history) {
  const { merchant, memoType } = normalizeMerchant(transaction)

  if (!merchant || merchant === 'Unknown Merchant') return false

  const rawText = [transaction.NAME, transaction.MEMO].filter(Boolean).join(' ')

  // Immediate high-confidence: bank explicitly tagged it
  if (RECURRING_KEYWORDS.test(rawText)) return true
  if (memoType === 'ach') return true

  const entry = history.get(merchant)
  if (!entry || entry.amounts.length < 2) return false

  let score = 0

  // Month coverage
  if (entry.months.size >= 3) score += 35
  else if (entry.months.size >= 2) score += 15

  // Amount consistency — within 15% of median
  const sorted = [...entry.amounts].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  if (median > 0 && entry.amounts.every((a) => Math.abs(a - median) / median <= 0.15)) score += 30

  // Day-of-month consistency — within ±3 days
  if (entry.days.length >= 2) {
    const sortedDays = [...entry.days].sort((a, b) => a - b)
    const medianDay = sortedDays[Math.floor(sortedDays.length / 2)]
    if (entry.days.every((d) => Math.abs(d - medianDay) <= 3)) score += 20
  }

  // Payment memo type adds weight
  if (memoType === 'payment') score += 15

  return score >= 50
}
