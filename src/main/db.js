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

// ── Schema migrations ────────────────────────────────────────────────────────

const SCHEMA_VERSION = 2

// Initial schema — Transactions with denormalized account columns
function migration_v1() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Transactions (
      FITID           TEXT PRIMARY KEY,
      ACCTID          TEXT,
      ACCTTYPE        TEXT,
      ORG             TEXT,
      INTU_BID        TEXT,
      TRNTYPE         TEXT,
      DTPOSTED        TEXT,
      DTUSER          TEXT,
      TRNAMT          TEXT,
      NAME            TEXT,
      MEMO            TEXT,
      CHECKNUM        TEXT,
      REFNUM          TEXT,
      DTAVAIL         TEXT,
      SRVRTID         TEXT,
      PAYEEID         TEXT,
      EXTDNAME        TEXT,
      SIC             TEXT,
      rawTransaction  TEXT NOT NULL,
      createdAt       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      transactionType TEXT,
      category        TEXT,
      splitCategory1  TEXT,
      splitAmount1    REAL,
      splitCategory2  TEXT,
      splitAmount2    REAL
    )
  `)
}

// Promote account columns into a dedicated Accounts table, strip them from Transactions
function migration_v2() {
  db.transaction(() => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS Accounts (
        ACCTID      TEXT PRIMARY KEY,
        ACCTTYPE    TEXT,
        ORG         TEXT,
        INTU_BID    TEXT,
        displayName TEXT,
        createdAt   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        lastImport  TEXT
      )
    `)

    db.exec(`
      INSERT OR IGNORE INTO Accounts (ACCTID, ACCTTYPE, ORG, INTU_BID)
      SELECT DISTINCT ACCTID, ACCTTYPE, ORG, INTU_BID
      FROM Transactions
      WHERE ACCTID IS NOT NULL
    `)

    db.exec(`
      CREATE TABLE Transactions_new (
        FITID           TEXT PRIMARY KEY,
        ACCTID          TEXT,
        TRNTYPE         TEXT,
        DTPOSTED        TEXT,
        DTUSER          TEXT,
        TRNAMT          TEXT,
        NAME            TEXT,
        MEMO            TEXT,
        CHECKNUM        TEXT,
        REFNUM          TEXT,
        DTAVAIL         TEXT,
        SRVRTID         TEXT,
        PAYEEID         TEXT,
        EXTDNAME        TEXT,
        SIC             TEXT,
        rawTransaction  TEXT NOT NULL,
        createdAt       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        transactionType TEXT,
        category        TEXT,
        splitCategory1  TEXT,
        splitAmount1    REAL,
        splitCategory2  TEXT,
        splitAmount2    REAL
      )
    `)

    db.exec(`
      INSERT INTO Transactions_new
      SELECT FITID, ACCTID, TRNTYPE, DTPOSTED, DTUSER, TRNAMT, NAME, MEMO,
             CHECKNUM, REFNUM, DTAVAIL, SRVRTID, PAYEEID, EXTDNAME, SIC,
             rawTransaction, createdAt, transactionType, category,
             splitCategory1, splitAmount1, splitCategory2, splitAmount2
      FROM Transactions
    `)

    db.exec('DROP TABLE Transactions')
    db.exec('ALTER TABLE Transactions_new RENAME TO Transactions')
  })()
}

function runMigrations() {
  const currentVersion = db.pragma('user_version', { simple: true })
  if (currentVersion < 1) migration_v1()
  if (currentVersion < 2) migration_v2()
  db.pragma(`user_version = ${SCHEMA_VERSION}`)
}

runMigrations()

// ── Column sets ──────────────────────────────────────────────────────────────

/*
  Transaction fields (from OFX STMTTRN):
    FITID, TRNTYPE, DTPOSTED, DTUSER, TRNAMT, NAME, MEMO,
    CHECKNUM, REFNUM, DTAVAIL, SRVRTID, PAYEEID, EXTDNAME, SIC

  App fields (set by user in the app):
    transactionType = income, expense, bills, variable (expenses)
    category        = main app category
    splitCategory1  = first split category
    splitAmount1    = first split amount
    splitCategory2  = second split category
    splitAmount2    = second split amount

  Account metadata now lives in the Accounts table, linked by ACCTID.
*/

// Valid columns for filtering — prevents SQL injection on dynamic column names
const VALID_COLUMNS = new Set([
  'FITID',
  'ACCTID',
  'TRNTYPE',
  'DTPOSTED',
  'DTUSER',
  'TRNAMT',
  'NAME',
  'MEMO',
  'CHECKNUM',
  'REFNUM',
  'DTAVAIL',
  'SRVRTID',
  'PAYEEID',
  'EXTDNAME',
  'SIC',
  'rawTransaction',
  'createdAt',
  'transactionType',
  'category',
  'splitCategory1',
  'splitAmount1',
  'splitCategory2',
  'splitAmount2'
])

// OFX date columns — use LIKE prefix matching so partial dates work
// e.g. '202605' → month, '20260506' → day, full timestamp → exact
const DATE_COLUMNS = new Set(['DTPOSTED', 'DTUSER', 'DTAVAIL'])

