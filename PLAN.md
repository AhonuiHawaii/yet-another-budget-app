# Implementation Plan

Source of truth: `TODOFeatures.md`  
All paths relative to project root `e:/budget/`

---

## Phase 1 — Backend Hardening (No UI changes)

These are low-risk, self-contained fixes to the data layer. Do them first so every phase after builds on a correct foundation.

### 1.1 SQLite indexes on hot columns
**File:** `src/main/db.js` — after `db.pragma('journal_mode = WAL')`

```sql
CREATE INDEX IF NOT EXISTS idx_transactions_dtposted ON Transactions(DTPOSTED);
CREATE INDEX IF NOT EXISTS idx_transactions_acctid   ON Transactions(ACCTID);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON Transactions(category);
```

### 1.2 Enable foreign key enforcement
**File:** `src/main/db.js` — immediately after `db.pragma('journal_mode = WAL')`

```js
db.pragma('foreign_keys = ON')
```

### 1.3 Store full ACCTID, mask at the service layer
**File:** `src/main/ofx.js`
- Remove `.slice(-4)` from `extractAccountData` (line 43) and `extractTransactionData` (line 103–106).
- Full raw account number now flows into DB.

**File:** `src/main/main.js`
- Add a helper: `const maskAcctid = (id) => String(id || '').slice(-4)`
- Apply to every returned data object in:
  - `fetchAccounts()` — map each account row
  - `fetchAccount()` — single account row
  - `fetchTransactions()` — map each transaction row (ACCTID field)
  - `fetchAccountSummary()` — map each summary row
  - `importAccount()` — returned `data` object
  - `importTransactions()` — returned summary doesn't include ACCTID directly, so no change needed

> Frontend stores and views already display the masked value — no frontend changes required.

### 1.4 Add ORG column to Transactions, cascade on update
**File:** `src/main/db.js`

- Schema migration (runs safely on existing DB):
  ```sql
  ALTER TABLE Transactions ADD COLUMN ORG TEXT;
  ```
  Wrap in a try/catch or `IF NOT EXISTS` guard since `ALTER TABLE ADD COLUMN` throws if the column already exists in SQLite.

- `createTransaction` / `createTransactions` — add `ORG` to the INSERT column list and `@ORG` to VALUES. The field is already present on the transaction objects returned by `extractTransactionData`.

- `updateAccount` — after updating the Accounts row, if `ORG` is in the updates object, also run:
  ```sql
  UPDATE Transactions SET ORG = ? WHERE ACCTID = ?
  ```
  Wrap both in a `db.transaction()` so they're atomic.

- Add `ORG` to `VALID_COLUMNS` set so `getTransactions` can filter by it.

**File:** `src/main/main.js`
- `editAccount` already delegates to `updateAccount` — no change needed.

### 1.5 Fix getCategoryTotals and getMonthlySummary to include split legs
**File:** `src/main/db.js`

Replace `getCategoryTotals` with a UNION ALL across all three legs:

```sql
SELECT category, SUM(amount) AS total FROM (
  SELECT category, CAST(TRNAMT AS REAL) AS amount
  FROM Transactions
  WHERE DTPOSTED LIKE ? AND splitCategory1 IS NULL AND category IS NOT NULL

  UNION ALL

  SELECT splitCategory1 AS category, splitAmount1 AS amount
  FROM Transactions
  WHERE DTPOSTED LIKE ? AND splitCategory1 IS NOT NULL

  UNION ALL

  SELECT splitCategory2 AS category, splitAmount2 AS amount
  FROM Transactions
  WHERE DTPOSTED LIKE ? AND splitCategory2 IS NOT NULL
)
GROUP BY category
```

Apply equivalent UNION ALL logic to `getMonthlySummary` (grouping by `transactionType` instead of `category`).

Note: `TRNAMT` is stored as TEXT — the CAST is required until Phase 2 resolves that.

### 1.6 Change TRNAMT column type to REAL
**File:** `src/main/db.js`

SQLite cannot ALTER a column type in-place. The migration requires:
1. Create `Transactions_new` with `TRNAMT REAL`
2. `INSERT INTO Transactions_new SELECT ..., CAST(TRNAMT AS REAL), ... FROM Transactions`
3. `DROP TABLE Transactions`
4. `ALTER TABLE Transactions_new RENAME TO Transactions`
5. Recreate indexes

Wrap the entire migration in a `db.transaction()`. Add a guard so it only runs when the old TEXT type is detected (check `PRAGMA table_info(Transactions)` for TRNAMT type).

