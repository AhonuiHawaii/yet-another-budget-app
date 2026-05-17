import { normalizeMerchant } from './normalizeMerchant.js'

const RECURRING_KEYWORDS = /\b(RECURRING|AUTOPAY|AUTO[\s-]?PAY|PREAUTH|PRE-AUTH)\b/i
const EXCLUDE_KEYWORDS = /\b(DIRECT\s*DEP(?:OSIT)?|DIR\s*DEP|PAYROLL|SALARY|ACH\s*CREDIT)\b/i
// We no longer fast-path ACH_DEBIT, it's just a regular transaction.

function getDayStandardDeviation(days) {
  if (days.length < 2) return Infinity
  const mean = days.reduce((a, b) => a + b, 0) / days.length
  const variance = days.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / days.length
  return Math.sqrt(variance)
}

// Group transactions by EXACT amount
function groupFixedAmounts(txList) {
  const sorted = [...txList].sort((a, b) => a.amt - b.amt)
  const clusters = []

  for (const tx of sorted) {
    const placed = clusters.find((c) => {
      // Must be an exact match (handling floating point precision for currency)
      return Math.abs(tx.amt - c[0].amt) < 0.001
    })
    if (placed) placed.push(tx)
    else clusters.push([tx])
  }

  return clusters.filter((c) => c.length >= 2)
}

function analyzeMerchant(transactions, memoType) {
  // If the transactions don't span more than 1 month, nothing is recurring yet.
  const allMonths = new Set(transactions.map((t) => t.month))
  if (allMonths.size < 2) return []

  const recurringFitids = new Set()

  // 1. Keyword check (Per-transaction)
  const remainingTxs = []
  for (const tx of transactions) {
    if (RECURRING_KEYWORDS.test(tx.rawText)) {
      recurringFitids.add(tx.fitid)
    } else {
      remainingTxs.push(tx)
    }
  }

  if (remainingTxs.length < 2) return Array.from(recurringFitids)

  const months = new Set(remainingTxs.map((t) => t.month))
  if (months.size < 2) return Array.from(recurringFitids)

  // 2. Amount-Based Regularity (Fixed Subscriptions)
  // Evaluate fixed amount clusters FIRST, so they don't get penalized by frequent shopping
  const fixedClusters = groupFixedAmounts(remainingTxs)
  const clusteredFitids = new Set()

  for (const cluster of fixedClusters) {
    const clusterMonths = new Set(cluster.map((t) => t.month))
    let clusterScore = 0
    if (clusterMonths.size >= 3) clusterScore += 50
    else if (clusterMonths.size >= 2) clusterScore += 35

    if (memoType === 'payment') clusterScore += 15

    if (clusterScore >= 50) {
      for (const tx of cluster) {
        recurringFitids.add(tx.fitid)
        clusteredFitids.add(tx.fitid)
      }
    }
  }

  // 3. Date-Based Regularity (Variable Bills)
  // Remove the ones that were part of a fixed cluster
  const variableTxs = remainingTxs.filter((tx) => !clusteredFitids.has(tx.fitid))

  if (variableTxs.length >= 2) {
    const varMonths = new Set(variableTxs.map((t) => t.month))
    if (varMonths.size >= 2) {
      const varTxPerMonth = variableTxs.length / varMonths.size
      let varScore = 0

      if (varMonths.size >= 3) varScore += 35
      else varScore += 15

      if (memoType === 'payment') varScore += 15

      // Frequent Shopper Penalty
      if (varTxPerMonth > 1.5) varScore -= 30

      const varDays = variableTxs.map((t) => t.day).filter((d) => !isNaN(d))
      if (varDays.length >= 2 && varTxPerMonth <= 1.5) {
        const dayStdDev = getDayStandardDeviation(varDays)
        if (varDays.length === 2) {
          if (dayStdDev <= 2) varScore += 35
        } else {
          if (dayStdDev <= 4) varScore += 40
          else if (dayStdDev <= 7) varScore += 20
        }
      }

      if (varScore >= 50) {
        for (const tx of variableTxs) recurringFitids.add(tx.fitid)
      }
    }
  }

  return Array.from(recurringFitids)
}

/**
 * Builds a merchant history Map from the last 6 months of existing transactions.
 * merchant → { txs: Array, memoType: String }
 *
 * @param {import('better-sqlite3').Database} db
 * @returns {Map<string, Object>}
 */
