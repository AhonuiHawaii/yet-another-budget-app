<template>
  <v-container fluid class="pa-4">
    <div class="d-flex justify-center align-center mb-3">
      <v-btn variant="flat" density="comfortable" rounded="sm" @click="prevMonth">
        <v-icon start size="16">mdi-chevron-left</v-icon>
        {{ prevMonthLabel }}
      </v-btn>
      <span class="text-subtitle-1 font-weight-bold mx-6">{{ monthLabel(selectedMonth) }}</span>
      <v-btn
        variant="flat"
        density="comfortable"
        rounded="sm"
        :disabled="isNextMonthFuture"
        @click="nextMonth"
      >
        {{ nextMonthLabel }}
        <v-icon end size="16">mdi-chevron-right</v-icon>
      </v-btn>
    </div>

    <v-alert v-if="dashboardError" type="error" variant="tonal" class="mb-3">
      {{ dashboardError }}
    </v-alert>

    <!-- Current Spend + Upcoming row -->
    <v-row class="mb-3">
      <v-col cols="12" lg="6">
        <!-- Current Spend -->
        <v-card rounded="sm" elevation="2" class="h-100">
          <v-card-item class="pa-4 pb-2">
            <v-card-title class="text-h6 font-weight-bold">Current Spend</v-card-title>
            <template #append>
              <div v-if="spendVsLastMonth" class="d-flex align-center gap-1">
                <v-icon :color="spendVsLastMonth.less ? 'success' : 'error'" size="16">{{
                  spendVsLastMonth.less
                    ? 'mdi-arrow-down-circle-outline'
                    : 'mdi-arrow-up-circle-outline'
                }}</v-icon>
                <span
                  class="text-caption"
                  :class="spendVsLastMonth.less ? 'text-success' : 'text-error'"
                >
                  You've spent {{ formatCurrency(spendVsLastMonth.diff) }}
                  {{ spendVsLastMonth.less ? 'less' : 'more' }} than last month
                </span>
              </div>
            </template>
          </v-card-item>
          <div class="px-4 pb-1">
            <div class="text-h4 font-weight-black">{{ formatCurrency(totalSpending) }}</div>
          </div>
          <div style="height: 160px; padding: 0 8px 4px">
            <Line :data="currentSpendChartData" :options="currentSpendChartOptions" />
          </div>
          <div class="d-flex gap-4 px-4 pb-3 pt-1">
            <div class="d-flex align-center gap-2">
              <div style="width: 20px; height: 2px; background: #5c6bc0; border-radius: 1px"></div>
              <span class="text-caption text-medium-emphasis">This Month</span>
            </div>
            <div class="d-flex align-center gap-2">
              <div
                style="
                  width: 20px;
                  height: 2px;
                  background: rgba(92, 107, 192, 0.4);
                  border-radius: 1px;
                  border-top: 2px dashed rgba(92, 107, 192, 0.4);
                "
              ></div>
              <span class="text-caption text-medium-emphasis">Last Month</span>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Upcoming -->
      <v-col cols="12" lg="6">
        <v-card rounded="sm" elevation="2" class="h-100">
          <v-card-item class="pa-4 pb-2">
            <v-card-title class="text-h6 font-weight-bold">Upcoming</v-card-title>
          </v-card-item>

          <div class="px-4 pb-2 text-body-2 text-medium-emphasis">
            <template v-if="soonItems.length">
              You have {{ soonItems.length }} recurring charge{{
                soonItems.length !== 1 ? 's' : ''
              }}
              due within the next 7 days for {{ formatCurrencyCompact(soonTotal) }}.
            </template>
            <template v-else>No upcoming charges in the next 7 days.</template>
          </div>

          <div class="d-flex px-2 pb-2" style="min-height: 110px">
            <div
              v-for="(day, i) in upcomingDays"
              :key="i"
              class="d-flex flex-column align-center py-2 flex-grow-1"
              :style="i < 6 ? 'border-right: 1px solid rgba(128,128,128,0.15)' : ''"
            >
              <div
                class="text-caption font-weight-bold mb-1"
                :class="day.isToday ? 'text-error' : 'text-medium-emphasis'"
              >
                {{ day.dayName }}
              </div>
              <div
                class="text-body-2 font-weight-bold mb-2"
                :class="day.isToday ? 'text-error' : ''"
              >
                {{ day.dayNum }}
              </div>
              <div class="d-flex flex-column align-center gap-1 flex-grow-1">
                <v-avatar
                  v-for="item in day.items.slice(0, 2)"
                  :key="item.name"
                  :color="item.urgencyColor"
                  variant="tonal"
                  size="26"
                >
                  <span class="text-caption font-weight-bold" style="font-size: 10px">{{
                    item.initials
                  }}</span>
                </v-avatar>
                <span v-if="day.items.length > 2" class="text-caption text-medium-emphasis"
                  >+{{ day.items.length - 2 }}</span
                >
              </div>
              <div class="mt-1" style="min-height: 20px">
                <v-chip v-if="day.total > 0" size="x-small" variant="tonal">
                  {{ formatCurrencyCompact(day.total) }}
                </v-chip>
              </div>
            </div>
          </div>

          <div class="px-4 pb-4 pt-1">
            <v-btn variant="flat" size="small" rounded="sm" @click="emit('navigate', 'Recurring')">
              See All Upcoming
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Transactions + sidebar row -->
    <v-row>
      <v-col cols="12" lg="6">
        <!-- Recent Transactions -->
        <v-card rounded="sm" elevation="2">
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

        <!-- Accounts -->
        <v-card rounded="sm" elevation="2" class="mt-3">
          <v-card-item class="pa-4 pb-0">
            <v-card-title class="text-h6 font-weight-bold">Accounts</v-card-title>
            <template #append>
              <v-btn
                variant="text"
                size="small"
                density="compact"
                @click="emit('navigate', 'Accounts')"
              >
                See All
              </v-btn>
            </template>
          </v-card-item>

          <div
            v-if="accountRows.length === 0"
            class="py-4 text-center text-medium-emphasis text-body-2"
          >
            No accounts yet.
          </div>

          <v-list v-else density="compact" class="py-1">
            <template v-for="(account, i) in accountRows" :key="account.id">
              <v-list-item class="px-5 py-2">
                <template #prepend>
                  <v-avatar :color="account.color" variant="tonal" size="30" class="mr-3">
                    <v-icon :icon="account.icon" size="16" />
                  </v-avatar>
                </template>
                <v-list-item-title class="text-body-2 font-weight-medium">
                  {{ account.name }}
                </v-list-item-title>
                <template #append>
                  <span
                    class="text-body-2 font-weight-bold"
                    :class="account.balance !== null && account.balance < 0 ? 'text-error' : ''"
                  >
                    {{ account.balance !== null ? formatCurrency(account.balance) : '—' }}
                  </span>
                </template>
              </v-list-item>
              <v-divider v-if="i < accountRows.length - 1" class="mx-5" />
            </template>

            <v-divider />
            <v-list-item class="px-5 py-2" color="primary" rounded="0">
              <v-list-item-title class="text-body-2 font-weight-medium">Net Cash</v-list-item-title>
              <template #append>
                <span
                  class="text-body-2 font-weight-bold mr-1"
                  :class="netCash >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ formatCurrency(netCash) }}
                </span>
                <v-icon size="15" :opacity="0.4">mdi-information-outline</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Right column -->
      <v-col cols="12" lg="6">
        <!-- Budget -->
        <v-card rounded="sm" elevation="2">
          <v-card-item class="pa-4 pb-2">
            <v-card-title class="text-h6 font-weight-bold">Budget</v-card-title>
          </v-card-item>

          <div class="px-4 pb-2">
            <div v-for="row in budgetRows" :key="row.type" class="mb-4">
              <div class="d-flex align-start justify-space-between mb-1">
                <div>
                  <div class="d-flex align-center mb-1">
                    <v-icon size="15" :opacity="0.6" class="mr-2">{{ row.icon }}</v-icon>
                    <span class="text-body-2 font-weight-medium">{{ row.label }}</span>
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatCurrencyCompact(row.actual) }} {{ row.actualLabel }}
                  </div>
                </div>
                <div class="text-end">
                  <div
                    class="text-body-2 font-weight-bold"
                    :class="row.over ? 'text-error' : row.short ? 'text-warning' : ''"
                  >
                    {{ formatCurrencyCompact(row.remaining) }}
                    {{ row.over ? 'over' : row.short ? 'short' : 'left' }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatCurrencyCompact(row.budget) }} budget
                  </div>
                </div>
              </div>
              <v-progress-linear
                :model-value="row.progress"
                :color="row.over ? 'error' : row.rawProgress >= 90 ? 'warning' : 'primary'"
                height="4"
                rounded
              />
            </div>
          </div>

          <div class="px-4 pb-4">
            <v-btn variant="flat" size="small" rounded="sm" @click="emit('navigate', 'Budgets')">
              See All Categories
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
} from 'chart.js'
import { Line } from 'vue-chartjs'
import {
  useUserAccountsStore,
  accountTypeIcon,
  accountTypeColor,
  resolveIsAsset
} from '../stores/userAccounts'
import { useUserBudgetsStore } from '../stores/userBudgets'
import { useUserCategoriesStore } from '../stores/userCategories'
import { useUserTransactionsStore } from '../stores/userTransactions'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const emit = defineEmits(['navigate'])

