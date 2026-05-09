<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between flex-wrap gap-3 mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Debts</h1>
        <p class="text-body-1 text-medium-emphasis mt-1">
          Track monthly payoff progress across your credit card accounts
        </p>
      </div>
    </div>

    <v-card class="mb-6 bg-surface py-6 px-4" rounded="xl" elevation="0" border>
      <v-row no-gutters>
        <v-col cols="12" sm="3" class="text-center border-e border-opacity-25">
          <div
            class="text-caption text-uppercase font-weight-bold tracking-widest text-medium-emphasis mb-1"
          >
            Planned Payment
          </div>
          <div class="text-h4 font-weight-black text-white">
            {{ formatCurrency(totalProjected) }}
          </div>
        </v-col>
        <v-col cols="12" sm="3" class="text-center border-e border-opacity-25">
          <div
            class="text-caption text-uppercase font-weight-bold tracking-widest text-medium-emphasis mb-1"
          >
            Paid
          </div>
          <div class="text-h4 font-weight-black text-white">{{ formatCurrency(totalActual) }}</div>
        </v-col>
        <v-col cols="12" sm="3" class="text-center border-e border-opacity-25">
          <div
            class="text-caption text-uppercase font-weight-bold tracking-widest text-medium-emphasis mb-1"
          >
            Balance
          </div>
          <div class="text-h4 font-weight-black text-white">
            {{ formatCurrency(totalCurrentBalance) }}
          </div>
        </v-col>
        <v-col cols="12" sm="3" class="text-center">
          <div
            class="text-caption text-uppercase font-weight-bold tracking-widest text-medium-emphasis mb-1"
          >
            Utilization
          </div>
          <div
            class="text-h4 font-weight-black"
            :class="totalUtilization >= 70 ? 'text-warning' : 'text-white'"
          >
            {{ totalUtilization }}%
          </div>
        </v-col>
      </v-row>
    </v-card>

    <v-row class="mb-4" dense>
      <v-col cols="12" md="6">
        <v-card class="pa-4 h-100" rounded="xl" elevation="0" border>
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="font-weight-bold">Remaining Payment</div>
            <v-chip
              :color="remainingThisPeriod <= 0 ? 'success' : 'warning'"
              variant="tonal"
              size="small"
            >
              {{ formatCurrency(remainingThisPeriod) }}
            </v-chip>
          </div>
          <v-progress-linear
            :model-value="paymentCoverage"
            :color="paymentCoverage >= 100 ? 'success' : 'primary'"
            height="8"
            rounded
          />
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="pa-4 h-100" rounded="xl" elevation="0" border>
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="font-weight-bold">Highest Interest</div>
            <v-chip color="primary" variant="tonal" size="small">
              {{ highestInterestDebt?.name || 'None' }}
            </v-chip>
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ formatPercent(highestInterestDebt?.interestRate || 0) }} APR
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="bg-transparent" rounded="0" elevation="0">
      <div>
        <v-table density="comfortable" class="bg-transparent text-white" theme="dark">
          <thead>
            <tr>
              <th
                class="text-left font-weight-bold text-uppercase text-caption text-white pb-2 pt-4 pl-6 border-b-0"
              >
                Priority
              </th>
              <th
                class="text-center font-weight-bold text-uppercase text-caption text-white pb-2 pt-4 border-b-0"
              >
                Debt
              </th>
              <th
                class="text-center font-weight-bold text-uppercase text-caption text-white pb-2 pt-4 border-b-0"
              >
                Current Balance
              </th>
              <th
                class="text-center font-weight-bold text-uppercase text-caption text-white pb-2 pt-4 border-b-0"
              >
                Starting Balance
              </th>
              <th
                class="text-center font-weight-bold text-uppercase text-caption text-white pb-2 pt-4 border-b-0"
              >
                APR
              </th>
              <th
                class="text-center font-weight-bold text-uppercase text-caption text-white pb-2 pt-4 border-b-0"
              >
                Min Payment
              </th>
              <th
                class="text-center font-weight-bold text-uppercase text-caption text-white pb-2 pt-4 border-b-0"
              >
                Planned Payment
              </th>
              <th
                class="text-center font-weight-bold text-uppercase text-caption text-white pb-2 pt-4 border-b-0"
              >
                Paid
              </th>
              <th
                class="text-center font-weight-bold text-uppercase text-caption text-white pb-2 pt-4 border-b-0"
              >
                Credit Limit
              </th>
              <th
                class="text-center font-weight-bold text-uppercase text-caption text-white pb-2 pt-4 border-b-0"
              >
                Utilization
              </th>
              <th
                class="text-center font-weight-bold text-uppercase text-caption text-white pb-2 pt-4 border-b-0"
              >
                Payoff Progress
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="debtRows.length === 0">
              <td colspan="11" class="text-center py-8 text-medium-emphasis">
                No credit card accounts yet.
              </td>
            </tr>
            <tr v-for="(debt, idx) in debtRows" :key="debt.id" class="dashed-row">
              <td class="text-center text-medium-emphasis">
                {{ idx + 1 }}
              </td>
              <td class="font-weight-medium text-body-2 text-uppercase pl-4">
                <div>
                  {{ debt.name }}
                  <div class="text-caption text-medium-emphasis text-none">
                    {{ debt.accountType }}
                  </div>
                </div>
              </td>
              <td>
                <div class="d-flex justify-center">
                  <v-text-field
                    :model-value="debt.currentBalance"
                    type="number"
                    prefix="$"
                    variant="solo"
                    flat
                    density="compact"
                    hide-details
                    width="130"
                    class="mt-n2 mb-n2"
                    @update:model-value="
                      (val) => updateDebtDetail(debt.id, { currentBalance: val })
                    "
                  />
                </div>
              </td>
              <td>
                <div class="d-flex justify-center">
                  <v-text-field
                    :model-value="debt.startingBalance"
                    type="number"
                    prefix="$"
                    variant="solo"
                    flat
                    density="compact"
                    hide-details
                    width="130"
                    class="mt-n2 mb-n2"
                    @update:model-value="
                      (val) => updateDebtDetail(debt.id, { startingBalance: val })
                    "
                  />
                </div>
              </td>
              <td>
                <div class="d-flex justify-center">
                  <v-text-field
                    :model-value="debt.interestRate"
                    type="number"
                    suffix="%"
                    variant="solo"
                    flat
                    density="compact"
                    hide-details
                    width="100"
                    class="mt-n2 mb-n2"
                    @update:model-value="(val) => updateDebtDetail(debt.id, { interestRate: val })"
                  />
                </div>
              </td>
              <td>
                <div class="d-flex justify-center">
                  <v-text-field
                    :model-value="debt.minimumPayment"
                    type="number"
                    prefix="$"
                    variant="solo"
                    flat
                    density="compact"
                    hide-details
                    width="120"
                    class="mt-n2 mb-n2"
                    @update:model-value="
                      (val) => updateDebtDetail(debt.id, { minimumPayment: val })
                    "
                  />
                </div>
              </td>
              <td class="text-center">
                <div class="d-flex justify-center">
                  <v-text-field
                    :model-value="debt.projected"
                    type="number"
                    prefix="$"
                    variant="solo"
                    flat
                    density="compact"
                    hide-details
                    width="140"
                    class="mt-n2 mb-n2 text-center font-weight-bold"
                    @update:model-value="(val) => updateBudgetInline(debt.id, val)"
                  />
                </div>
              </td>
              <td class="text-center font-weight-bold">
                {{ formatCurrency(debt.actual) }}
              </td>
              <td>
                <div class="d-flex justify-center">
                  <v-text-field
                    :model-value="debt.creditLimit"
                    type="number"
                    prefix="$"
                    variant="solo"
                    flat
                    density="compact"
                    hide-details
                    width="130"
                    class="mt-n2 mb-n2"
                    @update:model-value="(val) => updateDebtDetail(debt.id, { creditLimit: val })"
                  />
                </div>
              </td>
              <td class="text-center font-weight-bold">
                <span :class="debt.utilization >= 70 ? 'text-warning' : 'text-medium-emphasis'">
                  {{ debt.utilization }}%
                </span>
              </td>
              <td class="text-center">
                <div class="d-flex align-center gap-2">
                  <v-progress-linear
                    :model-value="debt.progress"
                    :color="debt.progress >= 100 ? 'success' : 'primary'"
                    height="8"
                    rounded
                  />
                  <span class="text-caption">{{ debt.progressLabel }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUserAccountsStore } from '../stores/userAccounts'
