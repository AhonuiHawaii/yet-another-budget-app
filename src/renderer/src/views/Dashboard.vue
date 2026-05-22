<template>
  <v-container fluid class="pa-3">
    <div class="d-flex justify-center align-center mb-3">
      <v-btn variant="tonal" density="comfortable" rounded="lg" @click="prevMonth">
        <v-icon start size="16">mdi-chevron-left</v-icon>
        {{ prevMonthLabel }}
      </v-btn>
      <span class="text-subtitle-1 font-weight-bold mx-6">{{ monthLabel(selectedMonth) }}</span>
      <v-btn variant="tonal" density="comfortable" rounded="lg" :disabled="isNextMonthFuture" @click="nextMonth">
        {{ nextMonthLabel }}
        <v-icon end size="16">mdi-chevron-right</v-icon>
      </v-btn>
    </div>

    <v-alert v-if="dashboardError" type="error" variant="tonal" class="mb-3">
      {{ dashboardError }}
    </v-alert>

    <!-- Stat Cards -->
    <v-row class="mb-3">
      <v-col cols="12" sm="6" lg="3">
        <v-card rounded elevation="2" class="h-100">
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between">
              <div class="flex-grow-1">
                <div class="d-flex align-center mb-2">
                  <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis"
                    >Income</span
                  >
                  <v-spacer />
                  <v-icon color="success" size="16" :opacity="0.4"
                    >mdi-arrow-down-circle-outline</v-icon
                  >
                </div>
                <div class="text-h5 font-weight-black text-success">
                  {{ formatCurrency(totalIncome) }}
                </div>
              </div>
              <div style="width: 68px; height: 68px; flex-shrink: 0; margin-left: 12px">
                <Doughnut :data="incomeChartData" :options="miniChartOptions" />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card rounded elevation="2" class="h-100">
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between">
              <div class="flex-grow-1">
                <div class="d-flex align-center mb-2">
                  <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis"
                    >Spending</span
                  >
                  <v-spacer />
                  <v-icon color="error" size="16" :opacity="0.4"
                    >mdi-arrow-up-circle-outline</v-icon
                  >
                </div>
                <div class="text-h5 font-weight-black text-error">
                  {{ formatCurrency(totalSpending) }}
                </div>
              </div>
              <div style="width: 68px; height: 68px; flex-shrink: 0; margin-left: 12px">
                <Doughnut :data="spendingChartData" :options="miniChartOptions" />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card rounded elevation="2" class="h-100">
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between">
              <div class="flex-grow-1">
                <div class="d-flex align-center mb-2">
                  <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis"
                    >Net</span
                  >
                  <v-spacer />
                  <v-icon :color="netCashFlow >= 0 ? 'success' : 'error'" size="16" :opacity="0.4"
                    >mdi-trending-up</v-icon
                  >
                </div>
                <div
                  class="text-h5 font-weight-black"
                  :class="netCashFlow >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ formatCurrency(netCashFlow) }}
                </div>
              </div>
              <div style="width: 68px; height: 68px; flex-shrink: 0; margin-left: 12px">
                <Doughnut :data="netChartData" :options="miniChartOptions" />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card rounded elevation="2" class="h-100">
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between">
              <div class="flex-grow-1">
                <div class="d-flex align-center mb-2">
                  <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis"
                    >Remaining</span
                  >
                  <v-spacer />
                  <v-icon
                    :color="budgetVariance >= 0 ? 'success' : 'warning'"
                    size="16"
                    :opacity="0.4"
                    >mdi-wallet-outline</v-icon
                  >
                </div>
                <div
                  class="text-h5 font-weight-black"
                  :class="budgetVariance >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ formatCurrency(budgetVariance) }}
                </div>
              </div>
              <div style="width: 68px; height: 68px; flex-shrink: 0; margin-left: 12px">
                <Doughnut :data="remainingChartData" :options="miniChartOptions" />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="9">
        <v-card rounded elevation="2" class="mb-3">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="primary" size="20" :opacity="0.7">mdi-view-dashboard-outline</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">Monthly Summary</v-card-title>
          </v-card-item>

          <v-table density="compact" class="mt-2">
            <thead>
              <tr>
                <th class="text-start text-caption text-medium-emphasis pl-5">Group</th>
                <th class="text-center text-caption text-medium-emphasis">Budget</th>
                <th class="text-center text-caption text-medium-emphasis">Actual</th>
                <th class="text-center text-caption text-medium-emphasis" style="min-width: 140px">
                  Progress
                </th>
                <th class="text-center text-caption text-medium-emphasis pr-5">Left</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="group in groupSummary" :key="group.type">
                <td class="pl-5 text-body-2 font-weight-medium" :class="`text-${group.color}`">
                  {{ group.label }}
                </td>
                <td class="text-center text-body-2">{{ formatCurrency(group.budget) }}</td>
                <td class="text-center text-body-2 font-weight-medium">
                  {{ formatCurrency(group.actual) }}
                </td>
                <td class="text-center">
                  <div class="d-flex align-center gap-2 px-2">
                    <v-progress-linear
                      :model-value="group.progress"
                      :color="group.progressColor"
                      height="4"
                      rounded
                    />
                    <span class="text-caption text-medium-emphasis" style="min-width: 32px">{{
                      group.progressLabel
                    }}</span>
                  </div>
                </td>
                <td
                  class="text-center text-body-2 font-weight-bold pr-5"
                  :class="group.remaining >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ formatCurrency(group.remaining) }}
                </td>
              </tr>
            </tbody>
          </v-table>

          <v-row no-gutters class="mt-1">
            <v-col cols="6">
              <v-list-item class="py-3 px-5">
                <v-list-item-title class="text-body-2 font-weight-medium"
                  >Planned Net</v-list-item-title
                >
                <template #append>
                  <span class="text-body-2 font-weight-bold">{{ formatCurrency(plannedNet) }}</span>
                </template>
              </v-list-item>
            </v-col>
            <v-col cols="6">
              <v-list-item class="py-3 px-5">
                <v-list-item-title class="text-body-2 font-weight-medium"
                  >Uncategorized</v-list-item-title
                >
                <template #append>
                  <span
                    class="text-body-2 font-weight-bold"
                    :class="
                      transactionsStore.uncategorized.length ? 'text-warning' : 'text-success'
                    "
                    >{{ transactionsStore.uncategorized.length }}</span
                  >
                </template>
              </v-list-item>
            </v-col>
          </v-row>
        </v-card>

        <!-- Recent Transactions -->
        <v-card rounded elevation="2">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="primary" size="20" :opacity="0.7">mdi-receipt-text-outline</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">Recent Transactions</v-card-title>
          </v-card-item>

          <div class="py-1">
            <div
              v-if="recentTransactions.length === 0"
              class="py-4 text-center text-medium-emphasis text-body-2"
            >
              No transactions this month.
            </div>
            <template v-for="transaction in recentTransactions" :key="transaction.FITID">
              <div class="d-flex align-center justify-space-between px-5 py-3">
                <div>
                  <div class="text-body-2 font-weight-medium">
                    {{ transaction.NAME || transaction.MEMO || transaction.FITID }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatTransactionDate(transaction.DTPOSTED) }}
                  </div>
                </div>
                <span
                  class="text-body-2 font-weight-bold"
                  :class="Number(transaction.TRNAMT) >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ formatCurrency(Number(transaction.TRNAMT) || 0) }}
                </span>
              </div>
            </template>
          </div>
        </v-card>
      </v-col>

      <!-- Right column -->
      <v-col cols="12" lg="3">
        <!-- Top Spending -->
        <v-card rounded elevation="2" class="mb-3">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="primary" size="20" :opacity="0.7">mdi-chart-donut</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">Top Spending</v-card-title>
          </v-card-item>

          <div class="py-1">
            <div
              v-if="topSpendingCategories.length === 0"
              class="py-4 text-center text-medium-emphasis text-body-2"
            >
              No categorized spending yet.
            </div>
            <template v-for="(category, i) in topSpendingCategories" :key="category.name">
              <div class="d-flex align-center px-5 py-3">
                <v-avatar
                  size="26"
                  :color="['error', 'warning', 'info', 'secondary', 'primary'][i % 5]"
                  variant="tonal"
                  class="text-caption font-weight-bold mr-3 flex-shrink-0"
                >
                  {{ i + 1 }}
                </v-avatar>
                <span class="text-body-2 font-weight-medium flex-grow-1">{{ category.name }}</span>
                <span class="text-body-2 font-weight-bold">{{
                  formatCurrency(category.total)
                }}</span>
              </div>
            </template>
          </div>
        </v-card>

        <!-- Goals -->
        <v-card rounded elevation="2">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="primary" size="20" :opacity="0.7">mdi-flag-outline</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">Goals</v-card-title>
          </v-card-item>

          <div class="py-1">
            <div
              v-if="goalRows.length === 0"
              class="py-4 text-center text-medium-emphasis text-body-2"
            >
              No goals configured.
            </div>
            <template v-for="goal in goalRows" :key="goal.id">
              <div class="d-flex align-center px-5 py-3">
                <div class="flex-grow-1">
                  <div class="text-body-2 font-weight-medium mb-1">{{ goal.name }}</div>
                  <v-progress-linear
                    :model-value="goal.progress"
                    :color="goal.status === 'completed' ? 'success' : 'primary'"
                    height="4"
                    rounded
                  />
                </div>
                <span class="text-caption text-medium-emphasis ml-3">{{ goal.progressLabel }}</span>
              </div>
            </template>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import { Doughnut } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip)