const ipc = window.electron?.ipcRenderer
const accountsStore = useUserAccountsStore()
const budgetsStore = useUserBudgetsStore()
const categoriesStore = useUserCategoriesStore()
const transactionsStore = useUserTransactionsStore()
const dashboardError = ref(null)
const lastMonthTransactions = ref([])
const recurringTransactions = ref([])

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
function prevMonth() {
  selectedMonth.value = offsetMonth(selectedMonth.value, -1)
}
function nextMonth() {
  selectedMonth.value = offsetMonth(selectedMonth.value, 1)
}

// ── Period bounds ─────────────────────────────────────────────────────────────
const periodBounds = computed(() => {
  const y = parseInt(selectedMonth.value.slice(0, 4))
  const m = parseInt(selectedMonth.value.slice(4, 6)) - 1
  return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0, 23, 59, 59, 999) }
})

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

// ── actualsMap ────────────────────────────────────────────────────────────────
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

// ── Current Spend chart ───────────────────────────────────────────────────────
function buildDailyCumulative(transactions, yyyymm) {
  const year = parseInt(yyyymm.slice(0, 4))
  const month = parseInt(yyyymm.slice(4, 6)) - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daily = new Array(daysInMonth).fill(0)
  for (const t of transactions) {
    const amt = Number(t.TRNAMT)
    if (amt >= 0) continue
    const s = String(t.DTPOSTED || '')
    const d = parseInt(s.slice(6, 8)) - 1
    if (d >= 0 && d < daysInMonth) daily[d] += Math.abs(amt)
  }
  let sum = 0
  return daily.map((v) => (sum += v))
}

