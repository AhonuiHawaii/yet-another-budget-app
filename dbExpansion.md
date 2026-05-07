# db.js Expansion Plan

## Executive Summary

The current `db.js` is a working but flat persistence layer. Every transaction row carries duplicated account metadata, imports are not atomic, and all aggregation happens outside the database. This document outlines a phased expansion to make `db.js` account-aware, import-safe, reporting-capable, and migration-ready — without breaking the existing layer contract or the `main.js` / `ipcHandler.js` service chain.

---

## Current State

```
Transactions (single table)
  FITID           — primary key
  ACCTID          — denormalized (last 4 digits)
  ACCTTYPE        — denormalized
  ORG             — denormalized
  INTU_BID        — denormalized
  TRNTYPE, DTPOSTED, DTUSER, TRNAMT, NAME, MEMO, ...
  rawTransaction  — JSON snapshot of original OFX row
  createdAt
  transactionType, category, splitCategory1/2, splitAmount1/2
```

**Known gaps:**
- Account metadata is repeated on every transaction row — no independent account identity.
- `createTransaction()` inserts one row per call with no wrapping SQLite transaction — a mid-import crash leaves partial data with no way to roll back.
- All aggregation (monthly totals, category sums, uncategorized counts) happens in the renderer or service layer rather than in SQL.
- No schema versioning — future `ALTER TABLE` changes have no safe migration path.

---

## Phase 1 — Atomic Bulk Import (No Schema Change)

**Priority: High. Correctness issue, not a structure issue.**

Wrap the per-row `createTransaction()` calls inside a single SQLite transaction block using `db.transaction()`. This guarantees that a batch of OFX rows either all land in the database or none do.

**Changes:**
- Add `createTransactions(txns)` (plural) to `db.js` — a batch function that runs all inserts inside `db.transaction()`.
- `createTransaction()` (singular) remains unchanged for single-row use.

**What this fixes:**
- Partial import state on crash or error.
- Performance — fewer SQLite write transactions for large OFX files.

**New export:**
```js
createTransactions(txns[]) → { total, inserted, skipped }
```

---

## Phase 2 — Accounts Table (Schema Change)

**Priority: High. Required for account-aware reads, deletes, and UI.**

Introduce a dedicated `Accounts` table. Account metadata (`ACCTTYPE`, `ORG`, `INTU_BID`) is promoted out of the transaction rows and stored once per account. Transactions retain `ACCTID` as a foreign key only.

**New schema:**

```sql
CREATE TABLE IF NOT EXISTS Accounts (
  ACCTID      TEXT PRIMARY KEY,   -- last 4 digits, normalized by ofx.js
  ACCTTYPE    TEXT,
  ORG         TEXT,
  INTU_BID    TEXT,
  displayName TEXT,               -- user-facing label, editable in UI
  createdAt   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lastImport  TEXT                -- timestamp of most recent OFX import
)
```

**Transactions table changes:**
- Remove `ACCTTYPE`, `ORG`, `INTU_BID` columns.
- `ACCTID` remains as FK reference to `Accounts`.

**New `db.js` exports:**

| Function | Behavior |
|---|---|
| `upsertAccount(acct)` | Insert or update account row on import |
| `getAccounts()` | Return all known accounts |
| `getAccount(acctid)` | Return one account with metadata |
| `updateAccount(acctid, updates)` | Update `displayName` or metadata |
| `deleteAccount(acctid)` | Delete account row (cascade deletes transactions) |

**Import flow update:**
1. `upsertAccount()` first — ensure account row exists.
2. `createTransactions()` — bulk insert rows scoped to that account.
3. `lastImport` timestamp updated on account row.

**Migration requirement:** Existing `Transactions` rows must have their account columns extracted into `Accounts` before the columns are dropped. Handled in Phase 4.

---

## Phase 3 — Reporting Functions

**Priority: Medium. Moves aggregation from the renderer into SQL where it belongs.**

All summary functions take a `yyyymm` string (e.g., `'202605'`) and use `DTPOSTED LIKE '202605%'` prefix matching, consistent with the existing date filter pattern.

**New `db.js` exports:**

| Function | SQL pattern | Returns |
|---|---|---|
| `getMonthlySummary(yyyymm)` | `SUM(CAST(TRNAMT AS REAL)) GROUP BY transactionType` | `[{ transactionType, total }]` |
| `getCategoryTotals(yyyymm)` | `SUM(CAST(TRNAMT AS REAL)) GROUP BY category` | `[{ category, total }]` |
| `getUncategorized(yyyymm)` | `WHERE category IS NULL AND DTPOSTED LIKE ?` | `Transaction[]` |
| `getAccountSummary()` | `SUM/COUNT GROUP BY ACCTID` | `[{ ACCTID, count, total }]` |
| `getMonthsWithData()` | `SELECT DISTINCT SUBSTR(DTPOSTED,1,6)` | `string[]` — for month picker |

**Notes:**
- `TRNAMT` is stored as `TEXT` (OFX format) — cast to `REAL` in SQL for aggregation.
- These are read-only functions. They expose prepared statements, not raw SQL.

---

## Phase 4 — Migration Runner

**Priority: Medium. Required before Phase 2 can be safely deployed to existing installs.**

Use SQLite's built-in `PRAGMA user_version` to track schema version. On startup, `db.js` compares the stored version against the expected version and runs any pending migrations in order.

**Pattern:**

```js
const SCHEMA_VERSION = 2

function runMigrations(currentVersion) {
  if (currentVersion < 1) migration_v1()  // initial schema (already applied)
  if (currentVersion < 2) migration_v2()  // Accounts table + column removal
  db.pragma(`user_version = ${SCHEMA_VERSION}`)
}
```

**Migration v2 steps:**
1. `CREATE TABLE IF NOT EXISTS Accounts (...)`.
2. `INSERT OR IGNORE INTO Accounts SELECT DISTINCT ACCTID, ACCTTYPE, ORG, INTU_BID, ... FROM Transactions`.
3. Create new `Transactions_new` without the account columns.
4. `INSERT INTO Transactions_new SELECT ... FROM Transactions`.
5. `DROP TABLE Transactions`.
6. `ALTER TABLE Transactions_new RENAME TO Transactions`.
7. Set `user_version = 2`.

All migration steps run inside `db.transaction()` so a failed migration does not corrupt the database.

---

## `db.js` Export Summary

| Phase | New Export |
|---|---|
| 1 | `createTransactions(txns[])` |
| 2 | `upsertAccount(acct)` |
| 2 | `getAccounts()` |
| 2 | `getAccount(acctid)` |
| 2 | `updateAccount(acctid, updates)` |
| 2 | `deleteAccount(acctid)` |
| 3 | `getMonthlySummary(yyyymm)` |
| 3 | `getCategoryTotals(yyyymm)` |
| 3 | `getUncategorized(yyyymm)` |
| 3 | `getAccountSummary()` |
| 3 | `getMonthsWithData()` |

---

## Execution Order

```
Phase 1 — Atomic bulk import       (no schema change, ship immediately)
Phase 4 — Migration runner          (required before Phase 2 touches live data)
Phase 2 — Accounts table            (schema change, behind migration v2)
Phase 3 — Reporting functions       (additive, no schema change)
```

Phase 1 and Phase 4 are prerequisites. Phase 2 and Phase 3 can be developed in parallel once the migration runner is in place.
