import { normalizeMerchant } from './normalizeMerchant.js'

const RECURRING_KEYWORDS = /\b(RECURRING|AUTOPAY|AUTO[\s-]?PAY|PREAUTH|PRE-AUTH)\b/i

/**
 * Determines whether a transaction is recurring by checking memo keywords
 * and scoring historical matches against prior transactions in the DB.
 *
 * @param {Object} transaction - Incoming OFX transaction (NAME, MEMO, TRNAMT, DTPOSTED)
 * @param {import('better-sqlite3').Database} db - SQLite DB instance
 * @returns {boolean} true if recurring
 */
export function detectRecurring(transaction, db) {
  const { merchant, memoType } = normalizeMerchant(transaction)

  if (!merchant || merchant === 'Unknown Merchant') return false

  const rawText = [transaction.NAME, transaction.MEMO].filter(Boolean).join(' ')

  // Immediate high-confidence: bank explicitly tagged it
  if (RECURRING_KEYWORDS.test(rawText)) return true
  if (memoType === 'ach') return true

  // Look back 6 months of existing transactions
  const now = new Date()
  const cutoff = new Date(now.getFullYear(), now.getMonth() - 6, 1)
  const cutoffStr = `${cutoff.getFullYear()}${String(cutoff.getMonth() + 1).padStart(2, '0')}`

  const candidates = db
    .prepare(`SELECT NAME, MEMO, TRNAMT, DTPOSTED FROM Transactions WHERE SUBSTR(DTPOSTED, 1, 6) >= ?`)
    .all(cutoffStr)

  const matches = candidates.filter((tx) => normalizeMerchant(tx).merchant === merchant)

  if (matches.length < 2) return false

  let score = 0

  // Month coverage
  const months = new Set(matches.map((tx) => tx.DTPOSTED?.slice(0, 6)))
  if (months.size >= 3) score += 35
  else if (months.size >= 2) score += 15

  // Amount consistency — within 15% of median
  const amounts = matches.map((tx) => Math.abs(Number(tx.TRNAMT))).filter((a) => a > 0)
  if (amounts.length >= 2) {
    const sorted = [...amounts].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    if (median > 0 && amounts.every((a) => Math.abs(a - median) / median <= 0.15)) score += 30
  }

  // Day-of-month consistency — within ±3 days
  const days = matches
    .map((tx) => parseInt(tx.DTPOSTED?.slice(6, 8), 10))
    .filter((d) => !isNaN(d))
  if (days.length >= 2) {
    const sorted = [...days].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    if (days.every((d) => Math.abs(d - median) <= 3)) score += 20
  }

  // Payment memo type adds weight
  if (memoType === 'payment') score += 15

  return score >= 50
}
