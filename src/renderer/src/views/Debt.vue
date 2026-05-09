<template>
  <v-container fluid class="pa-6">


    <v-card class="mb-6" rounded="xl" elevation="0" border>
      <v-row no-gutters>
        <v-col cols="12" sm="3" class="pa-6 text-center border-e border-opacity-25">
          <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2">
            Planned Payment
          </div>
          <div class="text-h4 font-weight-black text-white">
            {{ formatCurrency(totalProjected) }}
          </div>
        </v-col>
        <v-col cols="12" sm="3" class="pa-6 text-center border-e border-opacity-25">
          <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2">
            Paid
          </div>
          <div class="text-h4 font-weight-black text-white">{{ formatCurrency(totalActual) }}</div>
        </v-col>
        <v-col cols="12" sm="3" class="pa-6 text-center border-e border-opacity-25">
          <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2">
            Balance
          </div>
          <div class="text-h4 font-weight-black text-white">
            {{ formatCurrency(totalCurrentBalance) }}
          </div>
        </v-col>
        <v-col cols="12" sm="3" class="pa-6 text-center">
          <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2">
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

    <v-row class="mb-4">
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

    <!-- Payoff Projection Panel -->
    <v-card v-if="projectionRows.length > 0" rounded="xl" elevation="0" border class="mb-6">
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

    <v-table density="comfortable">
      <thead>
        <tr>
          <th class="text-start font-weight-bold text-uppercase text-caption pl-4">Priority</th>
          <th class="text-center font-weight-bold text-uppercase text-caption">Debt</th>
          <th class="text-center font-weight-bold text-uppercase text-caption">Current Balance</th>
          <th class="text-center font-weight-bold text-uppercase text-caption">Starting Balance</th>
          <th class="text-center font-weight-bold text-uppercase text-caption">APR</th>
          <th class="text-center font-weight-bold text-uppercase text-caption">Min Payment</th>
          <th class="text-center font-weight-bold text-uppercase text-caption">Planned Payment</th>
          <th class="text-center font-weight-bold text-uppercase text-caption">Paid</th>
          <th class="text-center font-weight-bold text-uppercase text-caption">Credit Limit</th>
          <th class="text-center font-weight-bold text-uppercase text-caption">Utilization</th>
          <th class="text-center font-weight-bold text-uppercase text-caption">Payoff Progress</th>
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
            <div>
              {{ debt.name }}
              <div class="text-caption text-medium-emphasis text-none">
                {{ debt.accountType }}
              </div>
            </div>
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

function updateDebtDetail(id, updates) {
  debtsStore.upsertDebtDetail(id, updates)
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
