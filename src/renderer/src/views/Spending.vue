<template>
  <v-container fluid class="pa-6">
    <div class="d-flex justify-center mb-6">
      <v-btn-group variant="tonal" density="comfortable" rounded="lg">
        <v-btn
          :color="activePeriod === 'last' ? 'primary' : undefined"
          :variant="activePeriod === 'last' ? 'flat' : 'tonal'"
          @click="selectMonth(lastMonthValue())"
        >
          Last Month
        </v-btn>
        <v-btn
          :color="activePeriod === 'this' ? 'primary' : undefined"
          :variant="activePeriod === 'this' ? 'flat' : 'tonal'"
          @click="selectMonth(thisMonthValue())"
        >
          This Month
        </v-btn>
        <v-menu v-model="customMenu" :close-on-content-click="false" location="bottom start">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              :color="activePeriod === 'custom' ? 'primary' : undefined"
              :variant="activePeriod === 'custom' ? 'flat' : 'tonal'"
            >
              {{ activePeriod === 'custom' ? customLabel : 'Custom' }}
              <v-icon end size="16">mdi-chevron-down</v-icon>
            </v-btn>
          </template>

          <v-card elevation="8" rounded="lg" min-width="220">
            <!-- Back header -->
            <div v-if="activeSubmenu" class="d-flex align-center px-2 pt-2">
              <v-btn
                variant="text"
                size="small"
                prepend-icon="mdi-chevron-left"
                @click="activeSubmenu = null"
              >
                Back
              </v-btn>
            </div>

            <!-- Root list -->
            <v-list v-if="!activeSubmenu" density="compact" nav class="py-2">
              <v-list-item
                rounded="lg"
                :active="period.type === 'weekly'"
                color="primary"
                @click="activeSubmenu = 'weekly'"
              >
                <v-list-item-title class="font-weight-bold">Weekly</v-list-item-title>
                <template #append>
                  <v-icon size="16" class="text-medium-emphasis">mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
              <v-list-item
                rounded="lg"
                :active="period.type === 'monthly'"
                color="primary"
                @click="activeSubmenu = 'monthly'"
              >
                <v-list-item-title class="font-weight-bold">Monthly</v-list-item-title>
                <template #append>
                  <v-icon size="16" class="text-medium-emphasis">mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
              <v-list-item
                rounded="lg"
                :active="period.type === 'quarterly'"
                color="primary"
                @click="activeSubmenu = 'quarterly'"
              >
                <v-list-item-title class="font-weight-bold">Quarterly</v-list-item-title>
                <template #append>
                  <v-icon size="16" class="text-medium-emphasis">mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
              <v-list-item
                rounded="lg"
                :active="period.type === 'yearly'"
                color="primary"
                @click="activeSubmenu = 'yearly'"
              >
                <v-list-item-title class="font-weight-bold">Yearly</v-list-item-title>
                <template #append>
                  <v-icon size="16" class="text-medium-emphasis">mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
            </v-list>

            <!-- Weekly list -->
            <v-list v-else-if="activeSubmenu === 'weekly'" density="compact" nav class="py-2">
              <v-list-item
                rounded="lg"
                :active="isThisWeek"
                color="primary"
                @click="selectWeek(thisWeekStart())"
              >
                <v-list-item-title>This week</v-list-item-title>
              </v-list-item>
              <v-list-item
                rounded="lg"
                :active="isLastWeek"
                color="primary"
                @click="selectWeek(lastWeekStart())"
              >
                <v-list-item-title>Last Week</v-list-item-title>
              </v-list-item>
              <v-list-item
                v-for="week in recentWeeks"
                :key="week.start.getTime()"
                rounded="lg"
                :active="period.type === 'weekly' && period.weekStart?.getTime() === week.start.getTime()"
                color="primary"
                @click="selectWeek(week.start)"
              >
                <v-list-item-title>Week of {{ formatWeekStart(week.start) }}</v-list-item-title>
              </v-list-item>
            </v-list>

            <!-- Monthly list -->
            <v-list v-else-if="activeSubmenu === 'monthly'" density="compact" nav class="py-2">
              <v-list-item
                v-for="opt in recentMonths"
                :key="opt.value"
                rounded="lg"
                :active="period.type === 'monthly' && period.month === opt.value"
                color="primary"
                @click="selectMonth(opt.value)"
              >
                <v-list-item-title>{{ opt.label }}</v-list-item-title>
              </v-list-item>
            </v-list>

            <!-- Quarterly list -->
            <v-list v-else-if="activeSubmenu === 'quarterly'" density="compact" nav class="py-2">
              <v-list-item
                v-for="q in recentQuarters"
                :key="`${q.year}-${q.quarter}`"
                rounded="lg"
                :active="period.type === 'quarterly' && period.year === q.year && period.quarter === q.quarter"
                color="primary"
                @click="selectQuarter(q.year, q.quarter)"
              >
                <v-list-item-title>Q{{ q.quarter }} {{ q.year }}</v-list-item-title>
              </v-list-item>
            </v-list>

            <!-- Yearly list -->
            <v-list v-else-if="activeSubmenu === 'yearly'" density="compact" nav class="py-2">
              <v-list-item
                v-for="y in yearOptions"
                :key="y"
                rounded="lg"
                :active="period.type === 'yearly' && period.year === y"
                color="primary"
                @click="selectYear(y)"
              >
                <v-list-item-title>{{ y }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
      </v-btn-group>
    </div>

    <v-row align="start">
      <!-- Left: pie + by category -->
      <v-col cols="12" md="7">
        <v-card rounded elevation="2">
          <!-- Doughnut -->
          <div class="pa-6 pb-4">
            <div style="position: relative; max-width: 460px; margin: 0 auto">
              <Doughnut
                v-if="hasSpending"
                :data="doughnutData"
                :options="doughnutOptions"
                :plugins="[centerPlugin]"
              />
              <div v-else class="text-center py-16 text-medium-emphasis">
                <v-icon size="64" class="mb-4 opacity-20">mdi-chart-donut</v-icon>
                <div class="text-body-1">No spending recorded this month</div>
              </div>
            </div>
          </div>

          <v-divider />

          <!-- By Category label -->
          <div
            class="px-5 pt-4 pb-1 text-caption text-uppercase font-weight-bold text-medium-emphasis"
          >
            By Category
          </div>

          <!-- Legend / Breakdown -->
          <div class="pa-5 pt-2">
            <div
              v-for="(cat, idx) in allCombinedSorted"
              :key="cat.id"
              class="d-flex align-center gap-3 py-2"
              style="border-bottom: 1px solid rgba(255, 255, 255, 0.06)"
            >
              <span
                class="rounded-circle flex-shrink-0"
                style="width: 12px; height: 12px"
                :style="{ backgroundColor: chartColors[idx % chartColors.length] }"
              />
              <span class="text-body-2 font-weight-medium flex-grow-1 text-uppercase">{{
                cat.name
              }}</span>
              <span class="text-caption text-medium-emphasis mr-2">
                {{ formatPercent(cat.actual, totalActual) }}
              </span>
              <span class="text-body-2 font-weight-bold">{{ formatCurrency(cat.actual) }}</span>
            </div>
            <div
              v-if="allCombinedSorted.length === 0"
              class="text-center text-medium-emphasis py-4 text-body-2"
            >
              No categories yet
            </div>
          </div>
          <!-- end pa-5 -->
        </v-card>
      </v-col>

      <!-- Right: summary + frequent spend -->
      <v-col cols="12" md="5">
        <v-card rounded elevation="2">
          <!-- Income -->
          <div
            class="d-flex align-center gap-4 pa-5"
            style="border-bottom: 1px solid rgba(255, 255, 255, 0.06)"
          >
            <div style="width: 28px; display: flex; justify-content: center">
              <v-icon size="22" class="text-medium-emphasis">mdi-bank</v-icon>
            </div>
            <div class="flex-grow-1">
              <div class="text-body-2 font-weight-bold">Income</div>
            </div>
            <div class="text-body-1 font-weight-black">+{{ formatCurrency(totalIncome) }}</div>
          </div>

          <!-- Bills -->
          <div
            class="d-flex align-center gap-4 pa-5"
            style="border-bottom: 1px solid rgba(255, 255, 255, 0.06)"
          >
            <div style="width: 28px; display: flex; justify-content: center">
              <v-icon size="22" class="text-medium-emphasis">mdi-calendar-sync</v-icon>
            </div>
            <div class="flex-grow-1">
              <div class="text-body-2 font-weight-bold">Bills</div>
            </div>
            <div class="text-body-1 font-weight-black">
              {{ formatCurrency(billsActual) }}
            </div>
          </div>

          <!-- Spending -->
          <div class="d-flex align-center gap-4 pa-5">
            <div style="width: 28px; display: flex; justify-content: center">
              <v-icon size="22" class="text-medium-emphasis">mdi-cash-multiple</v-icon>
            </div>
            <div class="flex-grow-1">
              <div class="text-body-2 font-weight-bold">Spending</div>
            </div>
            <div class="text-body-1 font-weight-black">
              {{ formatCurrency(variableActual) }}
            </div>
          </div>
        </v-card>

        <!-- Frequent Spend -->
        <v-card rounded elevation="2" class="mt-4">
          <div class="pa-5 pb-3">
            <div class="text-body-2 font-weight-bold mb-4">Frequent Spend</div>

            <!-- Summary sentence -->
            <div
              v-if="topMerchant"
              class="text-body-2 text-medium-emphasis mb-4 pa-3 rounded"
              style="background: rgba(255, 255, 255, 0.05)"
            >
              You've spent at
              <span class="text-white font-weight-bold">{{ topMerchant.name }}</span>
              <span class="font-weight-bold text-white"> {{ topMerchant.count }}x</span>
              this month, averaging {{ formatCurrency(topMerchant.avg) }} per visit.
            </div>

            <!-- Merchant rows -->
            <div
              v-for="(m, idx) in displayedMerchants"
              :key="m.name"
              class="d-flex align-center gap-3 py-3"
              style="border-bottom: 1px solid rgba(255, 255, 255, 0.06)"
            >
              <v-avatar
                :color="merchantColors[idx % merchantColors.length]"
                variant="tonal"
                size="38"
                class="text-caption font-weight-black flex-shrink-0"
              >
                {{ m.count }}x
              </v-avatar>
              <div class="flex-grow-1 min-width-0">
                <div class="text-body-2 font-weight-bold text-truncate">{{ m.name }}</div>
                <div class="text-caption text-medium-emphasis">
                  Average {{ formatCurrency(m.avg) }}
                </div>
              </div>
              <div class="text-body-2 font-weight-black flex-shrink-0">
                {{ formatCurrency(m.total) }}
              </div>
            </div>

            <div
              v-if="frequentMerchants.length === 0"
              class="text-center text-medium-emphasis py-4 text-body-2"
            >
              No transactions this month
            </div>
          </div>

          <!-- See more -->
          <div v-if="frequentMerchants.length > 3" class="pa-3 pt-0">
            <v-btn
              variant="outlined"
              block
              size="small"
              @click="showAllMerchants = !showAllMerchants"
            >
              {{ showAllMerchants ? 'Show less' : 'See more' }}
            </v-btn>
          </div>
        </v-card>
        <!-- Largest Purchases -->
        <v-card rounded elevation="2" class="mt-4">
          <div class="pa-5 pb-3">
            <div class="text-body-2 font-weight-bold mb-4">Largest Purchases</div>

            <!-- Summary sentence -->
            <div
              v-if="topPurchase"
              class="text-body-2 text-medium-emphasis mb-4 pa-3 rounded"
              style="background: rgba(255, 255, 255, 0.05)"
            >
              Your biggest purchase was
              <span class="text-white font-weight-bold">{{ topPurchase.name }}</span>
              at
              <span class="text-white font-weight-bold">{{
                formatCurrency(topPurchase.amount)
              }}</span
              >.
            </div>

            <!-- Purchase rows -->
            <div
              v-for="(p, idx) in displayedPurchases"
              :key="p.FITID"
              class="d-flex align-center gap-3 py-3"
              style="border-bottom: 1px solid rgba(255, 255, 255, 0.06)"
            >
              <v-avatar
                :color="merchantColors[idx % merchantColors.length]"
                variant="tonal"
                size="38"
                class="text-caption font-weight-black flex-shrink-0"
              >
                #{{ idx + 1 }}
              </v-avatar>
              <div class="flex-grow-1 min-width-0">
                <div class="text-body-2 font-weight-bold text-truncate">{{ p.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ p.dateLabel }}</div>
              </div>
              <div class="text-body-2 font-weight-black flex-shrink-0">
                {{ formatCurrency(p.amount) }}
              </div>
            </div>

            <div
              v-if="largestPurchases.length === 0"
              class="text-center text-medium-emphasis py-4 text-body-2"
            >
              No transactions this month
            </div>
          </div>

          <div v-if="largestPurchases.length > 3" class="pa-3 pt-0">
            <v-btn
              variant="outlined"
              block
              size="small"
              @click="showAllPurchases = !showAllPurchases"
            >
              {{ showAllPurchases ? 'Show less' : 'See more' }}
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import { useUserCategoriesStore } from '../stores/userCategories'
import { useUserBudgetsStore } from '../stores/userBudgets'
import { useUserTransactionsStore } from '../stores/userTransactions'

ChartJS.register(ArcElement, Tooltip)

const categoriesStore = useUserCategoriesStore()
const budgetsStore = useUserBudgetsStore()

const transactionsStore = useUserTransactionsStore()

const chartColors = [
  '#3B82F6',
  '#7C3AED',
  '#EC4899',
  '#F59E0B',
  '#10B981',
  '#EF4444',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#8B5CF6',
  '#14B8A6',
  '#FB923C',
  '#A78BFA',
  '#34D399',
  '#F472B6'
]

// ── Period ────────────────────────────────────────────────────────────────────
function thisMonthValue() {
  const now = new Date()
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
}

function lastMonthValue() {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(yyyymm) {
  const year = Number(yyyymm.slice(0, 4))
  const month = Number(yyyymm.slice(4, 6)) - 1
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function thisWeekStart() {
  const now = new Date()
  const dow = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
  monday.setHours(0, 0, 0, 0)
  return monday
}

function lastWeekStart() {
  const monday = thisWeekStart()
  monday.setDate(monday.getDate() - 7)
  return monday
}

function formatWeekStart(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const period = ref({ type: 'monthly', month: thisMonthValue() })
const customMenu = ref(false)
const activeSubmenu = ref(null)

const activePeriod = computed(() => {
  if (period.value.type === 'monthly') {
    if (period.value.month === thisMonthValue()) return 'this'
    if (period.value.month === lastMonthValue()) return 'last'
  }
  return 'custom'
})

const customLabel = computed(() => {
  const p = period.value
  if (p.type === 'monthly') return monthLabel(p.month)
  if (p.type === 'weekly')
    return `Week of ${p.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  if (p.type === 'quarterly') return `Q${p.quarter} ${p.year}`
  if (p.type === 'yearly') return String(p.year)
  return 'Custom'
})

const isThisWeek = computed(
  () => period.value.type === 'weekly' && period.value.weekStart?.getTime() === thisWeekStart().getTime()
)

const isLastWeek = computed(
  () => period.value.type === 'weekly' && period.value.weekStart?.getTime() === lastWeekStart().getTime()
)

const recentWeeks = computed(() => {
  const start = thisWeekStart()
  return Array.from({ length: 8 }, (_, i) => {
    const monday = new Date(start)
    monday.setDate(monday.getDate() - (i + 2) * 7)
    return { start: monday }
  })
})

const recentMonths = computed(() => {
  const thisYear = new Date().getFullYear()
  return Array.from({ length: 18 }, (_, i) => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1)
    return {
      value: `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`,
      label:
        d.getFullYear() === thisYear
          ? d.toLocaleDateString('en-US', { month: 'long' })
          : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
  })
})

const recentQuarters = computed(() => {
  const quarters = []
  let year = new Date().getFullYear()
  let quarter = Math.ceil((new Date().getMonth() + 1) / 3)
  for (let i = 0; i < 8; i++) {
    quarters.push({ year, quarter })
    quarter--
    if (quarter === 0) {
      quarter = 4
      year--
    }
  }
  return quarters
})

const yearOptions = computed(() => {
  const y = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, i) => y - i)
})

function selectMonth(yyyymm) {
  period.value = { type: 'monthly', month: yyyymm }
  customMenu.value = false
  activeSubmenu.value = null
}

function selectWeek(weekStart) {
  period.value = { type: 'weekly', weekStart: new Date(weekStart) }
  customMenu.value = false
  activeSubmenu.value = null
}

function selectQuarter(year, quarter) {
  period.value = { type: 'quarterly', year, quarter }
  customMenu.value = false
  activeSubmenu.value = null
}

function selectYear(year) {
  period.value = { type: 'yearly', year }
  customMenu.value = false
  activeSubmenu.value = null
}

watch(customMenu, (isOpen) => {
  if (!isOpen) activeSubmenu.value = null
})

const periodBounds = computed(() => {
  const p = period.value
  if (p.type === 'monthly') {
    const y = parseInt(p.month.slice(0, 4))
    const m = parseInt(p.month.slice(4, 6)) - 1
    return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0, 23, 59, 59, 999) }
  }
  if (p.type === 'weekly') {
    const end = new Date(p.weekStart)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return { start: new Date(p.weekStart), end }
  }
  if (p.type === 'quarterly') {
    const startM = (p.quarter - 1) * 3
    return { start: new Date(p.year, startM, 1), end: new Date(p.year, startM + 3, 0, 23, 59, 59, 999) }
  }
  if (p.type === 'yearly') {
    return { start: new Date(p.year, 0, 1), end: new Date(p.year + 1, 0, 0, 23, 59, 59, 999) }
  }
  return { start: new Date(), end: new Date() }
})

async function applyPeriod() {
  const p = period.value
  if (p.type === 'monthly') {
    await transactionsStore.fetchTransactionsByMonth(p.month)
  } else if (p.type === 'weekly') {
    const m = p.weekStart.getMonth() + 1
    const ym = `${p.weekStart.getFullYear()}${String(m).padStart(2, '0')}`
    await transactionsStore.fetchTransactionsByMonth(ym)
  } else if (p.type === 'quarterly') {
    const months = [0, 1, 2].map((i) => {
      const m = (p.quarter - 1) * 3 + i + 1
      return `${p.year}${String(m).padStart(2, '0')}`
    })
    await transactionsStore.fetchTransactionsForPeriod(months)
  } else if (p.type === 'yearly') {
    const months = Array.from({ length: 12 }, (_, i) => `${p.year}${String(i + 1).padStart(2, '0')}`)
    await transactionsStore.fetchTransactionsForPeriod(months)
  }
}

// ── Transactions ──────────────────────────────────────────────────────────────
const currentTransactions = computed(() => {
  const bounds = periodBounds.value
  return transactionsStore.transactions.filter((t) => {
    const s = String(t.DTPOSTED || '')
    const tDate = new Date(
      parseInt(s.slice(0, 4)),
      parseInt(s.slice(4, 6)) - 1,
      parseInt(s.slice(6, 8))
    )
    return tDate >= bounds.start && tDate <= bounds.end
  })
})

function buildActualsMap(catList) {
  const actuals = new Map()
  for (const t of currentTransactions.value) {
    const trnAmt = Number(t.TRNAMT)
    if (t.category)
      actuals.set(t.category, (actuals.get(t.category) || 0) + (trnAmt < 0 ? Math.abs(trnAmt) : 0))
    if (t.splitCategory1 && t.splitCategory1 !== t.category && t.splitAmount1 > 0)
      actuals.set(t.splitCategory1, (actuals.get(t.splitCategory1) || 0) + t.splitAmount1)
    if (t.splitCategory2 && t.splitCategory2 !== t.category && t.splitAmount2 > 0)
      actuals.set(t.splitCategory2, (actuals.get(t.splitCategory2) || 0) + t.splitAmount2)
  }
  return catList.map((cat) => ({
    ...cat,
    projected: budgetsStore.getEffectiveBudget(cat.id, period.value.month ?? thisMonthValue()),
    actual: actuals.get(cat.id) || 0
  }))
}

const allCombinedSorted = computed(() => {
  const variable = buildActualsMap(categoriesStore.getCategoriesByType('variable'))
  const bills = buildActualsMap(categoriesStore.getCategoriesByType('bills'))
  return [...variable, ...bills].filter((c) => c.actual > 0).sort((a, b) => b.actual - a.actual)
})

const totalActual = computed(() => allCombinedSorted.value.reduce((s, c) => s + c.actual, 0))
const hasSpending = computed(() => totalActual.value > 0)

// ── Summary card computed ──────────────────────────────────────────────────────
const totalIncome = computed(() =>
  currentTransactions.value.reduce((s, t) => {
    const amt = Number(t.TRNAMT)
    return s + (amt > 0 ? amt : 0)
  }, 0)
)

const variableCombined = computed(() =>
  buildActualsMap(categoriesStore.getCategoriesByType('variable'))
)
const billsCombinedAll = computed(() =>
  buildActualsMap(categoriesStore.getCategoriesByType('bills'))
)

const variableActual = computed(() => variableCombined.value.reduce((s, c) => s + c.actual, 0))
const variableProjected = computed(() =>
  variableCombined.value.reduce((s, c) => s + c.projected, 0)
)
const variableRemaining = computed(() => variableProjected.value - variableActual.value)

const billsActual = computed(() => billsCombinedAll.value.reduce((s, c) => s + c.actual, 0))
const billsProjected = computed(() => billsCombinedAll.value.reduce((s, c) => s + c.projected, 0))
const billsRemaining = computed(() => billsProjected.value - billsActual.value)

// ── Frequent spend ─────────────────────────────────────────────────────────────
const merchantColors = ['primary', 'secondary', 'warning', 'success', 'error', 'info']
const showAllMerchants = ref(false)

const frequentMerchants = computed(() => {
  const map = new Map()
  for (const t of currentTransactions.value) {
    const amt = Number(t.TRNAMT)
    if (amt >= 0) continue
    const name = t.NAME || t.MEMO || 'Unknown'
    const entry = map.get(name) || { name, count: 0, total: 0 }
    entry.count++
    entry.total += Math.abs(amt)
    map.set(name, entry)
  }
  return Array.from(map.values())
    .map((m) => ({ ...m, avg: m.total / m.count }))
    .sort((a, b) => b.count - a.count)
})

const topMerchant = computed(() => frequentMerchants.value[0] ?? null)
const displayedMerchants = computed(() =>
  showAllMerchants.value ? frequentMerchants.value : frequentMerchants.value.slice(0, 3)
)

// ── Largest purchases ─────────────────────────────────────────────────────────
const showAllPurchases = ref(false)

const largestPurchases = computed(() =>
  currentTransactions.value
    .filter((t) => Number(t.TRNAMT) < 0)
    .map((t) => {
      const s = String(t.DTPOSTED || '')
      const d = new Date(
        parseInt(s.slice(0, 4)),
        parseInt(s.slice(4, 6)) - 1,
        parseInt(s.slice(6, 8))
      )
      return {
        FITID: t.FITID,
        name: t.NAME || t.MEMO || 'Unknown',
        amount: Math.abs(Number(t.TRNAMT)),
        dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
    })
    .sort((a, b) => b.amount - a.amount)
)

const topPurchase = computed(() => largestPurchases.value[0] ?? null)
const displayedPurchases = computed(() =>
  showAllPurchases.value ? largestPurchases.value : largestPurchases.value.slice(0, 3)
)

// ── Center plugin ─────────────────────────────────────────────────────────────
const centerPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    const { ctx } = chart
    const { width, height, top, left } = chart.chartArea
    const cx = left + width / 2
    const cy = top + height / 2

    ctx.save()

    ctx.font = '500 11px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('TOTAL SPEND', cx, cy - 20)

    const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
      totalActual.value || 0
    )
    ctx.font = 'bold 26px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.fillText(amount, cx, cy + 6)

    ctx.restore()
  }
}

// ── Doughnut data ─────────────────────────────────────────────────────────────
const doughnutData = computed(() => {
  const cats = allCombinedSorted.value.filter((c) => c.actual > 0)
  return {
    labels: cats.map((c) => c.name),
    datasets: [
      {
        data: cats.map((c) => c.actual),
        backgroundColor: cats.map((_, i) => chartColors[i % chartColors.length]),
        borderWidth: 2,
        borderColor: '#1e1e2e',
        hoverOffset: 10
      }
    ]
  }
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: true,
  cutout: '62%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}`
      }
    }
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)
}

function formatPercent(val, total) {
  if (!total) return '0%'
  return `${((val / total) * 100).toFixed(1)}%`
}

onMounted(async () => {
  await applyPeriod()
})

watch(period, async () => {
  await applyPeriod()
}, { deep: true })
</script>