function ordinalDay(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

const currentSpendChartData = computed(() => {
  const y = parseInt(selectedMonth.value.slice(0, 4))
  const m = parseInt(selectedMonth.value.slice(4, 6)) - 1
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const labels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1))

  const isCurrentMonth = selectedMonth.value === currentMonthValue()
  const today = isCurrentMonth ? new Date().getDate() : daysInMonth

  const thisData = buildDailyCumulative(currentTransactions.value, selectedMonth.value)
  const lastData = buildDailyCumulative(
    lastMonthTransactions.value,
    offsetMonth(selectedMonth.value, -1)
  )

  const thisMonthData = thisData.map((v, i) => (i < today ? v : null))
  const lastMonthData = Array.from({ length: daysInMonth }, (_, i) => lastData[i] ?? null)

  return {
    labels,
    datasets: [
      {
        label: 'This Month',
        data: thisMonthData,
        borderColor: '#5c6bc0',
        backgroundColor: 'rgba(92, 107, 192, 0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: thisMonthData.map((v, i) => (i === today - 1 && v !== null ? 5 : 0)),
        pointBackgroundColor: '#fff',
        pointBorderColor: '#5c6bc0',
        pointBorderWidth: 2,
        borderWidth: 2,
        spanGaps: false
      },
      {
        label: 'Last Month',
        data: lastMonthData,
        borderColor: 'rgba(92, 107, 192, 0.4)',
        backgroundColor: 'rgba(92, 107, 192, 0.06)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 1.5,
        borderDash: [5, 5],
        spanGaps: false
      }
    ]
  }
})