Remove all `CAST(TRNAMT AS REAL)` expressions from reporting queries after migration.

---

## Phase 2 — Store & App Fixes (Frontend, no new UI)

### 2.1 Fix shared loading mutex in all Pinia stores
**Files:** All stores under `src/renderer/src/stores/`
- `userTransactions.js`, `userAcounts.js`, `userCategories.js`, `userBudgets.js`, `userGoals.js`

Replace `const loading = ref(false)` with `const loadingCount = ref(0)`.  
Replace `loading.value = true` with `loadingCount.value++`  
Replace `loading.value = false` with `loadingCount.value--`  
Expose `const loading = computed(() => loadingCount.value > 0)` so all template bindings (`:loading="store.loading"`) continue to work without change.

### 2.2 Move initializeSelectedMonth to App.vue
**File:** `src/renderer/src/App.vue`
- Add `onMounted` that calls `transactionsStore.fetchMonthsWithData()` then `settingsStore.initializeSelectedMonth(transactionsStore.monthsWithData)`.
- Remove those two calls from the `onMounted` of every view that currently has them (Dashboard, Transactions, Income, Savings, Variable, Bills, Debt, Reports, Budgets, Goals).
- Views that still need month-specific data on mount can `watch(settingsStore.selectedMonth, ...)` — they already do this.

### 2.3 Add console.warn for unknown changeView names
**File:** `src/renderer/src/App.vue`

```js
const changeView = (viewName) => {
  if (!views[viewName]) {
    console.warn(`[App] Unknown view: "${viewName}"`)
    return
  }
  currentComponent.value = views[viewName]
}
```

### 2.4 Add Vue error boundary
**File:** `src/renderer/src/App.vue`

```js
import { onErrorCaptured, ref } from 'vue'
const appError = ref(null)
onErrorCaptured((err) => {
  appError.value = err.message
  return false
})
```

In template, wrap `<component :is="currentComponent" />` with a conditional that shows a recovery card when `appError` is set.

### 2.5 Rename userAcounts.js → userAccounts.js
**Files to update:**
- `src/renderer/src/stores/userAcounts.js` — rename file
- All views that import it: `Accounts.vue`, `Transactions.vue`, `Dashboard.vue`, `Reports.vue`, `Debt.vue`, `Budgets.vue`, `Income.vue`, `Bills.vue`, `Variable.vue`, `Savings.vue`
- Update the `defineStore('userAccounts', ...)` ID string to match (currently `'userAcounts'`)

---

## Phase 3 — Debt Details Persistence

### 3.1 Move debt details from localStorage to Dexie
**File:** `src/renderer/src/db/dexie.js` (or wherever Dexie is initialized)
- Add `debtDetails` table to the schema (new version bump):
  ```js
  .version(3).stores({
    ...existingStores,
    debtDetails: 'id, currentBalance, startingBalance, interestRate, minimumPayment, creditLimit, updatedAt'
  })
  ```

**New file:** `src/renderer/src/stores/userDebtDetails.js`
- Pinia store (same pattern as `userGoals.js`)
- State: `details` (array or map keyed by accountId)
- Actions: `fetchDebtDetails()`, `upsertDebtDetail(accountId, updates)`, `deleteDebtDetail(accountId)`
- Auto-fetch on init

**File:** `src/renderer/src/views/Debt.vue`
- Remove all `localStorage` read/write (`DEBT_DETAILS_KEY`, `loadDebtDetails`, `saveDebtDetails`, `getDebtDetail`, `updateDebtDetail`)
- Import and use `useUserDebtDetailsStore` instead
- `updateDebtDetail(id, updates)` → `debtDetailsStore.upsertDebtDetail(id, updates)`
- `getDebtDetail(id)` → `debtDetailsStore.details.find(d => d.id === id) || defaultValues`

### 3.2 Verify paymentsByAccount direction
**File:** `src/renderer/src/views/Debt.vue` — `paymentsByAccount` computed (line ~402)

Current filter: `if (!accountId || amount <= 0) continue` — only sums positive amounts.

In OFX for credit cards: charges are positive, payments (reducing balance) are negative.  
**Action:** Test with a real OFX file. If payments are negative, change the filter to `amount >= 0` → flip to `amount < 0` (and use `Math.abs(amount)`) so "Paid" reflects actual payments, not charges.

---

## Phase 4 — Feature: Transaction Notes

**Scope:** Smallest self-contained new feature — good warm-up before larger additions.

