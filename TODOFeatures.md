# Proposed Changes (Bug Fixes & Improvements)

---

## Fix: Store full ACCTID in backend, mask to last 4 before returning to frontend
Currently `ofx.js` truncates ACCTID to last 4 digits (`.slice(-4)`) before it ever reaches the database. Two accounts at the same bank with different numbers but the same last 4 digits would collide on the primary key.

**Changes needed:**
- `ofx.js` — remove `.slice(-4)` from both `extractAccountData` and `extractTransactionData`. Store the full account number.
- `db.js` — no schema change required; ACCTID is already `TEXT PRIMARY KEY`.
- `main.js` — mask ACCTID to last 4 digits on every function that returns data to the frontend (`fetchAccounts`, `fetchAccount`, `fetchTransactions`, `fetchAccountSummary`). The masking belongs in the service layer so the full number never crosses the IPC bridge.
- Frontend stores and views already display the masked value; no changes needed there.

---

## Fix: ORG must be included in transaction responses, and ORG updates must cascade to Transactions
ORG (bank name) is stored on the Accounts table but is not present on rows returned by `getTransactions`. The frontend currently looks up ORG separately via the accounts store, which creates a two-store dependency just to show the bank name on a transaction row.

**Changes needed:**
- `db.js` — add `ORG TEXT` column to the Transactions table (migration: `ALTER TABLE Transactions ADD COLUMN ORG TEXT`).
- `ofx.js` / `createTransactions` — populate `ORG` from the account data already present on each transaction object during import.
- `db.js` `updateAccount` — when `ORG` is in the updates, also run `UPDATE Transactions SET ORG = ? WHERE ACCTID = ?` inside the same call so both tables stay in sync.
- `main.js` `editAccount` — no change needed; it already delegates to `updateAccount`.
- Frontend — can now read `ORG` directly off each transaction object without a separate accounts lookup.

---

## Fix: getCategoryTotals ignores split transaction legs
`getCategoryTotals` in `src/main/db.js` groups by the main `category` column using the full `TRNAMT`. Split transactions store their amounts in `splitAmount1`/`splitAmount2` under different categories, but the query never reads those columns. Category totals in Reports are wrong for any split transaction.

Fix: replace the single SELECT with a UNION ALL across all three legs (main category, split leg 1, split leg 2), then GROUP BY and SUM the combined result. Apply the same fix to `getMonthlySummary`.

---

## Fix: Debt details stored in localStorage — move to Dexie
Current balance, starting balance, APR, credit limit, and minimum payment in `Debt.vue` are written to `localStorage` (`budget.debtDetails`). Clearing app data or reinstalling silently wipes all of it. Add a `debtDetails` table to the Dexie schema (same DB used by goals/budgets) so it shares the same durability characteristics.

---

## Fix: No SQLite indexes on hot columns
Every query filters or aggregates on `DTPOSTED`, `ACCTID`, and `category`, but no indexes exist. Add to the schema initialization in `src/main/db.js`:

```sql
CREATE INDEX IF NOT EXISTS idx_transactions_dtposted ON Transactions(DTPOSTED);
CREATE INDEX IF NOT EXISTS idx_transactions_acctid   ON Transactions(ACCTID);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON Transactions(category);
```

---

## Fix: Foreign key enforcement disabled
SQLite foreign keys are off by default and never enabled. `Transactions.ACCTID` has no enforced reference to `Accounts.ACCTID`. Add `db.pragma('foreign_keys = ON')` immediately after opening the DB in `src/main/db.js`. The `deleteAccount` function already handles cascading correctly, so this is purely additive safety.

---

## Fix: TRNAMT stored as TEXT
The `TRNAMT` column is declared `TEXT` and cast to `REAL` in every aggregate query (`CAST(TRNAMT AS REAL)`). Change the column type to `REAL` in the schema. The raw OFX string is already preserved in `rawTransaction` as a JSON backup, so nothing is lost.

---

## Fix: Shared `loading` mutex across all store operations
All actions in every Pinia store share a single `loading` ref. If two operations overlap (e.g., a background `fetchReports` and a foreground `editTransaction`), the first to finish sets `loading = false` while the other is still running, or the second clobbers the first's loading state. Replace with a counter (`loading.value++` / `loading.value--`, show spinner when `> 0`) or per-operation booleans for operations that need to be independent.

---

## Fix: `paymentsByAccount` may be counting charges instead of payments
In `Debt.vue`, `paymentsByAccount` skips transactions where `amount <= 0`. In standard OFX for credit cards, charges are **positive** (debt increases) and payments are **negative** (debt decreases). If that convention holds for your OFX files, the "Paid" column is summing new charges, not actual payments made toward the balance. Verify against a real OFX file and invert the filter if needed.

