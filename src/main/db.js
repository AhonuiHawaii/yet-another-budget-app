import Database from 'better-sqlite3-multiple-ciphers'
import dpapi from 'win-dpapi'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { randomBytes } from 'crypto'

/*
  Database initialization
  - Encryption key generated once, protected by Windows DPAPI (CurrentUser)
  - Only the current Windows user can recover the key
  - SQLite-level encryption via better-sqlite3-multiple-ciphers
*/

const DB_DIR = join(app.getPath('userData'), 'data')
const DB_PATH = join(DB_DIR, 'budget.db')
const KEY_PATH = join(DB_DIR, 'budget.key')

mkdirSync(DB_DIR, { recursive: true })

// Resolve or create encryption key — DPAPI CurrentUser scope ties it to this Windows account
const encryptionKey = (() => {
  if (existsSync(KEY_PATH)) {
    return dpapi.unprotectData(readFileSync(KEY_PATH), null, 'CurrentUser').toString('utf8')
  }
  const key = randomBytes(32).toString('hex')
  writeFileSync(KEY_PATH, dpapi.protectData(Buffer.from(key), null, 'CurrentUser'))
  return key
})()

const db = new Database(DB_PATH)
db.pragma(`key='${encryptionKey}'`)
db.pragma('journal_mode = WAL')

/*
  QFX/OFX real transaction field names:
    fitid          = FITID
    type           = TRNTYPE
    postedDate     = DTPOSTED
    userDate       = DTUSER
    amount         = TRNAMT
    name           = NAME
    memo           = MEMO
    checkNumber    = CHECKNUM
    refNumber      = REFNUM
    rawTransaction = full STMTTRN object

  App transaction fields:
    transactionType = income, expense, bills, variable (expenses)
    category        = main app category
    splitCategory1  = first split category
    splitAmount1    = first split amount
    splitCategory2  = second split category
    splitAmount2    = second split amount
*/

db.exec(`
  CREATE TABLE IF NOT EXISTS Transactions (
    fitid TEXT PRIMARY KEY,
    type TEXT,
    postedDate TEXT,
    userDate TEXT,
    amount REAL NOT NULL,
    name TEXT,
    memo TEXT,
    checkNumber TEXT,
    refNumber TEXT,
    rawTransaction TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    transactionType TEXT,
    category TEXT,
    splitCategory1 TEXT,
    splitAmount1 REAL,
    splitCategory2 TEXT,
    splitAmount2 REAL
  )
`)

// Valid columns for filtering — prevents SQL injection on dynamic column names
const VALID_COLUMNS = new Set([
  'fitid', 'type', 'postedDate', 'userDate', 'amount', 'name', 'memo',
  'checkNumber', 'refNumber', 'rawTransaction', 'createdAt',
  'transactionType', 'category', 'splitCategory1', 'splitAmount1',
  'splitCategory2', 'splitAmount2'
])

// OFX date columns — use LIKE prefix matching so partial dates work
// e.g. '202605' → month, '20260506' → day, full timestamp → exact
const DATE_COLUMNS = new Set(['postedDate', 'userDate'])

// Get transactions by any field — defaults to current month by postedDate
const getTransactions = (filters = {}) => {
  const entries = Object.entries(filters).filter(([col]) => VALID_COLUMNS.has(col))

  if (entries.length === 0) {
    const now = new Date()
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    return db.prepare('SELECT * FROM Transactions WHERE postedDate LIKE ?').all(`${yyyymm}%`)
  }

  const clauses = entries.map(([col]) => DATE_COLUMNS.has(col) ? `${col} LIKE ?` : `${col} = ?`)
  const values = entries.map(([col, val]) => DATE_COLUMNS.has(col) ? `${val}%` : val)

  return db.prepare(`SELECT * FROM Transactions WHERE ${clauses.join(' AND ')}`).all(...values)
}

// Update a transaction by fitid — only whitelisted columns are accepted
const updateTransaction = (fitid, updates = {}) => {
  const entries = Object.entries(updates).filter(([col]) => VALID_COLUMNS.has(col) && col !== 'fitid')

  if (entries.length === 0) return 0

  const setClause = entries.map(([col]) => `${col} = ?`).join(', ')
  const values = entries.map(([, val]) => val)

  return db.prepare(`UPDATE Transactions SET ${setClause} WHERE fitid = ?`).run(...values, fitid).changes
}

// Insert a transaction — ignores duplicates on fitid (safe for OFX re-imports)
const createTransaction = (txn) =>
  db.prepare(`
    INSERT OR IGNORE INTO Transactions
      (fitid, type, postedDate, userDate, amount, name, memo, checkNumber, refNumber, rawTransaction)
    VALUES
      (@fitid, @type, @postedDate, @userDate, @amount, @name, @memo, @checkNumber, @refNumber, @rawTransaction)
  `).run(txn).changes

// Delete a transaction by fitid
const deleteTransaction = (fitid) =>
  db.prepare('DELETE FROM Transactions WHERE fitid = ?').run(fitid).changes

export default db
export { getTransactions, createTransaction, updateTransaction, deleteTransaction }