const currentSpendChartOptions = computed(() => {
  const y = parseInt(selectedMonth.value.slice(0, 4))
  const m = parseInt(selectedMonth.value.slice(4, 6)) - 1
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const tickDays = new Set([1, 9, 16, 24, daysInMonth])
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => ordinalDay(Number(items[0].label)),
          label: (ctx) => ` ${formatCurrency(ctx.parsed.y)}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: 'rgba(255,255,255,0.4)',
          font: { size: 11 },
          maxRotation: 0,
          callback: (_val, index) => (tickDays.has(index + 1) ? ordinalDay(index + 1) : '')
        }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.06)' },
        border: { display: false },
        ticks: {
          color: 'rgba(255,255,255,0.4)',
          font: { size: 11 },
          callback: (v) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`)
        }
      }
    }
  }
})

const spendVsLastMonth = computed(() => {
  if (selectedMonth.value !== currentMonthValue()) return null
  const today = new Date().getDate()
  const thisData = buildDailyCumulative(currentTransactions.value, selectedMonth.value)
  const lastData = buildDailyCumulative(
    lastMonthTransactions.value,
    offsetMonth(selectedMonth.value, -1)
  )
  const thisTotal = thisData[today - 1] || 0
  const lastTotal = lastData[today - 1] || 0
  const diff = lastTotal - thisTotal
  return { diff: Math.abs(diff), less: diff >= 0 }
})

// ── Budget rows ───────────────────────────────────────────────────────────────
function sumBudgetByType(type) {
  return categoriesStore.categories
    .filter((c) => c.type === type)
    .reduce((sum, c) => sum + budgetsStore.getEffectiveBudget(c.id, selectedMonth.value), 0)
}

function sumActualByCategoryType(type) {
  const ids = new Set(categoriesStore.categories.filter((c) => c.type === type).map((c) => c.id))
  let total = 0
  for (const [id, amt] of actualsMap.value) {
    if (ids.has(id)) total += amt
  }
  return total
}

const budgetSections = [
  { type: 'income', label: 'Earnings', icon: 'mdi-cash-plus', actualLabel: 'earned' },
  { type: 'variable', label: 'Spending', icon: 'mdi-credit-card-outline', actualLabel: 'spent' },
  {
    type: 'bills',
    label: 'Bills & Utilities',
    icon: 'mdi-receipt-text-outline',
    actualLabel: 'paid'
  }
]

const budgetRows = computed(() =>
  budgetSections.map(({ type, label, icon, actualLabel }) => {
    const budget = sumBudgetByType(type)
    const actual = type === 'income' ? totalIncome.value : sumActualByCategoryType(type)
    const rawProgress = budget > 0 ? (actual / budget) * 100 : actual > 0 ? 100 : 0
    const diff = type === 'income' ? actual - budget : budget - actual
    return {
      type,
      label,
      icon,
      actualLabel,
      budget,
      actual,
      remaining: Math.abs(diff),
      progress: Math.min(rawProgress, 100),
      rawProgress,
      over: type !== 'income' && diff < 0,
      short: type === 'income' && diff < 0
    }
  })
)

// ── Recent transactions ───────────────────────────────────────────────────────
const recentTransactions = computed(() =>
  [...currentTransactions.value]
    .sort((a, b) => String(b.DTPOSTED || '').localeCompare(String(a.DTPOSTED || '')))
    .slice(0, 5)
)

// ── Accounts ──────────────────────────────────────────────────────────────────
const txSummaryMap = computed(() => {
  const map = {}
  for (const s of transactionsStore.accountSummary) {
    map[s.ACCTID] = s.total ?? 0
  }
  return map
})