// ── Transaction reads ────────────────────────────────────────────────────────

// Get transactions by any field — defaults to current month by postedDate
const getTransactions = (filters = {}) => {
  const entries = Object.entries(filters).filter(([col]) => VALID_COLUMNS.has(col))

  if (entries.length === 0) {
    const now = new Date()
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    return db.prepare('SELECT * FROM Transactions WHERE DTPOSTED LIKE ?').all(`${yyyymm}%`)
  }

  const clauses = entries.map(([col]) => (DATE_COLUMNS.has(col) ? `${col} LIKE ?` : `${col} = ?`))
  const values = entries.map(([col, val]) => (DATE_COLUMNS.has(col) ? `${val}%` : val))

  return db.prepare(`SELECT * FROM Transactions WHERE ${clauses.join(' AND ')}`).all(...values)
}

// ── Transaction writes ───────────────────────────────────────────────────────

// Update a transaction by FITID — only whitelisted columns are accepted
const updateTransaction = (fitid, updates = {}) => {
  const entries = Object.entries(updates).filter(
    ([col]) => VALID_COLUMNS.has(col) && col !== 'FITID'
  )

  if (entries.length === 0) return 0

  const setClause = entries.map(([col]) => `${col} = ?`).join(', ')
  const values = entries.map(([, val]) => val)

  return db.prepare(`UPDATE Transactions SET ${setClause} WHERE FITID = ?`).run(...values, fitid)
    .changes
}

/**
 * Inserts a single transaction. Ignores duplicates on FITID (safe for OFX re-imports).
 * Account metadata must be upserted via upsertAccount() before calling this.
 *
 * @param {Object} txn - Transaction object from ofx.js extractTransactionData.
 * @returns {number} Rows inserted (0 = duplicate, 1 = inserted).
 */
function createTransaction(txn) {
  if (!txn) throw new Error('Transaction data is required to create a transaction.')
  if (!txn.FITID) throw new Error('A valid FITID is required to create a transaction.')

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO Transactions
      (FITID, ACCTID, TRNTYPE, DTPOSTED, DTUSER, TRNAMT, NAME, MEMO,
       CHECKNUM, REFNUM, DTAVAIL, SRVRTID, PAYEEID, EXTDNAME, SIC, rawTransaction)
    VALUES
      (@FITID, @ACCTID, @TRNTYPE, @DTPOSTED, @DTUSER, @TRNAMT, @NAME, @MEMO,
       @CHECKNUM, @REFNUM, @DTAVAIL, @SRVRTID, @PAYEEID, @EXTDNAME, @SIC, @rawTransaction)
  `)

  return stmt.run({ ...txn, rawTransaction: JSON.stringify(txn) }).changes
}

/**
 * Bulk-inserts an array of transactions inside a single SQLite transaction.
 * A mid-import crash leaves no partial state.
 *
 * @param {Object[]} txns - Array of transaction objects from ofx.js.
 * @returns {{ total: number, inserted: number, skipped: number }}
 */
function createTransactions(txns) {
  if (!Array.isArray(txns) || txns.length === 0) return { total: 0, inserted: 0, skipped: 0 }

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO Transactions
      (FITID, ACCTID, TRNTYPE, DTPOSTED, DTUSER, TRNAMT, NAME, MEMO,
       CHECKNUM, REFNUM, DTAVAIL, SRVRTID, PAYEEID, EXTDNAME, SIC, rawTransaction)
    VALUES
      (@FITID, @ACCTID, @TRNTYPE, @DTPOSTED, @DTUSER, @TRNAMT, @NAME, @MEMO,
       @CHECKNUM, @REFNUM, @DTAVAIL, @SRVRTID, @PAYEEID, @EXTDNAME, @SIC, @rawTransaction)
  `)

  let inserted = 0
  db.transaction((rows) => {
    for (const txn of rows) {
      inserted += stmt.run({ ...txn, rawTransaction: JSON.stringify(txn) }).changes
    }
  })(txns)

  return { total: txns.length, inserted, skipped: txns.length - inserted }
}

/**
 * Deletes transactions by FITID (single row) or ACCTID (all rows for that account).
 *
 * @param {string} id - The FITID or ACCTID to match.
 * @param {string} [type='FITID'] - 'FITID' or 'ACCTID'.
 * @returns {number} Rows deleted.
 */
function deleteTransaction(id, type = 'FITID') {
  if (!id) throw new Error('An ID is required to perform a deletion.')

  const searchType = type ? type.toUpperCase() : 'FITID'

  if (searchType === 'ACCTID') {
    return db.prepare('DELETE FROM Transactions WHERE ACCTID = ?').run(id).changes
  }

  if (searchType === 'FITID') {
    return db.prepare('DELETE FROM Transactions WHERE FITID = ?').run(id).changes
  }

  throw new Error(`Unsupported deletion type provided: ${type}`)
}

// ── Account writes ───────────────────────────────────────────────────────────

/**
 * Insert or update an account row. Updates metadata and lastImport on conflict.
 * Call this before createTransactions() on each OFX import.
 *
 * @param {{ ACCTID: string, ACCTTYPE?: string, ORG?: string, INTU_BID?: string }} acct
 */
