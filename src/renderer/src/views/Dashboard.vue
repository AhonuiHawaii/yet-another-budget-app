<template>
  <v-container fluid class="pa-3">
    <v-alert v-if="dashboardError" type="error" variant="tonal" class="mb-3">
      {{ dashboardError }}
    </v-alert>

    <!-- Stat Cards -->
    <v-row class="mb-3">
      <v-col cols="12" sm="6" lg="3">
        <v-card rounded elevation="3" class="h-100">
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis"
                >Income</span
              >
              <v-icon color="success" size="18" opacity="70">mdi-arrow-down-circle-outline</v-icon>
            </div>
            <div class="text-h5 font-weight-black text-success mb-1">
              {{ formatCurrency(totalIncome) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ incomeTransactions.length }} deposits
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card rounded elevation="3" class="h-100">
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis"
                >Spending</span
              >``
              <v-icon color="error" size="18" opacity="70">mdi-arrow-up-circle-outline</v-icon>
            </div>
            <div class="text-h5 font-weight-black text-error mb-1">
              {{ formatCurrency(totalSpending) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ expenseTransactions.length }} payments
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card rounded elevation="3" class="h-100">
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis"
                >Net</span
              >
              <v-icon :color="netCashFlow >= 0 ? 'success' : 'error'" size="18" opacity="70"
                >mdi-trending-up</v-icon
              >
            </div>
            <div
              class="text-h5 font-weight-black mb-1"
              :class="netCashFlow >= 0 ? 'text-success' : 'text-error'"
            >
              {{ formatCurrency(netCashFlow) }}
            </div>
            <div class="text-caption text-medium-emphasis">Income minus spending</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card rounded elevation="3" class="h-100">
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis"
                >Remaining</span
              >
              <v-icon :color="budgetVariance >= 0 ? 'success' : 'warning'" size="18" opacity="70"
                >mdi-wallet-outline</v-icon
              >
            </div>
            <div
              class="text-h5 font-weight-black mb-1"
              :class="budgetVariance >= 0 ? 'text-success' : 'text-error'"
            >
              {{ formatCurrency(budgetVariance) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ attentionCount }} items need review
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Monthly Summary -->
      <v-col cols="12" lg="7">
        <v-card rounded elevation="3" class="mb-3">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="primary" size="20">mdi-view-dashboard-outline</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">Monthly Summary</v-card-title>
          </v-card-item>

          <v-table density="compact" class="mt-1">
            <thead>
              <tr>
                <th class="text-start text-uppercase text-caption font-weight-bold pl-5">Group</th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Budget</th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Actual</th>
                <th
                  class="text-center text-uppercase text-caption font-weight-bold"
                  style="min-width: 140px"
                >
                  Progress
                </th>
                <th class="text-center text-uppercase text-caption font-weight-bold pr-5">Left</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="group in groupSummary" :key="group.type">
                <td class="pl-5">
                  <v-chip :color="group.color" variant="tonal" size="x-small" rounded="lg">{{
                    group.label
                  }}</v-chip>
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
                      height="6"
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

          <v-divider class="mt-1" />

          <v-row no-gutters>
            <v-col cols="6">
              <v-list-item class="py-2 px-5">
                <v-list-item-title class="text-body-2 font-weight-medium mb-1"
                  >Planned Net</v-list-item-title
                >
                <v-list-item-subtitle class="text-caption"
                  >Budgeted income minus outflow</v-list-item-subtitle
                >
                <template #append>
                  <v-chip variant="tonal" size="small" class="font-weight-bold">{{
                    formatCurrency(plannedNet)
                  }}</v-chip>
                </template>
              </v-list-item>
            </v-col>
            <v-divider vertical />
            <v-col cols="6">
              <v-list-item class="py-2 px-5">
                <v-list-item-title class="text-body-2 font-weight-medium mb-1"
                  >Uncategorized</v-list-item-title
                >
                <v-list-item-subtitle class="text-caption">
                  {{
                    transactionsStore.uncategorized.length
                      ? 'Needs categorization'
                      : 'All transactions categorized'
                  }}
                </v-list-item-subtitle>
                <template #append>
                  <v-chip
                    :color="transactionsStore.uncategorized.length ? 'warning' : 'success'"
                    variant="tonal"
                    size="small"
                    class="font-weight-bold"
                  >
                    {{ transactionsStore.uncategorized.length }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-col>
          </v-row>
        </v-card>

        <!-- Recent Transactions -->
        <v-card rounded elevation="3">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="primary" size="20">mdi-receipt-text-outline</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">Recent Transactions</v-card-title>
          </v-card-item>

          <div class="py-1">
            <div
              v-if="recentTransactions.length === 0"
              class="py-2 text-center text-medium-emphasis text-body-2"
            >
              No transactions this month.
            </div>
            <template v-for="(transaction, i) in recentTransactions" :key="transaction.FITID">
              <v-divider v-if="i > 0" />
              <div class="d-flex align-center justify-space-between px-5 py-2">
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
      <v-col cols="12" lg="5">
        <!-- Top Spending -->
        <v-card rounded elevation="3" class="mb-3">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="primary" size="20">mdi-chart-donut</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">Top Spending</v-card-title>
          </v-card-item>

          <div class="py-1">
            <div
              v-if="topSpendingCategories.length === 0"
              class="py-2 text-center text-medium-emphasis text-body-2"
            >
              No categorized spending yet.
            </div>
            <template v-for="(category, i) in topSpendingCategories" :key="category.name">
              <v-divider v-if="i > 0" />
              <div class="d-flex align-center px-5 py-2">
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
        <v-card rounded elevation="3">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="primary" size="20">mdi-flag-outline</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">Goals</v-card-title>
          </v-card-item>

          <div class="py-1">
            <div
              v-if="goalRows.length === 0"
              class="py-2 text-center text-medium-emphasis text-body-2"
            >
              No goals configured.
            </div>
            <template v-for="(goal, i) in goalRows" :key="goal.id">
              <v-divider v-if="i > 0" />
              <div class="d-flex align-center px-5 py-2">
                <div class="flex-grow-1">
                  <div class="text-body-2 font-weight-medium mb-1">{{ goal.name }}</div>
                  <v-progress-linear
                    :model-value="goal.progress"
                    :color="goal.status === 'completed' ? 'success' : 'primary'"
                    height="6"
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
import { useUserBudgetsStore } from '../stores/userBudgets'
import { useUserCategoriesStore } from '../stores/userCategories'
import { useUserGoalsStore } from '../stores/userGoals'
import { useUserSettingsStore } from '../stores/userSettings'
import { useUserTransactionsStore } from '../stores/userTransactions'

const budgetsStore = useUserBudgetsStore()
const categoriesStore = useUserCategoriesStore()
const goalsStore = useUserGoalsStore()
const settingsStore = useUserSettingsStore()
const transactionsStore = useUserTransactionsStore()
const dashboardError = ref(null)

const incomeTransactions = computed(() =>
  transactionsStore.transactions.filter((transaction) => Number(transaction.TRNAMT) > 0)
)

const expenseTransactions = computed(() =>
  transactionsStore.transactions.filter((transaction) => Number(transaction.TRNAMT) < 0)
)

const totalIncome = computed(() =>
  incomeTransactions.value.reduce((sum, transaction) => sum + Number(transaction.TRNAMT), 0)
)

const totalSpending = computed(() =>
  expenseTransactions.value.reduce(
    (sum, transaction) => sum + Math.abs(Number(transaction.TRNAMT)),
    0
  )
)

const netCashFlow = computed(() => totalIncome.value - totalSpending.value)
const plannedIncome = computed(() => sumBudgetByType('income'))
const plannedOutflow = computed(() =>
  ['savings', 'bills', 'variable', 'debt'].reduce((sum, type) => sum + sumBudgetByType(type), 0)
)
const plannedNet = computed(() => plannedIncome.value - plannedOutflow.value)
const budgetVariance = computed(() => netCashFlow.value - plannedNet.value)

const groupDefinitions = [
  { type: 'income', label: 'Income', color: 'success' },
  { type: 'savings', label: 'Savings', color: 'info' },
  { type: 'bills', label: 'Bills', color: 'warning' },
  { type: 'debt', label: 'Debt', color: 'error' },
  { type: 'variable', label: 'Variable', color: 'secondary' }
]

const groupSummary = computed(() => {
  return groupDefinitions.map((group) => {
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
})

const topSpendingCategories = computed(() => {
  const totals = new Map()
  for (const transaction of expenseTransactions.value) {
    addCategoryTotal(totals, transaction.category, Number(transaction.TRNAMT) || 0)
    addCategoryTotal(totals, transaction.splitCategory1, Number(transaction.splitAmount1) || 0)
    addCategoryTotal(totals, transaction.splitCategory2, Number(transaction.splitAmount2) || 0)
  }

  return [...totals.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
})

const recentTransactions = computed(() => {
  return [...transactionsStore.transactions]
    .sort((a, b) => String(b.DTPOSTED || '').localeCompare(String(a.DTPOSTED || '')))
    .slice(0, 5)
})

const goalRows = computed(() => {
  return goalsStore.goals
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
})

const overBudgetCount = computed(() => {
  return categoriesStore.categories.filter((category) => {
    if (category.type === 'income') return false
    const budget = budgetsStore.getBudget(category.id)?.amount || 0
    if (!budget) return false
    const actual = topSpendingCategories.value.find((row) => row.name === category.name)?.total || 0
    return actual > budget
  }).length
})

const attentionCount = computed(
  () => transactionsStore.uncategorized.length + overBudgetCount.value
)

function addCategoryTotal(totals, categoryName, amount) {
  if (!categoryName || !amount) return
  totals.set(categoryName, (totals.get(categoryName) || 0) + Math.abs(amount))
}

function sumBudgetByType(type) {
  return categoriesStore.categories
    .filter((category) => category.type === type)
    .reduce((sum, category) => sum + (budgetsStore.getBudget(category.id)?.amount || 0), 0)
}

function sumActualByCategoryType(type) {
  const categoryNames = new Set(
    categoriesStore.categories
      .filter((category) => category.type === type)
      .map((category) => category.name)
  )

  return topSpendingCategories.value
    .filter((category) => categoryNames.has(category.name))
    .reduce((sum, category) => sum + category.total, 0)
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)
}

function formatTransactionDate(value) {
  const text = String(value || '')
  if (text.length < 8) return '-'
  const year = Number(text.slice(0, 4))
  const month = Number(text.slice(4, 6)) - 1
  const day = Number(text.slice(6, 8))
  return new Date(year, month, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

async function loadDashboard() {
  dashboardError.value = null
  try {
    await Promise.all([
      categoriesStore.fetchCategories(),
      budgetsStore.fetchBudgets(),
      goalsStore.fetchGoals()
    ])

    await Promise.all([
      transactionsStore.fetchTransactionsByMonth(settingsStore.selectedMonth),
      transactionsStore.fetchReports(settingsStore.selectedMonth)
    ])
  } catch (err) {
    dashboardError.value = err?.message ?? String(err)
  }
}

onMounted(loadDashboard)

watch(
  () => settingsStore.selectedMonth,
  () => {
    loadDashboard()
  }
)
</script>