import { useUserAccountsStore } from '../stores/userAccounts'
import { useUserBudgetsStore } from '../stores/userBudgets'
import { useUserCategoriesStore } from '../stores/userCategories'
import { useUserGoalsStore } from '../stores/userGoals'
import { useUserTransactionsStore } from '../stores/userTransactions'

const accountsStore = useUserAccountsStore()
const budgetsStore = useUserBudgetsStore()
const categoriesStore = useUserCategoriesStore()
const goalsStore = useUserGoalsStore()
const transactionsStore = useUserTransactionsStore()
const dashboardError = ref(null)

function currentMonthValue() {
  const now = new Date()
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
}
function monthLabel(yyyymm) {
  const year = Number(yyyymm.slice(0, 4))
  const month = Number(yyyymm.slice(4)) - 1
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
function offsetMonth(yyyymm, delta) {
  const year = Number(yyyymm.slice(0, 4))
  const month = Number(yyyymm.slice(4)) - 1
  const d = new Date(year, month + delta, 1)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
}
function shortMonthLabel(yyyymm) {
  const year = Number(yyyymm.slice(0, 4))
  const month = Number(yyyymm.slice(4)) - 1
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
const selectedMonth = ref(currentMonthValue())
const prevMonthLabel = computed(() => shortMonthLabel(offsetMonth(selectedMonth.value, -1)))
const nextMonthLabel = computed(() => shortMonthLabel(offsetMonth(selectedMonth.value, 1)))
const isNextMonthFuture = computed(() => offsetMonth(selectedMonth.value, 1) > currentMonthValue())
function prevMonth() { selectedMonth.value = offsetMonth(selectedMonth.value, -1) }
function nextMonth() { selectedMonth.value = offsetMonth(selectedMonth.value, 1) }

// ── Period bounds ─────────────────────────────────────────────────────────────
const periodBounds = computed(() => {
  const y = parseInt(selectedMonth.value.slice(0, 4))
  const m = parseInt(selectedMonth.value.slice(4, 6)) - 1
  return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0, 23, 59, 59, 999) }
})