export function buildMerchantHistory(db) {
  const now = new Date()
  const cutoff = new Date(now.getFullYear(), now.getMonth() - 6, 1)
  const cutoffStr = `${cutoff.getFullYear()}${String(cutoff.getMonth() + 1).padStart(2, '0')}01`

  const rows = db
    .prepare(
      `SELECT FITID, NAME, MEMO, TRNAMT, DTPOSTED FROM Transactions WHERE DTPOSTED >= ? AND TRNAMT < 0`
    )
    .all(cutoffStr)

  const merchantTxs = new Map()
  for (const tx of rows) {
    const { merchant, memoType } = normalizeMerchant(tx)
    if (!merchant || merchant === 'Unknown Merchant') continue
    if (!merchantTxs.has(merchant)) merchantTxs.set(merchant, { txs: [], memoType })

    const rawText = [tx.NAME, tx.MEMO].filter(Boolean).join(' ')
    merchantTxs.get(merchant).txs.push({
      fitid: tx.FITID,
      amt: Math.abs(Number(tx.TRNAMT)),
      month: tx.DTPOSTED?.slice(0, 6) ?? '',
      day: parseInt(tx.DTPOSTED?.slice(6, 8), 10),
      rawText
    })
  }

  return merchantTxs
}

/**
 * Scores a single incoming transaction against pre-built merchant history.
 *
 * @param {Object} transaction
 * @param {Map} history
 * @returns {boolean}
 */
export function scoreRecurring(transaction, history) {
  const { merchant, memoType } = normalizeMerchant(transaction)

  if (!merchant || merchant === 'Unknown Merchant') return false
  if (Number(transaction.TRNAMT) >= 0) return false

  const rawText = [transaction.NAME, transaction.MEMO].filter(Boolean).join(' ')

  if (EXCLUDE_KEYWORDS.test(rawText)) return false
  if (RECURRING_KEYWORDS.test(rawText)) return true

  const historyEntry = history.get(merchant)
  if (!historyEntry || !historyEntry.txs.length) return false

  // Combine incoming with history for holistic evaluation
  const incomingTx = {
    fitid: 'incoming',
    amt: Math.abs(Number(transaction.TRNAMT)),
    month: transaction.DTPOSTED?.slice(0, 6) ?? '',
    day: parseInt(transaction.DTPOSTED?.slice(6, 8), 10),
    rawText
  }

  const combinedTxs = [...historyEntry.txs, incomingTx]
  const recurringFitids = analyzeMerchant(combinedTxs, memoType)

  return recurringFitids.includes('incoming')
}

/**
 * Post-import rescan: re-evaluates all expense transactions in the DB
 * and bulk-updates the recurring column.
 *
 * @param {import('better-sqlite3').Database} db
 * @returns {number} Number of transactions marked recurring
 */
export function rescanRecurring(db) {
  const now = new Date()
  const cutoff = new Date(now.getFullYear(), now.getMonth() - 6, 1)
  const cutoffStr = `${cutoff.getFullYear()}${String(cutoff.getMonth() + 1).padStart(2, '0')}01`

  const rows = db
    .prepare(
      `SELECT FITID, NAME, MEMO, TRNAMT, DTPOSTED FROM Transactions WHERE DTPOSTED >= ? AND TRNAMT < 0`
    )
    .all(cutoffStr)

  const merchantMap = new Map()
  for (const tx of rows) {
    const { merchant, memoType } = normalizeMerchant(tx)
    if (!merchant || merchant === 'Unknown Merchant') continue

    if (!merchantMap.has(merchant)) merchantMap.set(merchant, { txs: [], memoType })
    const entry = merchantMap.get(merchant)

    const rawText = [tx.NAME, tx.MEMO].filter(Boolean).join(' ')

    entry.txs.push({
      fitid: tx.FITID,
      amt: Math.abs(Number(tx.TRNAMT)),
      month: tx.DTPOSTED?.slice(0, 6) ?? '',
      day: parseInt(tx.DTPOSTED?.slice(6, 8), 10),
      rawText
    })
  }

  const recurringFitids = new Set()

  for (const [, entry] of merchantMap) {
    // Check exclusion across all transactions to see if any has exclude keyword
    const hasExclude = entry.txs.some((tx) => EXCLUDE_KEYWORDS.test(tx.rawText))
    if (hasExclude) continue

    if (analyzeMerchant(entry.txs, entry.memoType)) {
      for (const tx of entry.txs) recurringFitids.add(tx.fitid)
    }
  }

  const markOn = db.prepare(`UPDATE Transactions SET recurring = 1 WHERE FITID = ?`)
  const markOff = db.prepare(`UPDATE Transactions SET recurring = 0 WHERE FITID = ?`)

  db.transaction(() => {
    for (const tx of rows) {
      if (recurringFitids.has(tx.FITID)) markOn.run(tx.FITID)
      else markOff.run(tx.FITID)
    }
  })()

  return recurringFitids.size
}
