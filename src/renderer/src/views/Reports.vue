<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between flex-wrap gap-3 mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Reports</h1>
        <p class="text-body-1 text-medium-emphasis mt-1">
          Review cash flow, budget variance, goals, and uncategorized activity
        </p>
      </div>
    </div>

    <div class="d-flex align-center flex-wrap gap-3 mb-6">
      <v-menu v-model="pickerMenu" :close-on-content-click="false" location="bottom start">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            rounded="lg"
            color="primary"
            prepend-icon="mdi-calendar-month-outline"
            size="small"
            :loading="transactionsStore.loading"
          >
            {{ selectedMonthLabel }}
            <v-icon end size="16">mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-card rounded="xl" elevation="6" min-width="360">
          <v-date-picker
            v-model="pickerDate"
            view-mode="month"
            color="primary"
            hide-header
            @update:model-value="onPickerSelect"
          />
        </v-card>
      </v-menu>
      <v-chip v-if="transactionsStore.monthsWithData.length === 0" variant="outlined" size="small">
        No transaction history yet
      </v-chip>
    </div>

    <v-alert v-if="reportError" type="error" variant="tonal" class="mb-4">
      {{ reportError }}
    </v-alert>

    <v-row class="mb-6" dense>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="pa-4 h-100" rounded="xl" elevation="0" border>
          <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-1">
            Income
          </div>
          <div class="text-h5 font-weight-black text-success">
            {{ formatCurrency(totalIncome) }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ incomeTransactions.length }} credits
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
            {{ expenseTransactions.length }} debits
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="pa-4 h-100" rounded="xl" elevation="0" border>
          <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-1">
            Net Cash Flow
          </div>
          <div
            class="text-h5 font-weight-black"
            :class="netCashFlow >= 0 ? 'text-success' : 'text-error'"
          >
            {{ formatCurrency(netCashFlow) }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">{{ selectedMonthLabel }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="pa-4 h-100" rounded="xl" elevation="0" border>
          <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-1">
            Budget Variance
          </div>
          <div
            class="text-h5 font-weight-black"
            :class="budgetVariance >= 0 ? 'text-success' : 'text-error'"
          >
            {{ formatCurrency(budgetVariance) }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">Actual net vs planned net</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row dense>
      <v-col cols="12" lg="7">
        <v-card class="bg-transparent mb-6" rounded="0" elevation="0">
          <div class="d-flex align-center gap-2 mb-2">
            <v-icon color="primary" size="20">mdi-chart-bar</v-icon>
            <h2 class="text-h6 font-weight-bold">Category Performance</h2>
          </div>
          <v-table density="comfortable" class="bg-transparent text-white" theme="dark">
            <thead>
              <tr>
                <th class="text-left text-uppercase text-caption font-weight-bold pl-4">
                  Category
                </th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Group</th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Actual</th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Budget</th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Variance</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="categoryPerformance.length === 0">
                <td colspan="5" class="text-center py-8 text-medium-emphasis">
                  No categorized activity for this month.
                </td>
              </tr>
              <tr v-for="row in categoryPerformance" :key="row.key" class="dashed-row">
                <td class="pl-4">{{ row.name }}</td>
                <td class="text-center">
                  <v-chip :color="row.color" variant="tonal" size="x-small" rounded="lg">
                    {{ row.typeLabel }}
                  </v-chip>
                </td>
                <td class="text-center font-weight-bold">{{ formatCurrency(row.actual) }}</td>
                <td class="text-center">{{ formatCurrency(row.budget) }}</td>
                <td
                  class="text-center font-weight-bold"
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
        <v-card class="bg-transparent mb-6" rounded="0" elevation="0">
          <div class="d-flex align-center gap-2 mb-2">
            <v-icon color="primary" size="20">mdi-bank-outline</v-icon>
            <h2 class="text-h6 font-weight-bold">Accounts</h2>
          </div>
          <v-table density="comfortable" class="bg-transparent text-white" theme="dark">
            <thead>
              <tr>
                <th class="text-left text-uppercase text-caption font-weight-bold pl-4">Account</th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Count</th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Net</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="accountRows.length === 0">
                <td colspan="3" class="text-center py-8 text-medium-emphasis">
                  No account activity yet.
                </td>
              </tr>
              <tr v-for="account in accountRows" :key="account.ACCTID" class="dashed-row">
                <td class="pl-4">
                  {{ account.displayName || account.ORG || `*${account.ACCTID}` }}
                </td>
                <td class="text-center">{{ account.count }}</td>
                <td
                  class="text-center font-weight-bold"
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

    <v-row dense>
      <v-col cols="12" lg="6">
        <v-card class="bg-transparent mb-6" rounded="0" elevation="0">
          <div class="d-flex align-center gap-2 mb-2">
            <v-icon color="primary" size="20">mdi-flag-outline</v-icon>
            <h2 class="text-h6 font-weight-bold">Goals</h2>
          </div>
          <v-table density="comfortable" class="bg-transparent text-white" theme="dark">
            <thead>
              <tr>
                <th class="text-left text-uppercase text-caption font-weight-bold pl-4">Goal</th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Saved</th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Target</th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Progress</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="goalRows.length === 0">
                <td colspan="4" class="text-center py-8 text-medium-emphasis">
                  No goals configured.
                </td>
              </tr>
              <tr v-for="goal in goalRows" :key="goal.id" class="dashed-row">
                <td class="pl-4">{{ goal.name }}</td>
                <td class="text-center">{{ formatCurrency(goal.currentAmount) }}</td>
                <td class="text-center">{{ formatCurrency(goal.targetAmount) }}</td>
                <td class="text-center">
                  <div class="d-flex align-center gap-2">
                    <v-progress-linear
                      :model-value="goal.progress"
                      :color="goal.status === 'completed' ? 'success' : 'primary'"
                      height="8"
                      rounded
                    />
                    <span class="text-caption">{{ goal.progressLabel }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6">
        <v-card class="bg-transparent mb-6" rounded="0" elevation="0">
          <div class="d-flex align-center gap-2 mb-2">
            <v-icon color="warning" size="20">mdi-alert-circle-outline</v-icon>
            <h2 class="text-h6 font-weight-bold">Uncategorized</h2>
          </div>
          <v-table density="comfortable" class="bg-transparent text-white" theme="dark">
            <thead>
              <tr>
                <th class="text-left text-uppercase text-caption font-weight-bold pl-4">
                  Transaction
                </th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="uncategorizedRows.length === 0">
                <td colspan="2" class="text-center py-8 text-medium-emphasis">
                  Everything is categorized for this month.
                </td>
              </tr>
              <tr v-for="row in uncategorizedRows" :key="row.FITID" class="dashed-row">
                <td class="pl-4">{{ row.NAME || row.MEMO || row.FITID }}</td>
                <td
                  class="text-center font-weight-bold"
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
import { computed, onMounted, ref } from 'vue'
import { useUserAccountsStore } from '../stores/userAcounts'
import { useUserBudgetsStore } from '../stores/userBudgets'
import { useUserCategoriesStore } from '../stores/userCategories'
import { useUserGoalsStore } from '../stores/userGoals'
import { useUserTransactionsStore } from '../stores/userTransactions'

const accountsStore = useUserAccountsStore()
const budgetsStore = useUserBudgetsStore()
const categoriesStore = useUserCategoriesStore()
const goalsStore = useUserGoalsStore()
const transactionsStore = useUserTransactionsStore()

const pickerMenu = ref(false)
const pickerDate = ref(new Date())
const reportError = ref(null)

const categoryTypes = {
  income: { label: 'Income', color: 'success' },
  savings: { label: 'Savings', color: 'info' },
  bills: { label: 'Bills', color: 'warning' },
  variable: { label: 'Variable', color: 'secondary' },
  debt: { label: 'Debt', color: 'error' }
}

const selectedMonth = computed(() => {
  const date = new Date(pickerDate.value || new Date())
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
})

const selectedMonthLabel = computed(() => {
  return new Date(pickerDate.value || new Date()).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
})

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

async function loadReport() {
  reportError.value = null
  try {
    await Promise.all([
      transactionsStore.fetchTransactionsByMonth(selectedMonth.value),
      transactionsStore.fetchReports(selectedMonth.value),
      transactionsStore.fetchAccountSummary(),
      accountsStore.fetchAccounts(),
      categoriesStore.fetchCategories(),
      budgetsStore.fetchBudgets(),
      goalsStore.fetchGoals()
    ])
  } catch (err) {
    reportError.value = err?.message ?? String(err)
  }
}

async function onPickerSelect(date) {
  if (!date) return
  pickerDate.value = date
  pickerMenu.value = false
  await loadReport()
}

onMounted(async () => {
  await transactionsStore.fetchMonthsWithData()
  if (transactionsStore.monthsWithData.length) {
    const latest = transactionsStore.monthsWithData[transactionsStore.monthsWithData.length - 1]
    const year = Number(latest.slice(0, 4))
    const month = Number(latest.slice(4, 6)) - 1
    pickerDate.value = new Date(year, month, 1)
  }
  await loadReport()
})
</script>