const accountRows = computed(() =>
  accountsStore.accounts.map((account) => ({
    id: account.ACCTID,
    name: account.displayName || account.ACCTTYPE || 'Unknown',
    icon: accountTypeIcon(account.ACCTTYPE),
    color: accountTypeColor(account.ACCTTYPE),
    balance:
      account.startingBalance != null
        ? account.startingBalance + (txSummaryMap.value[account.ACCTID] ?? 0)
        : null,
    isAsset: resolveIsAsset(account)
  }))
)

const netCash = computed(() =>
  accountRows.value.reduce((sum, a) => {
    if (a.balance === null) return sum
    return sum + (a.isAsset ? a.balance : -a.balance)
  }, 0)
)

// ── Upcoming (recurring) ──────────────────────────────────────────────────────
function recurringMedian(arr) {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

function daysUntil(dayOfMonth) {
  if (!dayOfMonth) return null
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), dayOfMonth)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth)
  const target = thisMonth >= now ? thisMonth : nextMonth
  return Math.round((target - now) / 86400000)
}

function recurringUrgencyColor(days) {
  if (days === null) return 'default'
  if (days < 0) return 'error'
  if (days <= 3) return 'warning'
  return 'primary'
}

const recurringAllItems = computed(() => {
  const map = new Map()
  for (const tx of recurringTransactions.value) {
    const key = tx.NAME || 'Unknown'
    if (!map.has(key)) map.set(key, { name: key, amounts: [], days: [] })
    const g = map.get(key)
    const amt = Math.abs(Number(tx.TRNAMT))
    if (amt > 0) g.amounts.push(amt)
    if (tx.DTPOSTED?.length >= 8) g.days.push(parseInt(tx.DTPOSTED.slice(6, 8), 10))
  }
  return [...map.values()]
    .map((g) => {
      const typicalAmount = recurringMedian(g.amounts)
      const typicalDay = g.days.length ? recurringMedian(g.days) : null
      const days = daysUntil(typicalDay)
      const initials = g.name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
      return {
        name: g.name,
        typicalAmount,
        typicalDay,
        days,
        urgencyColor: recurringUrgencyColor(days),
        initials
      }
    })
    .filter(
      (item) => item.typicalDay !== null && item.days !== null && item.days >= 0 && item.days <= 7
    )
    .sort((a, b) => a.days - b.days)
})

const soonItems = computed(() => recurringAllItems.value)
const soonTotal = computed(() => soonItems.value.reduce((sum, i) => sum + i.typicalAmount, 0))

const upcomingDays = computed(() => {
  const now = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
    const items = soonItems.value.filter((item) => item.days === i)
    return {
      dayName: i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: date.getDate(),
      items,
      total: items.reduce((sum, item) => sum + item.typicalAmount, 0),
      isToday: i === 0
    }
  })
})

// ── Formatters ────────────────────────────────────────────────────────────────
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)
}

function formatCurrencyCompact(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value || 0)
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

// ── Data loading ──────────────────────────────────────────────────────────────
async function loadDashboard() {
  dashboardError.value = null
  try {
    await Promise.all([
      accountsStore.fetchAccounts(),
      budgetsStore.fetchBudgets(),
      budgetsStore.fetchRollovers(),
      categoriesStore.fetchCategories(),
      transactionsStore.fetchAccountSummary()
    ])
    const [, lastResult, recurringResult] = await Promise.all([
      transactionsStore.fetchTransactionsByMonth(selectedMonth.value),
      ipc?.invoke('transactions:fetch', { DTPOSTED: offsetMonth(selectedMonth.value, -1) }),
      ipc?.invoke('transactions:fetch', { recurring: 1 })
    ])
    lastMonthTransactions.value = lastResult?.success ? (lastResult.data ?? []) : []
    recurringTransactions.value = recurringResult?.success ? (recurringResult.data ?? []) : []
  } catch (err) {
    dashboardError.value = err?.message ?? String(err)
  }
}

onMounted(loadDashboard)
watch(selectedMonth, loadDashboard)
</script>