function upsertAccount(acct) {
  if (!acct?.ACCTID) throw new Error('ACCTID is required to upsert an account.')

  db.prepare(
    `
    INSERT INTO Accounts (ACCTID, ACCTTYPE, ORG, INTU_BID, lastImport)
    VALUES (@ACCTID, @ACCTTYPE, @ORG, @INTU_BID, CURRENT_TIMESTAMP)
    ON CONFLICT(ACCTID) DO UPDATE SET
      ACCTTYPE   = excluded.ACCTTYPE,
      ORG        = excluded.ORG,
      INTU_BID   = excluded.INTU_BID,
      lastImport = CURRENT_TIMESTAMP
  `
  ).run(acct)
}

/** @returns {Object[]} All known accounts ordered by creation date. */
function getAccounts() {
  return db.prepare('SELECT * FROM Accounts ORDER BY createdAt').all()
}

/**
 * @param {string} acctid
 * @returns {Object|undefined} Account row, or undefined if not found.
 */
function getAccount(acctid) {
  return db.prepare('SELECT * FROM Accounts WHERE ACCTID = ?').get(acctid)
}

/**
 * Update writable account fields. Only displayName, ACCTTYPE, ORG, INTU_BID are allowed.
 *
 * @param {string} acctid
 * @param {Object} updates
 * @returns {number} Rows changed.
 */
function updateAccount(acctid, updates = {}) {
  const ALLOWED = new Set(['displayName', 'ACCTTYPE', 'ORG', 'INTU_BID'])
  const entries = Object.entries(updates).filter(([col]) => ALLOWED.has(col))

  if (entries.length === 0) return 0

  const setClause = entries.map(([col]) => `${col} = ?`).join(', ')
  const values = entries.map(([, val]) => val)

  return db.prepare(`UPDATE Accounts SET ${setClause} WHERE ACCTID = ?`).run(...values, acctid)
    .changes
}

/**
 * Delete an account and all of its transactions atomically.
 *
 * @param {string} acctid
 * @returns {number} Account rows deleted (0 or 1).
 */
function deleteAccount(acctid) {
  if (!acctid) throw new Error('ACCTID is required to delete an account.')

  return db.transaction(() => {
    db.prepare('DELETE FROM Transactions WHERE ACCTID = ?').run(acctid)
    return db.prepare('DELETE FROM Accounts WHERE ACCTID = ?').run(acctid).changes
  })()
}

// ── Reporting ────────────────────────────────────────────────────────────────

// TRNAMT is stored as TEXT (OFX format) — cast to REAL in SQL for aggregation

/**
 * @param {string} yyyymm - e.g. '202605'
 * @returns {{ transactionType: string, total: number }[]}
 */
function getMonthlySummary(yyyymm) {
  return db
    .prepare(
      `
    SELECT transactionType, SUM(CAST(TRNAMT AS REAL)) AS total
    FROM Transactions
    WHERE DTPOSTED LIKE ?
    GROUP BY transactionType
  `
    )
    .all(`${yyyymm}%`)
}

/**
 * @param {string} yyyymm - e.g. '202605'
 * @returns {{ category: string, total: number }[]}
 */
function getCategoryTotals(yyyymm) {
  return db
    .prepare(
      `
    SELECT category, SUM(CAST(TRNAMT AS REAL)) AS total
    FROM Transactions
    WHERE DTPOSTED LIKE ?
    GROUP BY category
  `
    )
    .all(`${yyyymm}%`)
}

/**
 * @param {string} yyyymm - e.g. '202605'
 * @returns {Object[]} Transactions with no category in the given month.
 */
function getUncategorized(yyyymm) {
  return db
    .prepare(
      `
    SELECT * FROM Transactions
    WHERE category IS NULL AND DTPOSTED LIKE ?
  `
    )
    .all(`${yyyymm}%`)
}

/**
 * @returns {{ ACCTID: string, count: number, total: number }[]}
 */
function getAccountSummary() {
  return db
    .prepare(
      `
    SELECT ACCTID, COUNT(*) AS count, SUM(CAST(TRNAMT AS REAL)) AS total
    FROM Transactions
    GROUP BY ACCTID
  `
    )
    .all()
}

/**
 * @returns {string[]} Distinct yyyymm strings that have transaction data, ascending.
 */
function getMonthsWithData() {
  return db
    .prepare(
      `
      SELECT DISTINCT SUBSTR(DTPOSTED, 1, 6) AS month
      FROM Transactions
      WHERE DTPOSTED IS NOT NULL
      ORDER BY month
    `
    )
    .all()
    .map((r) => r.month)
}

export default db
export {
  // Transactions
  getTransactions,
  createTransaction,
  createTransactions,
  updateTransaction,
  deleteTransaction,
  // Accounts
  upsertAccount,
  getAccounts,
  getAccount,
  updateAccount,
  deleteAccount,
  // Reporting
  getMonthlySummary,
  getCategoryTotals,
  getUncategorized,
  getAccountSummary,
  getMonthsWithData
}
