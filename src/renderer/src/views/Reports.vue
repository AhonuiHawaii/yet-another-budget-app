<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center flex-wrap gap-3 mb-6">
      <v-chip v-if="transactionsStore.monthsWithData.length === 0" variant="outlined" size="small">
        No transaction history yet
      </v-chip>
    </div>

    <v-alert v-if="reportError" type="error" variant="tonal" class="mb-4">
      {{ reportError }}
    </v-alert>

    <!-- Spending Trends Chart -->
    <v-card v-if="transactionsStore.monthlyTotals.length > 0" rounded elevation="2" class="mb-6">
      <v-card-item class="pa-4 pb-0">
        <template #prepend>
          <v-icon color="primary" size="20" :opacity="0.7">mdi-chart-line</v-icon>
        </template>
        <v-card-title class="text-h6 font-weight-bold pl-2">
          Spending Trends
          <v-chip size="x-small" variant="tonal" color="primary" class="ml-2">All time</v-chip>
        </v-card-title>
      </v-card-item>
      <div class="pa-4 pt-2">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </v-card>

    <v-row class="mb-6">
      <v-col cols="12" sm="6" lg="3">
        <v-card class="h-100" rounded elevation="2">
          <v-card-text class="pa-4">
            <div class="d-flex align-start justify-space-between mb-3">
              <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis"
                >Income</span
              >
              <v-icon color="success" size="18" :opacity="0.4"
                >mdi-arrow-down-circle-outline</v-icon
              >
            </div>
            <div class="text-h5 font-weight-black text-success">
              {{ formatCurrency(totalIncome) }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ incomeTransactions.length }} credits
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="h-100" rounded elevation="2">
          <v-card-text class="pa-4">
            <div class="d-flex align-start justify-space-between mb-3">
              <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis"
                >Spending</span
              >
              <v-icon color="error" size="18" :opacity="0.4">mdi-arrow-up-circle-outline</v-icon>
            </div>
            <div class="text-h5 font-weight-black text-error">
              {{ formatCurrency(totalSpending) }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ expenseTransactions.length }} debits
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="h-100" rounded elevation="2">
          <v-card-text class="pa-4">
            <div class="d-flex align-start justify-space-between mb-3">
              <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis"
                >Net Cash Flow</span
              >
              <v-icon :color="netCashFlow >= 0 ? 'success' : 'error'" size="18" :opacity="0.4"
                >mdi-trending-up</v-icon
              >
            </div>
            <div
              class="text-h5 font-weight-black"
              :class="netCashFlow >= 0 ? 'text-success' : 'text-error'"
            >
              {{ formatCurrency(netCashFlow) }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">Income minus spending</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="h-100" rounded elevation="2">
          <v-card-text class="pa-4">
            <div class="d-flex align-start justify-space-between mb-3">
              <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis"
                >Budget Variance</span
              >
              <v-icon :color="budgetVariance >= 0 ? 'success' : 'warning'" size="18" :opacity="0.4"
                >mdi-wallet-outline</v-icon
              >
            </div>
            <div
              class="text-h5 font-weight-black"
              :class="budgetVariance >= 0 ? 'text-success' : 'text-error'"
            >
              {{ formatCurrency(budgetVariance) }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">Actual net vs planned net</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="7">
        <v-card rounded elevation="2" class="mb-6">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="primary" size="20" :opacity="0.7">mdi-chart-bar</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">Category Performance</v-card-title>
          </v-card-item>
          <v-table density="comfortable" class="mt-2">
            <thead>
              <tr>
                <th class="text-start text-caption text-medium-emphasis pl-5">Category</th>
                <th class="text-center text-caption text-medium-emphasis">Group</th>
                <th class="text-center text-caption text-medium-emphasis">Actual</th>
                <th class="text-center text-caption text-medium-emphasis">Budget</th>
                <th class="text-center text-caption text-medium-emphasis pr-5">Variance</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="categoryPerformance.length === 0">
                <td colspan="5" class="text-center py-8 text-medium-emphasis">
                  No categorized activity for this month.
                </td>
              </tr>
              <tr v-for="row in categoryPerformance" :key="row.key">
                <td class="pl-5 text-body-2 font-weight-medium">{{ row.name }}</td>
                <td class="text-center">
                  <v-chip :color="row.color" variant="tonal" size="x-small" rounded>
                    {{ row.typeLabel }}
                  </v-chip>
                </td>
                <td class="text-center text-body-2 font-weight-bold">
                  {{ formatCurrency(row.actual) }}
                </td>
                <td class="text-center text-body-2">{{ formatCurrency(row.budget) }}</td>
                <td
                  class="text-center text-body-2 font-weight-bold pr-5"
                  :class="row.variance >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ formatCurrency(row.variance) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>

      <v-col cols="12" lg="5">
        <v-card rounded elevation="2" class="mb-6">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="primary" size="20" :opacity="0.7">mdi-bank-outline</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">Accounts</v-card-title>
          </v-card-item>
          <v-table density="comfortable" class="mt-2">
            <thead>
              <tr>
                <th class="text-start text-caption text-medium-emphasis pl-5">Account</th>
                <th class="text-center text-caption text-medium-emphasis">Count</th>
                <th class="text-center text-caption text-medium-emphasis pr-5">Net</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="accountRows.length === 0">
                <td colspan="3" class="text-center py-8 text-medium-emphasis">
                  No account activity yet.
                </td>
              </tr>
              <tr v-for="account in accountRows" :key="account.ACCTID">
                <td class="pl-5 text-body-2 font-weight-medium">
                  {{ account.displayName || account.ORG || `*${account.ACCTID}` }}
                </td>
                <td class="text-center text-body-2">{{ account.count }}</td>
                <td
                  class="text-center text-body-2 font-weight-bold pr-5"
                  :class="account.total >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ formatCurrency(account.total) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="6">
        <v-card rounded elevation="2" class="mb-6">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="primary" size="20" :opacity="0.7">mdi-flag-outline</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">Goals</v-card-title>
          </v-card-item>
          <v-table density="comfortable" class="mt-2">
            <thead>
              <tr>
                <th class="text-start text-caption text-medium-emphasis pl-5">Goal</th>
                <th class="text-center text-caption text-medium-emphasis">Saved</th>
                <th class="text-center text-caption text-medium-emphasis">Target</th>
                <th class="text-center text-caption text-medium-emphasis pr-5">Progress</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="goalRows.length === 0">
                <td colspan="4" class="text-center py-8 text-medium-emphasis">
                  No goals configured.
                </td>
              </tr>
              <tr v-for="goal in goalRows" :key="goal.id">
                <td class="pl-5 text-body-2 font-weight-medium">{{ goal.name }}</td>
                <td class="text-center text-body-2">{{ formatCurrency(goal.currentAmount) }}</td>
                <td class="text-center text-body-2">{{ formatCurrency(goal.targetAmount) }}</td>
                <td class="text-center pr-5">
                  <div class="d-flex align-center gap-2 px-2">
                    <v-progress-linear
                      :model-value="goal.progress"
                      :color="goal.status === 'completed' ? 'success' : 'primary'"
                      height="4"
                      rounded
                    />
                    <span class="text-caption text-medium-emphasis" style="min-width: 32px">{{
                      goal.progressLabel
                    }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6">
        <v-card rounded elevation="2" class="mb-6">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="warning" size="20" :opacity="0.7">mdi-alert-circle-outline</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">Uncategorized</v-card-title>
          </v-card-item>
          <v-table density="comfortable" class="mt-2">
            <thead>
              <tr>
                <th class="text-start text-caption text-medium-emphasis pl-5">Transaction</th>
                <th class="text-center text-caption text-medium-emphasis pr-5">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="uncategorizedRows.length === 0">
                <td colspan="2" class="text-center py-8 text-medium-emphasis">
                  Everything is categorized for this month.
                </td>
              </tr>
              <tr v-for="row in uncategorizedRows" :key="row.FITID">
                <td class="pl-5 text-body-2 font-weight-medium">
                  {{ row.NAME || row.MEMO || row.FITID }}
                </td>
                <td
                  class="text-center text-body-2 font-weight-bold pr-5"
                  :class="Number(row.TRNAMT) >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ formatCurrency(Math.abs(Number(row.TRNAMT) || 0)) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { useUserAccountsStore } from '../stores/userAccounts'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)
import { useUserBudgetsStore } from '../stores/userBudgets'
import { useUserCategoriesStore } from '../stores/userCategories'
import { useUserGoalsStore } from '../stores/userGoals'
import { useUserSettingsStore } from '../stores/userSettings'
import { useUserTransactionsStore } from '../stores/userTransactions'

const accountsStore = useUserAccountsStore()
const budgetsStore = useUserBudgetsStore()
const categoriesStore = useUserCategoriesStore()
const goalsStore = useUserGoalsStore()
const settingsStore = useUserSettingsStore()
const transactionsStore = useUserTransactionsStore()

const reportError = ref(null)

const categoryTypes = {
  income: { label: 'Income', color: 'success' },
  savings: { label: 'Savings', color: 'info' },
  bills: { label: 'Bills', color: 'warning' },
  variable: { label: 'Variable', color: 'secondary' },
  debt: { label: 'Debt', color: 'error' }
}

const selectedMonth = computed(() => settingsStore.selectedMonth)

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

const categoryActuals = computed(() => {
  const actuals = new Map()
  for (const transaction of transactionsStore.transactions) {
    addActual(actuals, transaction.category, Number(transaction.TRNAMT) || 0)
    addActual(actuals, transaction.splitCategory1, Number(transaction.splitAmount1) || 0)
    addActual(actuals, transaction.splitCategory2, Number(transaction.splitAmount2) || 0)
  }
  return actuals
})

const categoryPerformance = computed(() => {
  return categoriesStore.categories
    .map((category) => {
      const type = categoryTypes[category.type] || categoryTypes.variable
      const actual = categoryActuals.value.get(category.name) || 0
      const budget = budgetsStore.getBudget(category.id)?.amount || 0
      const variance = category.type === 'income' ? actual - budget : budget - actual

      return {
        key: category.id,
        name: category.name,
        typeLabel: type.label,
        color: type.color,
        actual,
        budget,
        variance
      }
    })
    .filter((row) => row.actual || row.budget)
    .sort((a, b) => Math.abs(b.actual) - Math.abs(a.actual))
})

const plannedIncome = computed(() => sumBudgetByType('income'))
const plannedOutflow = computed(() =>
  ['savings', 'bills', 'variable', 'debt'].reduce((sum, type) => sum + sumBudgetByType(type), 0)
)
const plannedNet = computed(() => plannedIncome.value - plannedOutflow.value)
const budgetVariance = computed(() => netCashFlow.value - plannedNet.value)

const accountRows = computed(() => {
  const accountsById = new Map(accountsStore.accounts.map((account) => [account.ACCTID, account]))
  return transactionsStore.accountSummary.map((summary) => ({
    ...summary,
    ...(accountsById.get(summary.ACCTID) || {})
  }))
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
    .slice(0, 6)
})

const uncategorizedRows = computed(() => transactionsStore.uncategorized.slice(0, 8))

function addActual(actuals, categoryName, amount) {
  if (!categoryName || !amount) return
  actuals.set(categoryName, (actuals.get(categoryName) || 0) + Math.abs(amount))
}

function sumBudgetByType(type) {
  return categoriesStore.categories
    .filter((category) => category.type === type)
    .reduce((sum, category) => sum + (budgetsStore.getBudget(category.id)?.amount || 0), 0)
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)
}

const chartData = computed(() => {
  const rows = transactionsStore.monthlyTotals
  return {
    labels: rows.map((r) => {
      const y = r.month.slice(0, 4)
      const m = parseInt(r.month.slice(4, 6)) - 1
      return new Date(y, m, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }),
    datasets: [
      {
        label: 'Income',
        data: rows.map((r) => r.income),
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76,175,80,0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Spending',
        data: rows.map((r) => r.spending),
        borderColor: '#f44336',
        backgroundColor: 'rgba(244,67,54,0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'top', labels: { usePointStyle: true, padding: 16 } },
    tooltip: {
      callbacks: {
        label: (ctx) =>
          ` ${ctx.dataset.label}: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(ctx.parsed.y)}`
      }
    }
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      ticks: {
        callback: (v) =>
          new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: 'compact'
          }).format(v)
      }
    }
  }
}

async function loadReport() {
  reportError.value = null
  try {
    await Promise.all([
      transactionsStore.fetchTransactionsByMonth(selectedMonth.value),
      transactionsStore.fetchReports(selectedMonth.value),
      transactionsStore.fetchAccountSummary(),
      transactionsStore.fetchMonthlyTotals(),
      accountsStore.fetchAccounts(),
      categoriesStore.fetchCategories(),
      budgetsStore.fetchBudgets(),
      goalsStore.fetchGoals()
    ])
  } catch (err) {
    reportError.value = err?.message ?? String(err)
  }
}

onMounted(async () => {
  await loadReport()
})

watch(
  () => settingsStore.selectedMonth,
  () => {
    loadReport()
  }
)
</script>