### Backend
**File:** `src/main/db.js`
- Migration: `ALTER TABLE Transactions ADD COLUMN notes TEXT`
- Add `notes` to `VALID_COLUMNS` set
- No other backend changes — `updateTransaction` already handles arbitrary whitelisted fields

**File:** `src/main/ipcHandler.js` — no change needed (already routes `transactions:edit`)

### Frontend
**File:** `src/renderer/src/views/Transactions.vue`
- Add a notes icon button per row (next to the pencil/split/delete actions)
- Opens a simple dialog: single `v-textarea`, save calls `store.editTransaction(FITID, { notes })`
- Display notes as a subtitle under the description if non-null

---

## Phase 5 — Feature: Bulk Recategorization

**Scope:** High daily-use value. Builds on existing `editTransaction`.

### Frontend only
**File:** `src/renderer/src/views/Transactions.vue`
- Add a checkbox column (using Vuetify's `v-data-table` `show-select` or manual `v-checkbox` per row)
- When 1+ rows selected, show a bulk action toolbar (count badge + "Set Category" button)
- "Set Category" opens a dialog: single category dropdown, applies `store.editTransaction` in a loop (sequential or `Promise.all`)
- After bulk edit, clear selection and refresh

---

## Phase 6 — Feature: Auto-Categorization Rules Engine

**Scope:** Highest long-term value. Requires new DB table and rule evaluation logic.

### Backend
**File:** `src/main/db.js`
- New table:
  ```sql
  CREATE TABLE IF NOT EXISTS CategoryRules (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    field     TEXT NOT NULL,  -- 'NAME', 'MEMO', 'TRNAMT', 'TRNTYPE'
    operator  TEXT NOT NULL,  -- 'contains', 'equals', 'startsWith', 'gt', 'lt'
    value     TEXT NOT NULL,
    category  TEXT NOT NULL,
    type      TEXT,           -- transactionType to assign
    priority  INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
  ```
- Functions: `getRules()`, `createRule(rule)`, `updateRule(id, updates)`, `deleteRule(id)`
- `applyRules(transactions)` — evaluates rules in priority order against each transaction, returns array of `{ FITID, category, transactionType }` patches

**File:** `src/main/ipcHandler.js`
- Add routes: `rules:fetch`, `rules:create`, `rules:update`, `rules:delete`, `rules:applyToMonth`

**File:** `src/main/main.js`
- `importTransactions` — after `createTransactions`, call `applyRules` and batch-update matching transactions
- `applyRulesToMonth(yyyymm)` — fetch all uncategorized transactions for month, run rules, update

### Frontend
**New store:** `src/renderer/src/stores/userRules.js`

**New view:** `src/renderer/src/views/Rules.vue` (add to App.vue views map and Drawer nav)
- Table: field, operator, value, category, type, priority — inline edit
- "Add Rule" dialog
- "Apply to [Month]" button — runs `rules:applyToMonth` for selectedMonth, then refreshes transactions

---

## Phase 7 — Feature: Manual Transaction Entry

**Scope:** Extends import flow with a manual form path.

### Backend
**File:** `src/main/db.js`
- Add `isManual INTEGER DEFAULT 0` column to Transactions (migration)
- Manual transactions get a synthetic FITID: `MANUAL-{timestamp}-{random}`

**File:** `src/main/ipcHandler.js` — add `transactions:create` route

**File:** `src/main/main.js` — add `createTransaction(txnData)` service function

### Frontend
**File:** `src/renderer/src/views/Transactions.vue`
- Add "Add Transaction" button next to "Import"
- Dialog form: Date picker, Amount (+ / − toggle), Payee (NAME), Category, Account dropdown, Type
- On submit: call new `transactions:create` IPC, then refresh

---

## Phase 8 — Feature: Spending Trends Charts

**Scope:** Pure visualization layer over existing data.

### Dependency
Add `chart.js` + `vue-chartjs` (or `recharts` — check Vue 3 compatibility):
```
pnpm add chart.js vue-chartjs
```

### Backend
**File:** `src/main/db.js`
- New function `getMonthlyTotals()`:
  ```sql
  SELECT SUBSTR(DTPOSTED,1,6) AS month,
         SUM(CASE WHEN CAST(TRNAMT AS REAL) > 0 THEN CAST(TRNAMT AS REAL) ELSE 0 END) AS income,
         SUM(CASE WHEN CAST(TRNAMT AS REAL) < 0 THEN ABS(CAST(TRNAMT AS REAL)) ELSE 0 END) AS spending
  FROM Transactions
  GROUP BY month ORDER BY month
  ```

**File:** `src/main/ipcHandler.js` — add `reports:monthlyTotals` route

### Frontend
**File:** `src/renderer/src/views/Reports.vue`
- Add a "Trends" section with a line chart: X = months, Y = income vs spending
- Data: new IPC call `reports:monthlyTotals` fetched on mount

---

## Phase 9 — Feature: Debt Payoff Projections

**Scope:** Pure computation from existing debt detail data. No new DB tables.

### Frontend only
**File:** `src/renderer/src/views/Debt.vue`

Add `projectionRows` computed:
```js
// For each debt row, calculate payoff date and total interest
function calculatePayoff(balance, apr, monthlyPayment) {
  if (!monthlyPayment || !balance) return null
  const monthlyRate = apr / 100 / 12
  if (monthlyRate === 0) {
    return { months: Math.ceil(balance / monthlyPayment), interest: 0 }
  }
  const months = Math.ceil(
    -Math.log(1 - (monthlyRate * balance) / monthlyPayment) / Math.log(1 + monthlyRate)
  )
  const totalPaid = monthlyPayment * months
  return { months, interest: totalPaid - balance }
}
```

Add a collapsible "Payoff Projection" panel below the main table showing:
- Months to payoff per debt (formatted as "X months / Month Year")
- Total interest to be paid
- Avalanche vs Snowball order comparison

---

## Phase 10 — Feature: Budget Rollover

**Scope:** New Dexie table + budget store enhancement.

**File:** Dexie schema (version bump)
- New table: `budgetRollovers: 'id, categoryId, month, rolloverAmount, createdAt'`

**File:** `src/renderer/src/stores/userBudgets.js`
- New flag per budget: `rolloverEnabled` (add column to budgets table in Dexie)
- New action: `calculateRollover(categoryId, month)` — looks up prior month actual vs budget, returns unused amount
- Expose `getEffectiveBudget(categoryId, month)` = base budget + rollover amount

**File:** Budget views (Income, Savings, Variable, Bills) — use `getEffectiveBudget` instead of `getBudget` for planned column display, show rollover amount as a small annotation.

---

## Verification Checklist (per Phase)

After each phase:
1. `pnpm dev` — app launches, no console errors
2. Import a real OFX file — accounts and transactions appear correctly
3. Phase 1: Check that ACCTID shown in UI is last 4 digits; verify in SQLite browser that full number is stored
4. Phase 1: Import same OFX twice — no duplicate transactions
5. Phase 1: Edit a transaction category — Reports view category totals update correctly (including splits)
6. Phase 2: Navigate between all views rapidly — no loading state stuck
7. Phase 3: Enter debt details, close and reopen app — details persist
8. Phase 4+: Each feature works end-to-end on its golden path

---

## File Change Index

| File | Phases |
|---|---|
| `src/main/db.js` | 1.1, 1.2, 1.4, 1.5, 1.6, 6, 7, 8 |
| `src/main/ofx.js` | 1.3 |
| `src/main/main.js` | 1.3, 1.4, 6, 7 |
| `src/main/ipcHandler.js` | 6, 7, 8 |
| `src/renderer/src/App.vue` | 2.2, 2.3, 2.4 |
| `src/renderer/src/stores/userAcounts.js` → `userAccounts.js` | 2.5 |
| `src/renderer/src/stores/userTransactions.js` | 2.1 |
| `src/renderer/src/stores/userBudgets.js` | 2.1, 10 |
| `src/renderer/src/stores/userGoals.js` | 2.1 |
| `src/renderer/src/stores/userCategories.js` | 2.1 |
| `src/renderer/src/stores/userDebtDetails.js` | 3.1 (new) |
| `src/renderer/src/stores/userRules.js` | 6 (new) |
| `src/renderer/src/views/Debt.vue` | 3.1, 3.2, 9 |
| `src/renderer/src/views/Transactions.vue` | 4, 5 |
| `src/renderer/src/views/Reports.vue` | 8 |
| `src/renderer/src/views/Rules.vue` | 6 (new) |
| `src/renderer/src/views/Income.vue` | 10 |
| `src/renderer/src/views/Bills.vue` | 10 |
| `src/renderer/src/views/Variable.vue` | 10 |
| `src/renderer/src/views/Savings.vue` | 10 |
| `src/renderer/src/components/Drawer.vue` | 6 (add Rules nav item) |
| Dexie schema file | 3.1, 10 |