import { useUserBudgetsStore } from '../stores/userBudgets'
import { useUserSettingsStore } from '../stores/userSettings'
import { useUserTransactionsStore } from '../stores/userTransactions'

const accountsStore = useUserAccountsStore()
const budgetsStore = useUserBudgetsStore()
const settingsStore = useUserSettingsStore()
const transactionsStore = useUserTransactionsStore()
const debtDetails = ref({})

const DEBT_DETAILS_KEY = 'budget.debtDetails'

// ── Period Picker Logic ───────────────────────────────────────────────────────
// Calculate the selected month bounds from the drawer setting.
const periodBounds = computed(() => {
  const y = parseInt(settingsStore.selectedMonth.slice(0, 4))
  const m = parseInt(settingsStore.selectedMonth.slice(4, 6)) - 1
  return {
    start: new Date(y, m, 1),
    end: new Date(y, m + 1, 0, 23, 59, 59, 999)
  }
})

async function applyPeriod() {
  await transactionsStore.fetchTransactionsByMonth(settingsStore.selectedMonth)
}

// ── Categories Management ──────────────────────────────────────────────────────
// ── Budgets Management ───────────────────────────────────────────────────────

async function updateBudgetInline(accountId, amount) {
  await budgetsStore.upsertBudget(accountId, Number(amount) || 0)
}

