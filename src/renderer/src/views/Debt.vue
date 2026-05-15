<template>
  <v-container fluid class="pa-6">
    <!-- Control Bar -->
    <v-card class="mb-6" rounded elevation="2">
      <v-card-text class="pa-5">
        <v-row align="stretch">
          <!-- Inputs: Extra Payment + Strategy -->
          <v-col
            cols="12"
            md="4"
            class="d-flex flex-column gap-4 pe-6"
            style="border-right: 1px solid rgba(255, 255, 255, 0.12)"
          >
            <div>
              <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2">
                Extra Monthly Payment
              </div>
              <v-text-field
                :model-value="debtsStore.extraPayment"
                type="number"
                prefix="$"
                variant="outlined"
                density="compact"
                hide-details
                style="max-width: 200px"
                @update:model-value="debtsStore.setExtraPayment"
              />
            </div>
            <div>
              <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2">
                Strategy
              </div>
              <v-btn-toggle
                :model-value="debtsStore.strategy"
                mandatory
                divided
                variant="outlined"
                density="compact"
                color="primary"
                @update:model-value="debtsStore.setStrategy"
              >
                <v-btn value="avalanche" size="small" prepend-icon="mdi-fire">Avalanche</v-btn>
                <v-btn value="snowball" size="small" prepend-icon="mdi-snowflake">Snowball</v-btn>
              </v-btn-toggle>
            </div>
          </v-col>

          <!-- Current Focus Debt -->
          <v-col
            cols="12"
            md="3"
            class="px-6 d-flex flex-column justify-center"
            style="border-right: 1px solid rgba(255, 255, 255, 0.12)"
          >
            <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-3">
              Current Focus Debt
            </div>
            <template v-if="focusDebt">
              <div class="text-subtitle-1 font-weight-bold mb-2">{{ focusDebt.name }}</div>
              <div class="d-flex align-center gap-2 flex-wrap">
                <v-chip color="error" variant="tonal" size="small">
                  {{ formatPercent(focusDebt.interestRate) }} APR
                </v-chip>
                <v-chip variant="tonal" size="small">
                  {{ formatCurrency(focusDebt.currentBalance) }}
                </v-chip>
                <v-chip color="primary" variant="tonal" size="small">
                  {{ formatCurrency(focusPayment) }}/mo
                </v-chip>
              </div>
            </template>
            <div v-else class="text-medium-emphasis text-body-2">No active debts</div>
          </v-col>

          <!-- Summary Stats -->
          <v-col cols="12" md="5" class="ps-6">
            <v-row dense>
              <v-col cols="6" class="pb-4">
                <div
                  class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-1"
                >
                  Estimated Payoff
                </div>
                <div class="text-h6 font-weight-black">{{ estimatedPayoffDate }}</div>
              </v-col>
              <v-col cols="6" class="pb-4">
                <div
                  class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-1"
                >
                  Total Interest Paid
                </div>
                <div class="text-h6 font-weight-black text-warning">
                  {{ formatCurrency(activeSimulation.totalInterest) }}
                </div>
              </v-col>
              <v-col cols="6">
                <div
                  class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-1"
                >
                  Debt Free In
                </div>
                <div class="text-h6 font-weight-black">{{ debtFreeIn }}</div>
              </v-col>
              <v-col cols="6">
                <div
                  class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-1"
                >
                  Total Paid
                </div>
                <div class="text-h6 font-weight-black">
                  {{ formatCurrency(activeSimulation.totalPaid) }}
                </div>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Payoff Projection Panel -->
    <v-card v-if="projectionRows.length > 0" rounded elevation="2" class="mb-6">
      <v-card-title
        class="pa-4 d-flex align-center justify-space-between cursor-pointer"
        @click="showProjections = !showProjections"
      >
        <div class="d-flex align-center gap-2">
          <v-icon color="primary" size="20">mdi-calculator-variant-outline</v-icon>
          <span class="text-h6 font-weight-bold">Payoff Projection</span>
        </div>
        <v-icon>{{ showProjections ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
      </v-card-title>

      <v-expand-transition>
        <div v-if="showProjections">
          <v-divider />
          <v-card-text class="pa-5">
            <v-row class="mb-4">
              <!-- Per-debt payoff table -->
              <v-col cols="12" lg="7">
                <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-3">
                  Payoff timeline (current payment)
                </div>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th class="text-start text-caption">Debt</th>
                      <th class="text-right text-caption">Balance</th>
                      <th class="text-right text-caption">Payment</th>
                      <th class="text-right text-caption">Payoff</th>
                      <th class="text-right text-caption">Interest</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in projectionRows" :key="row.id">
                      <td class="text-body-2">{{ row.name }}</td>
                      <td class="text-right text-body-2">
                        {{ formatCurrency(row.currentBalance) }}
                      </td>
                      <td class="text-right text-body-2">{{ formatCurrency(row.payment) }}</td>
                      <td class="text-right text-body-2">
                        <span v-if="row.payoff" class="text-success font-weight-medium">{{
                          row.payoffLabel
                        }}</span>
                        <span v-else class="text-error text-caption">Payment too low</span>
                      </td>
                      <td class="text-right text-body-2 text-warning">
                        {{ row.payoff ? formatCurrency(row.payoff.interest) : '—' }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-col>

              <!-- Avalanche vs Snowball -->
              <v-col cols="12" lg="5">
                <v-row>
                  <v-col cols="6">
                    <div
                      class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2"
                    >
                      Avalanche order
                      <v-tooltip text="Highest APR first — minimizes total interest">
                        <template #activator="{ props }">
                          <v-icon v-bind="props" size="14" class="ml-1"
                            >mdi-information-outline</v-icon
                          >
                        </template>
                      </v-tooltip>
                    </div>
                    <ol class="pl-4">
                      <li v-for="(row, i) in avalancheOrder" :key="row.id" class="text-body-2 mb-1">
                        {{ row.name }}
                        <span class="text-caption text-medium-emphasis ml-1">{{
                          formatPercent(row.interestRate)
                        }}</span>
                      </li>
                    </ol>
                  </v-col>
                  <v-col cols="6">
                    <div
                      class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2"
                    >
                      Snowball order
                      <v-tooltip text="Lowest balance first — fastest psychological wins">
                        <template #activator="{ props }">
                          <v-icon v-bind="props" size="14" class="ml-1"
                            >mdi-information-outline</v-icon
                          >
                        </template>
                      </v-tooltip>
                    </div>
                    <ol class="pl-4">
                      <li v-for="row in snowballOrder" :key="row.id" class="text-body-2 mb-1">
                        {{ row.name }}
                        <span class="text-caption text-medium-emphasis ml-1">{{
                          formatCurrency(row.currentBalance)
                        }}</span>
                      </li>
                    </ol>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-card-text>
        </div>
      </v-expand-transition>
    </v-card>

    <v-card rounded elevation="2">
      <v-card-item class="pa-4 pb-0">
        <template #prepend>
          <v-icon color="error" size="20" :opacity="0.7">mdi-cash-remove</v-icon>
        </template>
        <v-card-title class="text-h6 font-weight-bold pl-2">Debt Accounts</v-card-title>
      </v-card-item>

      <v-table density="comfortable" class="mt-2">
        <thead>
          <tr>
            <th class="text-start font-weight-bold text-uppercase text-caption pl-4">Priority</th>
            <th class="text-center font-weight-bold text-uppercase text-caption">Debt</th>
            <th class="text-center font-weight-bold text-uppercase text-caption">
              Current Balance
            </th>
            <th class="text-center font-weight-bold text-uppercase text-caption">
              Starting Balance
            </th>
            <th class="text-center font-weight-bold text-uppercase text-caption">APR</th>
            <th class="text-center font-weight-bold text-uppercase text-caption">Min Payment</th>
            <th class="text-center font-weight-bold text-uppercase text-caption">
              Planned Payment
            </th>
            <th class="text-center font-weight-bold text-uppercase text-caption">Paid</th>
            <th class="text-center font-weight-bold text-uppercase text-caption">Credit Limit</th>
            <th class="text-center font-weight-bold text-uppercase text-caption">Utilization</th>
            <th class="text-center font-weight-bold text-uppercase text-caption">
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
          <tr v-for="(debt, idx) in debtRows" :key="debt.id">
            <td class="text-center text-medium-emphasis">
              {{ idx + 1 }}
            </td>
            <td class="font-weight-medium text-body-2 text-uppercase pl-4">
              {{ debt.name }}
            </td>
            <td>
              <v-text-field
                :model-value="debt.currentBalance"
                type="number"
                prefix="$"
                variant="solo"
                flat
                density="compact"
                hide-details
                @update:model-value="(val) => updateDebtDetail(debt.id, { currentBalance: val })"
              />
            </td>
            <td>
              <v-text-field
                :model-value="debt.startingBalance"
                type="number"
                prefix="$"
                variant="solo"
                flat
                density="compact"
                hide-details
                @update:model-value="(val) => updateDebtDetail(debt.id, { startingBalance: val })"
              />
            </td>
            <td>
              <v-text-field
                :model-value="debt.interestRate"
                type="number"
                suffix="%"
                variant="solo"
                flat
                density="compact"
                hide-details
                @update:model-value="(val) => updateDebtDetail(debt.id, { interestRate: val })"
              />
            </td>
            <td>
              <v-text-field
                :model-value="debt.minimumPayment"
                type="number"
                prefix="$"
                variant="solo"
                flat
                density="compact"
                hide-details
                @update:model-value="(val) => updateDebtDetail(debt.id, { minimumPayment: val })"
              />
            </td>
            <td>
              <v-text-field
                :model-value="debt.projected"
                type="number"
                prefix="$"
                variant="solo"
                flat
                density="compact"
                hide-details
                class="text-center font-weight-bold"
                @update:model-value="(val) => updateBudgetInline(debt.id, val)"
              />
            </td>
            <td class="text-center font-weight-bold">
              {{ formatCurrency(debt.actual) }}
            </td>
            <td>
              <v-text-field
                :model-value="debt.creditLimit"
                type="number"
                prefix="$"
                variant="solo"
                flat
                density="compact"
                hide-details
                @update:model-value="(val) => updateDebtDetail(debt.id, { creditLimit: val })"
              />
            </td>
            <td class="text-center font-weight-bold">
              <span :class="debt.utilization >= 70 ? 'text-warning' : 'text-medium-emphasis'"
                >{{ debt.utilization }}%</span
              >
            </td>
            <td class="text-center">
              <div class="d-flex align-center gap-2">
                <v-progress-linear
                  :model-value="debt.progress"
                  :color="debt.progress >= 100 ? 'success' : 'primary'"
                  height="4"
                  rounded
                />
                <span class="text-caption text-medium-emphasis" style="min-width: 32px">{{
                  debt.progressLabel
                }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useUserAccountsStore } from '../stores/userAccounts'
import { useUserBudgetsStore } from '../stores/userBudgets'
import { useUserDebtsStore } from '../stores/userDebts'
import { useUserSettingsStore } from '../stores/userSettings'
import { useUserTransactionsStore } from '../stores/userTransactions'

const accountsStore = useUserAccountsStore()
const budgetsStore = useUserBudgetsStore()
const debtsStore = useUserDebtsStore()
const settingsStore = useUserSettingsStore()
const transactionsStore = useUserTransactionsStore()

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

function getDebtDetail(id) {
  return debtsStore.getDetail(id)
}

async function updateDebtDetail(id, updates) {
  await debtsStore.upsertDebtDetail(id, updates)
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
    // Credit card payments reduce balance → negative TRNAMT in OFX
    if (!accountId || amount >= 0) continue
    payments.set(accountId, (payments.get(accountId) || 0) + Math.abs(amount))
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

// ── Rollover Simulation Engine ────────────────────────────────────────────────

function runSimulation(debts, extra, strategy) {
  if (!debts.length) return { results: [], totalMonths: 0, totalInterest: 0, totalPaid: 0 }

  const sorted = [...debts].sort((a, b) =>
    strategy === 'avalanche'
      ? b.interestRate - a.interestRate || b.currentBalance - a.currentBalance
      : a.currentBalance - b.currentBalance || b.interestRate - a.interestRate
  )

  const n = sorted.length
  const balances = sorted.map((d) => d.currentBalance)
  const minimums = sorted.map((d) => d.minimumPayment)
  const rates = sorted.map((d) => d.interestRate / 100 / 12)
  const interestAccum = new Array(n).fill(0)
  const payoffMonth = new Array(n).fill(null)
  const paymentAtPayoff = new Array(n).fill(0)

  let month = 0
  while (balances.some((b) => b > 0.01) && month < 600) {
    month++
    for (let i = 0; i < n; i++) {
      if (balances[i] > 0) {
        const interest = balances[i] * rates[i]
        balances[i] += interest
        interestAccum[i] += interest
      }
    }
    let pool = extra
    for (let i = 0; i < n; i++) {
      if (balances[i] > 0) pool += minimums[i]
    }
    const monthPool = pool
    const focusIdx = balances.findIndex((b) => b > 0.01)
    for (let i = 0; i < n; i++) {
      if (i === focusIdx || balances[i] <= 0.01) continue
      const pay = Math.min(minimums[i], balances[i])
      balances[i] = Math.max(0, balances[i] - pay)
      pool -= pay
      if (balances[i] <= 0.01) {
        balances[i] = 0
        payoffMonth[i] = month
        paymentAtPayoff[i] = monthPool
      }
    }
    if (focusIdx >= 0) {
      balances[focusIdx] = Math.max(0, balances[focusIdx] - Math.min(pool, balances[focusIdx]))
      if (balances[focusIdx] <= 0.01) {
        balances[focusIdx] = 0
        payoffMonth[focusIdx] = month
        paymentAtPayoff[focusIdx] = monthPool
      }
    }
  }

  const totalMonths = Math.max(0, ...payoffMonth.map((m) => m ?? month))
  const totalInterest = interestAccum.reduce((s, v) => s + v, 0)
  const totalPaid = sorted.reduce((s, d) => s + d.currentBalance, 0) + totalInterest

  return {
    results: sorted.map((d, i) => ({
      id: d.id,
      name: d.name,
      priority: i + 1,
      currentBalance: d.currentBalance,
      interestRate: d.interestRate,
      minimumPayment: d.minimumPayment,
      payoffMonth: payoffMonth[i] ?? totalMonths,
      totalInterest: interestAccum[i],
      paymentAtPayoff: paymentAtPayoff[i]
    })),
    totalMonths,
    totalInterest,
    totalPaid
  }
}

const activeSimulation = computed(() =>
  runSimulation(
    debtRows.value.filter((d) => d.currentBalance > 0),
    debtsStore.extraPayment,
    debtsStore.strategy
  )
)

const focusDebt = computed(() => {
  const first = activeSimulation.value.results[0]
  return first ? (debtRows.value.find((d) => d.id === first.id) ?? null) : null
})

const focusPayment = computed(() =>
  focusDebt.value ? (focusDebt.value.minimumPayment || 0) + debtsStore.extraPayment : 0
)

const estimatedPayoffDate = computed(() => {
  const m = activeSimulation.value.totalMonths
  if (!m) return 'N/A'
  const d = new Date()
  d.setMonth(d.getMonth() + m)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
})

const debtFreeIn = computed(() => {
  const m = activeSimulation.value.totalMonths
  if (!m) return 'N/A'
  const y = Math.floor(m / 12)
  const mo = m % 12
  if (y === 0) return `${mo}mo`
  return mo ? `${y}y ${mo}mo` : `${y}y`
})

const minimumsSimulation = computed(() =>
  runSimulation(
    debtRows.value.filter((d) => d.currentBalance > 0),
    0,
    debtsStore.strategy
  )
)

const avalancheSimulation = computed(() =>
  runSimulation(
    debtRows.value.filter((d) => d.currentBalance > 0),
    debtsStore.extraPayment,
    'avalanche'
  )
)

const snowballSimulation = computed(() =>
  runSimulation(
    debtRows.value.filter((d) => d.currentBalance > 0),
    debtsStore.extraPayment,
    'snowball'
  )
)

const strategyRows = computed(() =>
  activeSimulation.value.results.map((r) => {
    const debt = debtRows.value.find((d) => d.id === r.id)
    return {
      ...r,
      projected: debt?.projected ?? 0,
      actual: debt?.actual ?? 0,
      creditLimit: debt?.creditLimit ?? 0,
      utilization: debt?.utilization ?? 0
    }
  })
)

const timelineRows = computed(() => {
  const base = new Date()
  return activeSimulation.value.results.map((r) => {
    const d = new Date(base)
    d.setMonth(base.getMonth() + r.payoffMonth)
    return {
      ...r,
      payoffDate: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      isFocus: r.priority === 1
    }
  })
})

const chartBars = computed(() => {
  const base = new Date()
  return [...activeSimulation.value.results]
    .sort((a, b) => a.payoffMonth - b.payoffMonth)
    .map((r) => {
      const d = new Date(base)
      d.setMonth(base.getMonth() + r.payoffMonth)
      return {
        id: r.id,
        label: r.name,
        month: r.payoffMonth,
        monthLabel: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: r.paymentAtPayoff,
        isFocus: r.priority === 1
      }
    })
})

const interestSaved = computed(() =>
  Math.max(0, minimumsSimulation.value.totalInterest - activeSimulation.value.totalInterest)
)

const monthsSaved = computed(() =>
  Math.max(0, minimumsSimulation.value.totalMonths - activeSimulation.value.totalMonths)
)

// ── Payoff Projections ────────────────────────────────────────────────────────

function calculatePayoff(balance, apr, monthlyPayment) {
  if (!monthlyPayment || !balance) return null
  const monthlyRate = apr / 100 / 12
  if (monthlyRate === 0) {
    return { months: Math.ceil(balance / monthlyPayment), interest: 0 }
  }
  // Payment must exceed interest accrual or debt never clears
  if (monthlyPayment <= balance * monthlyRate) return null
  const months = Math.ceil(
    -Math.log(1 - (monthlyRate * balance) / monthlyPayment) / Math.log(1 + monthlyRate)
  )
  const interest = monthlyPayment * months - balance
  return { months, interest: Math.max(interest, 0) }
}

const projectionRows = computed(() =>
  debtRows.value
    .filter((d) => d.currentBalance > 0)
    .map((d) => {
      const payment = d.projected || d.minimumPayment || 0
      const payoff = calculatePayoff(d.currentBalance, d.interestRate, payment)
      if (!payoff)
        return {
          id: d.id,
          name: d.name,
          currentBalance: d.currentBalance,
          interestRate: d.interestRate,
          payment,
          payoff: null
        }
      const payoffDate = new Date()
      payoffDate.setMonth(payoffDate.getMonth() + payoff.months)
      return {
        id: d.id,
        name: d.name,
        currentBalance: d.currentBalance,
        interestRate: d.interestRate,
        payment,
        payoff,
        payoffLabel: `${payoff.months} mo · ${payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
      }
    })
)

const avalancheOrder = computed(() =>
  [...projectionRows.value].sort((a, b) => b.interestRate - a.interestRate)
)

const snowballOrder = computed(() =>
  [...projectionRows.value].sort((a, b) => a.currentBalance - b.currentBalance)
)

const showProjections = ref(false)

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)
}

function formatPercent(val) {
  return `${Number(val || 0).toFixed(2)}%`
}

onMounted(async () => {
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
