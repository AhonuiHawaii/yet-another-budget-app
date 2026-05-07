// Better-Sqlite3
import Database from 'better-sqlite3'

/*




*/

function createTables() {
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
}