function loadDebtDetails() {
  try {
    debtDetails.value = JSON.parse(localStorage.getItem(DEBT_DETAILS_KEY) || '{}')
  } catch {
    debtDetails.value = {}
  }
}

function saveDebtDetails() {
  localStorage.setItem(DEBT_DETAILS_KEY, JSON.stringify(debtDetails.value))
}

function getDebtDetail(id) {
  return {
    currentBalance: 0,
    startingBalance: 0,
    interestRate: 0,
    minimumPayment: 0,
    creditLimit: 0,
    ...(debtDetails.value[id] || {})
  }
}

function updateDebtDetail(id, updates) {
  debtDetails.value = {
    ...debtDetails.value,
    [id]: {
      ...getDebtDetail(id),
      ...Object.fromEntries(
        Object.entries(updates).map(([key, value]) => [key, Number(value) || 0])
      )
    }
  }
  saveDebtDetails()
}

// ── Data Aggregation ─────────────────────────────────────────────────────────

const debtAccounts = computed(() =>
  accountsStore.accounts.filter((account) => {
    const accountType = String(account.ACCTTYPE || '').toLowerCase()
    return accountType.includes('credit')
  })
)

// Filter transactions to strictly within the period bounds
const currentTransactions = computed(() => {
  const bounds = periodBounds.value
  if (!bounds) return []

  return transactionsStore.transactions.filter((t) => {
    // DTPOSTED is YYYYMMDD...
    const s = String(t.DTPOSTED || '')
    const y = parseInt(s.slice(0, 4))
    const m = parseInt(s.slice(4, 6)) - 1
    const d = parseInt(s.slice(6, 8))
    const tDate = new Date(y, m, d)
    return tDate >= bounds.start && tDate <= bounds.end
  })
})

const paymentsByAccount = computed(() => {
  const payments = new Map()
  for (const t of currentTransactions.value) {
    const accountId = t.ACCTID
    const amount = Number(t.TRNAMT) || 0
    if (!accountId || amount <= 0) continue
    payments.set(accountId, (payments.get(accountId) || 0) + amount)
  }

  return payments
})

const debtRows = computed(() => {
  return debtAccounts.value
    .map((account) => {
      const accountId = account.ACCTID
      const details = getDebtDetail(accountId)
      const projected =
        budgetsStore.getBudget(accountId)?.amount || Number(details.minimumPayment) || 0
      const actual = paymentsByAccount.value.get(accountId) || 0
      const remaining = Math.max(projected - actual, 0)
      const rawProgress = projected > 0 ? (actual / projected) * 100 : 0
      const payoffProgress =
        details.startingBalance > 0
          ? ((details.startingBalance - details.currentBalance) / details.startingBalance) * 100
          : rawProgress
      const utilization =
        details.creditLimit > 0 ? (details.currentBalance / details.creditLimit) * 100 : 0

      return {
        id: accountId,
        name: account.displayName || account.ORG || `Account ${accountId}`,
        accountType: account.ACCTTYPE || 'Credit account',
        projected,
        actual,
        ...details,
        remaining,
        progress: Math.min(Math.max(payoffProgress, 0), 100),
        progressLabel: `${Math.round(Math.max(payoffProgress, 0))}%`,
        utilization: Math.round(utilization)
      }
    })
    .sort((a, b) => b.interestRate - a.interestRate || b.currentBalance - a.currentBalance)
})

const totalProjected = computed(() => debtRows.value.reduce((s, c) => s + c.projected, 0))
const totalActual = computed(() => debtRows.value.reduce((s, c) => s + c.actual, 0))
const totalCurrentBalance = computed(() => debtRows.value.reduce((s, c) => s + c.currentBalance, 0))
const totalCreditLimit = computed(() => debtRows.value.reduce((s, c) => s + c.creditLimit, 0))
const totalUtilization = computed(() => {
  if (!totalCreditLimit.value) return 0
  return Math.round((totalCurrentBalance.value / totalCreditLimit.value) * 100)
})
const remainingThisPeriod = computed(() => Math.max(totalProjected.value - totalActual.value, 0))
const paymentCoverage = computed(() => {
  if (!totalProjected.value) return 0
  return Math.min(Math.round((totalActual.value / totalProjected.value) * 100), 100)
})
const highestInterestDebt = computed(() => debtRows.value[0] || null)

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)
}

function formatPercent(val) {
  return `${Number(val || 0).toFixed(2)}%`
}

onMounted(async () => {
  loadDebtDetails()
  await Promise.all([accountsStore.fetchAccounts(), budgetsStore.fetchBudgets()])
  await applyPeriod()
})

watch(
  () => settingsStore.selectedMonth,
  async () => {
    await applyPeriod()
  }
)
</script>