// ── currentTransactions — exact copy from Debt.vue ───────────────────────────
const currentTransactions = computed(() => {
  const bounds = periodBounds.value
  if (!bounds) return []
  return transactionsStore.transactions.filter((t) => {
    const s = String(t.DTPOSTED || '')
    const y = parseInt(s.slice(0, 4))
    const m = parseInt(s.slice(4, 6)) - 1
    const d = parseInt(s.slice(6, 8))
    const tDate = new Date(y, m, d)
    return tDate >= bounds.start && tDate <= bounds.end
  })
})

// ── debtAccounts — exact copy from Debt.vue ───────────────────────────────────
const debtAccounts = computed(() =>
  accountsStore.accounts.filter((a) => {
    const t = String(a.ACCTTYPE || '').toLowerCase()
    return (
      t.includes('credit') ||
      t.includes('loan') ||
      t.includes('mortgage') ||
      t.includes('buy now pay later') ||
      t.includes('medical debt') ||
      t === 'other'
    )
  })
)

// ── paymentsByAccount — exact copy from Debt.vue ─────────────────────────────
const paymentsByAccount = computed(() => {
  const payments = new Map()
  for (const t of currentTransactions.value) {
    const accountId = t.ACCTID
    const amount = Number(t.TRNAMT) || 0
    if (!accountId || amount >= 0) continue
    payments.set(accountId, (payments.get(accountId) || 0) + Math.abs(amount))
  }
  return payments
})