---

## Fix: `initializeSelectedMonth` called on every view mount
Every view calls `settingsStore.initializeSelectedMonth(...)` inside its `onMounted`. This is redundant — the function is idempotent but still runs unnecessary logic on each navigation. Move the single initialization call to `App.vue`'s `onMounted` so it runs once at startup.

---

## Fix: `changeView` silently swallows unknown view names
In `App.vue`, `views[viewName]` returns `undefined` for any unrecognized name and the navigation silently does nothing. Add a `console.warn` in development so typos in emit payloads are caught immediately.

---

## Fix: Typo in store filename
`src/renderer/src/stores/userAcounts.js` is missing a `c` (should be `userAccounts.js`). All imports reference the misspelled name, so a rename needs to be done across all consumers at once.

---

## Fix: No Vue error boundary
An unhandled exception inside any view component crashes the entire app with a blank screen. Add `onErrorCaptured` in `App.vue` to catch and display a recovery UI instead of a white screen, so users can navigate away without restarting.

---

---

# Feature Ideas

---

## Auto-Categorization Rules Engine
Let users define rules like "if payee contains 'AMAZON' → Shopping" or "if amount is exactly $12.99 → Streaming". Rules run automatically on import and can be applied retroactively to existing transactions. Priority order matters (first match wins). This would be the single highest-value feature for daily use — manual categorization is the main friction point in any budget app.

---

## Manual Transaction Entry
OFX only covers bank-linked accounts. Cash spending, Venmo payments, and peer-to-peer transfers are invisible. Add a form to manually enter a transaction (date, amount, payee, category, account). Manually entered transactions should be visually distinct from imported ones and excluded from OFX duplicate checks.

---

## Recurring Transaction Detection
After a few months of data, automatically surface transactions that appear on a regular cadence (same payee, similar amount, same day of month). Let the user confirm them as recurring bills. This feeds into bill tracking and can warn when an expected bill hasn't posted yet.

---

## Budget Rollover
Optionally carry unused budget from one month to the next (e.g., if you budget $100 for dining and only spend $60, next month's dining budget becomes $140). Useful for irregular categories like car maintenance or medical. Toggle per-category.

---

## Debt Payoff Projections
Given current balance, APR, and planned payment, calculate:
- Payoff date
- Total interest paid
- Side-by-side comparison of avalanche (highest APR first) vs snowball (lowest balance first) strategies

This turns the Debt view from a tracker into a planning tool.

---

## Net Worth Tracker
A single running total: assets (account balances you input) minus liabilities (debt balances). Chart it over time as months of data accumulate. Even a simple manual entry per month would give a meaningful trend line.

---

## Spending Trends Charts
Line/bar charts over 3, 6, or 12 months for:
- Total spending by month
- Per-category spending over time
- Income vs expenses trend

Recharts or Chart.js integrates cleanly with Vue. The data is already all in SQLite — it's purely a visualization layer.

---

## Year-Over-Year Comparison
Side-by-side table: "May 2025 vs May 2026" for each category. Highlights categories where spending increased or decreased significantly. Useful for spotting lifestyle creep.

---

## Payee/Merchant Name Normalization
OFX payee names are raw bank strings like "SQ *COFFEE SHOP 123-456-7890". A normalization layer lets users alias messy payee names to clean display names ("SQ *COFFEE SHOP" → "Blue Bottle Coffee"). Normalized names are used everywhere in the UI and in auto-categorization rules.

---

## Transaction Notes
A free-text notes field per transaction, separate from the OFX MEMO. Useful for "reimbursed by work" or "split with roommate" context that doesn't belong in the category field.

---

## Sub-Categories
Two-level category hierarchy (e.g., Food → Groceries, Food → Dining Out). Budgets and reports roll up to the parent. Existing single-level categories become top-level groups. This enables more granular tracking without losing summary views.

---

## Bill Calendar
A calendar view (monthly grid) showing expected bill due dates derived from recurring transaction detection. Color-coded: paid (green), upcoming (neutral), overdue (red). Complements the Bills view without replacing it.

---

## Bulk Recategorization
Select multiple transactions (checkboxes in the Transactions table) and assign a category, transaction type, or apply an auto-rule to all of them at once. Essential for first-time setup when months of imports arrive uncategorized.

---

## Goals: Linked Savings Account
Allow a goal to be linked to a specific account (e.g., "Vacation Fund" → linked to savings account ••••5678). The goal's current amount auto-updates from the account's running balance rather than requiring manual input.