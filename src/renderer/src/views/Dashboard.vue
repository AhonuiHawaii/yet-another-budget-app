<template>
  <v-container fluid class="pa-6">


    <v-alert v-if="dashboardError" type="error" variant="tonal" class="mb-4">
      {{ dashboardError }}
    </v-alert>

    <v-row class="mb-6">
      <v-col cols="12" sm="6" lg="3">
        <v-card class="pa-4 h-100" rounded="xl" elevation="0" border>
          <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-1">
            Income
          </div>
          <div class="text-h5 font-weight-black text-success">
            {{ formatCurrency(totalIncome) }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ incomeTransactions.length }} deposits
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="pa-4 h-100" rounded="xl" elevation="0" border>
          <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-1">
            Spending
          </div>
          <div class="text-h5 font-weight-black text-error">
            {{ formatCurrency(totalSpending) }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ expenseTransactions.length }} payments
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="pa-4 h-100" rounded="xl" elevation="0" border>
          <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-1">
            Net
          </div>
          <div
            class="text-h5 font-weight-black"
            :class="netCashFlow >= 0 ? 'text-success' : 'text-error'"
          >
            {{ formatCurrency(netCashFlow) }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">Income minus spending</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="pa-4 h-100" rounded="xl" elevation="0" border>
          <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-1">
            Remaining Budget
          </div>
          <div
            class="text-h5 font-weight-black"
            :class="budgetVariance >= 0 ? 'text-success' : 'text-error'"
          >
            {{ formatCurrency(budgetVariance) }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ attentionCount }} items need review
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="7">
        <div class="mb-6">
          <div class="d-flex align-center gap-2 mb-4">
            <v-icon color="primary" size="20">mdi-view-dashboard-outline</v-icon>
            <h2 class="text-h6 font-weight-bold">Monthly Summary</h2>
          </div>
          <v-table density="comfortable">
            <thead>
              <tr>
                <th class="text-start text-uppercase text-caption font-weight-bold pl-4">Group</th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Budget</th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Actual</th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Progress</th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Left</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="group in groupSummary" :key="group.type">
                <td class="pl-4">
                  <v-chip :color="group.color" variant="tonal" size="x-small" rounded="lg">
                    {{ group.label }}
                  </v-chip>
                </td>
                <td class="text-center">{{ formatCurrency(group.budget) }}</td>
                <td class="text-center font-weight-bold">{{ formatCurrency(group.actual) }}</td>
                <td class="text-center">
                  <div class="d-flex align-center gap-2">
                    <v-progress-linear
                      :model-value="group.progress"
                      :color="group.progressColor"
                      height="8"
                      rounded
                    />
                    <span class="text-caption">{{ group.progressLabel }}</span>
                  </div>
                </td>
                <td
                  class="text-center font-weight-bold"
                  :class="group.remaining >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ formatCurrency(group.remaining) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <v-row>
          <v-col cols="12" md="6">
            <v-card class="pa-4 h-100" rounded="xl" elevation="0" border>
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="font-weight-bold">Planned Net</div>
                <v-chip variant="tonal" size="small">{{ formatCurrency(plannedNet) }}</v-chip>
              </div>
              <div class="text-body-2 text-medium-emphasis">
                Budgeted income minus budgeted outflow.
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card class="pa-4 h-100" rounded="xl" elevation="0" border>
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="font-weight-bold">Uncategorized</div>
                <v-chip
                  :color="transactionsStore.uncategorized.length ? 'warning' : 'success'"
                  variant="tonal"
                  size="small"
                >
                  {{ transactionsStore.uncategorized.length }}
                </v-chip>
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{
                  transactionsStore.uncategorized.length
                    ? 'Categorize these to keep the month accurate.'
                    : 'Every transaction is categorized.'
                }}
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <v-col cols="12" lg="5">
        <div class="mb-6">
          <div class="d-flex align-center gap-2 mb-4">
            <v-icon color="primary" size="20">mdi-chart-donut</v-icon>
            <h2 class="text-h6 font-weight-bold">Top Spending</h2>
          </div>
          <v-table density="comfortable">
            <tbody>
              <tr v-if="topSpendingCategories.length === 0">
                <td class="text-center py-8 text-medium-emphasis">No categorized spending yet.</td>
              </tr>
              <tr v-for="category in topSpendingCategories" :key="category.name">
                <td class="pl-4">{{ category.name }}</td>
                <td class="text-right font-weight-bold">{{ formatCurrency(category.total) }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <div class="mb-6">
          <div class="d-flex align-center gap-2 mb-4">
            <v-icon color="primary" size="20">mdi-flag-outline</v-icon>
            <h2 class="text-h6 font-weight-bold">Goals</h2>
          </div>
          <v-table density="comfortable">
            <tbody>
              <tr v-if="goalRows.length === 0">
                <td class="text-center py-8 text-medium-emphasis">No goals configured.</td>
              </tr>
              <tr v-for="goal in goalRows" :key="goal.id">
                <td class="pl-4">
                  <div class="font-weight-medium">{{ goal.name }}</div>
                  <v-progress-linear
                    :model-value="goal.progress"
                    :color="goal.status === 'completed' ? 'success' : 'primary'"
                    height="7"
                    rounded
                    class="mt-2"
                  />
                </td>
                <td class="text-right text-caption">{{ goal.progressLabel }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-col>
    </v-row>

    <div class="mb-6">
      <div class="d-flex align-center gap-2 mb-4">
        <v-icon color="primary" size="20">mdi-receipt-text-outline</v-icon>
        <h2 class="text-h6 font-weight-bold">Recent Transactions</h2>
      </div>
      <v-table density="comfortable">
        <tbody>
          <tr v-if="recentTransactions.length === 0">
            <td class="text-center py-8 text-medium-emphasis">No transactions this month.</td>
          </tr>
          <tr v-for="transaction in recentTransactions" :key="transaction.FITID">
            <td class="pl-4">
              <div class="font-weight-medium">
                {{ transaction.NAME || transaction.MEMO || transaction.FITID }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ formatTransactionDate(transaction.DTPOSTED) }}
              </div>
            </td>
            <td
              class="text-right font-weight-bold"
              :class="Number(transaction.TRNAMT) >= 0 ? 'text-success' : 'text-error'"
            >
              {{ formatCurrency(Number(transaction.TRNAMT) || 0) }}
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
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