// ── actualsMap — exact copy from Variable.vue buildActualsMap ─────────────────
const actualsMap = computed(() => {
  const map = new Map()
  for (const t of currentTransactions.value) {
    const trnAmt = Number(t.TRNAMT)
    if (t.category)
      map.set(t.category, (map.get(t.category) || 0) + (trnAmt < 0 ? Math.abs(trnAmt) : 0))
    if (t.splitCategory1 && t.splitAmount1 > 0)
      map.set(t.splitCategory1, (map.get(t.splitCategory1) || 0) + t.splitAmount1)
    if (t.splitCategory2 && t.splitAmount2 > 0)
      map.set(t.splitCategory2, (map.get(t.splitCategory2) || 0) + t.splitAmount2)
  }
  return map
})

// ── Totals ────────────────────────────────────────────────────────────────────
const totalIncome = computed(() =>
  currentTransactions.value.reduce(
    (sum, t) => sum + (Number(t.TRNAMT) > 0 ? Number(t.TRNAMT) : 0),
    0
  )
)
const totalSpending = computed(() =>
  currentTransactions.value.reduce(
    (sum, t) => sum + (Number(t.TRNAMT) < 0 ? Math.abs(Number(t.TRNAMT)) : 0),
    0
  )
)
const netCashFlow = computed(() => totalIncome.value - totalSpending.value)

// ── Budget helpers — exact copy from Variable.vue / Debt.vue ─────────────────
function sumBudgetByType(type) {
  if (type === 'debt') {
    // Debt.vue: budget stored against account.ACCTID, not category UUID
    return debtAccounts.value.reduce(
      (sum, a) => sum + (budgetsStore.getBudget(a.ACCTID)?.amount || 0),
      0
    )
  }
  return categoriesStore.categories
    .filter((c) => c.type === type)
    .reduce((sum, c) => sum + budgetsStore.getEffectiveBudget(c.id, selectedMonth.value), 0)
}

function sumActualByCategoryType(type) {
  if (type === 'debt') {
    // Debt.vue: actual = sum of payments across all debt accounts
    return debtAccounts.value.reduce(
      (sum, a) => sum + (paymentsByAccount.value.get(a.ACCTID) || 0),
      0
    )
  }
  // Variable.vue: actual = sum from actualsMap by category name
  const names = new Set(
    categoriesStore.categories.filter((c) => c.type === type).map((c) => c.name)
  )
  let total = 0
  for (const [name, amt] of actualsMap.value) {
    if (names.has(name)) total += amt
  }
  return total
}

const plannedIncome = computed(() => sumBudgetByType('income'))
const plannedOutflow = computed(() =>
  ['savings', 'bills', 'variable', 'debt'].reduce((sum, type) => sum + sumBudgetByType(type), 0)
)
const plannedNet = computed(() => plannedIncome.value - plannedOutflow.value)
const budgetVariance = computed(() => netCashFlow.value - plannedNet.value)

// ── Group summary ─────────────────────────────────────────────────────────────
const groupDefinitions = [
  { type: 'income', label: 'Income', color: 'success' },
  { type: 'savings', label: 'Savings', color: 'info' },
  { type: 'bills', label: 'Bills', color: 'warning' },
  { type: 'debt', label: 'Debt', color: 'error' },
  { type: 'variable', label: 'Variable', color: 'secondary' }
]

const groupSummary = computed(() =>
  groupDefinitions.map((group) => {
    const budget = sumBudgetByType(group.type)
    const actual = group.type === 'income' ? totalIncome.value : sumActualByCategoryType(group.type)
    const rawProgress = budget > 0 ? (actual / budget) * 100 : actual > 0 ? 100 : 0
    const remaining = group.type === 'income' ? actual - budget : budget - actual
    return {
      ...group,
      budget,
      actual,
      remaining,
      progress: Math.min(rawProgress, 100),
      progressLabel: `${Math.round(rawProgress)}%`,
      progressColor:
        group.type === 'income'
          ? rawProgress >= 100
            ? 'success'
            : 'warning'
          : rawProgress > 100
            ? 'error'
            : rawProgress >= 90
              ? 'warning'
              : group.color
    }
  })
)

// ── Top spending ──────────────────────────────────────────────────────────────
const topSpendingCategories = computed(() =>
  [...actualsMap.value.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
)

// ── Recent transactions ───────────────────────────────────────────────────────
const recentTransactions = computed(() =>
  [...currentTransactions.value]
    .sort((a, b) => String(b.DTPOSTED || '').localeCompare(String(a.DTPOSTED || '')))
    .slice(0, 5)
)

// ── Goals ─────────────────────────────────────────────────────────────────────
const goalRows = computed(() =>
  goalsStore.goals
    .map((goal) => {
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
      return {
        ...goal,
        progress: Math.min(progress, 100),
        progressLabel: `${Math.round(progress)}%`
      }
    })
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 4)
)

// ── Mini pie charts ───────────────────────────────────────────────────────────
const miniChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  animation: { duration: 300 }
}

function makePieData(actual, budget, mainColor) {
  const dim = 'rgba(255,255,255,0.08)'
  if (budget <= 0 && actual <= 0)
    return { datasets: [{ data: [1], backgroundColor: [dim], borderWidth: 0 }] }
  if (budget <= 0)
    return { datasets: [{ data: [actual], backgroundColor: [mainColor], borderWidth: 0 }] }
  const remaining = Math.max(0, budget - actual)
  const over = Math.max(0, actual - budget)
  if (over > 0)
    return {
      datasets: [{ data: [budget, over], backgroundColor: [mainColor, '#ffa726'], borderWidth: 0 }]
    }
  return {
    datasets: [
      {
        data: [actual || 0.001, remaining || 0.001],
        backgroundColor: [mainColor, dim],
        borderWidth: 0
      }
    ]
  }
}

const incomeChartData = computed(() =>
  makePieData(totalIncome.value, plannedIncome.value, '#4caf50')
)
const spendingChartData = computed(() =>
  makePieData(totalSpending.value, plannedOutflow.value, '#ef5350')
)
const netChartData = computed(() => {
  const i = totalIncome.value
  const s = totalSpending.value
  if (i <= 0 && s <= 0)
    return {
      datasets: [{ data: [1], backgroundColor: ['rgba(255,255,255,0.08)'], borderWidth: 0 }]
    }
  return {
    datasets: [
      { data: [i || 0.001, s || 0.001], backgroundColor: ['#4caf50', '#ef5350'], borderWidth: 0 }
    ]
  }
})
const remainingChartData = computed(() => {
  const budget = plannedOutflow.value
  const actual = totalSpending.value
  const dim = 'rgba(255,255,255,0.08)'
  const used = 'rgba(255,255,255,0.15)'
  if (budget <= 0 && actual <= 0)
    return { datasets: [{ data: [1], backgroundColor: [dim], borderWidth: 0 }] }
  const remaining = Math.max(0, budget - actual)
  const over = Math.max(0, actual - budget)
  if (over > 0)
    return {
      datasets: [{ data: [budget, over], backgroundColor: [used, '#ef5350'], borderWidth: 0 }]
    }
  return {
    datasets: [
      {
        data: [actual || 0.001, remaining || 0.001],
        backgroundColor: [used, '#4caf50'],
        borderWidth: 0
      }
    ]
  }
})

// ── Formatters ────────────────────────────────────────────────────────────────
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)
}

function formatTransactionDate(value) {
  const text = String(value || '')
  if (text.length < 8) return '-'
  return new Date(
    Number(text.slice(0, 4)),
    Number(text.slice(4, 6)) - 1,
    Number(text.slice(6, 8))
  ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Data loading — mirrors Debt.vue: static data first, then transactions ─────
async function loadDashboard() {
  dashboardError.value = null
  try {
    await Promise.all([
      accountsStore.fetchAccounts(),
      categoriesStore.fetchCategories(),
      budgetsStore.fetchBudgets(),
      budgetsStore.fetchRollovers(),
      goalsStore.fetchGoals()
    ])
    await Promise.all([
      transactionsStore.fetchTransactionsByMonth(selectedMonth.value),
      transactionsStore.fetchReports(selectedMonth.value)
    ])
  } catch (err) {
    dashboardError.value = err?.message ?? String(err)
  }
}

onMounted(loadDashboard)
watch(selectedMonth, loadDashboard)
</script>
