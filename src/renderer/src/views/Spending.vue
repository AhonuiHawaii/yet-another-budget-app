<template>
  <v-container fluid class="pa-6">
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
import { useUserSettingsStore } from '../stores/userSettings'
import { useUserTransactionsStore } from '../stores/userTransactions'

ChartJS.register(ArcElement, Tooltip)

const categoriesStore = useUserCategoriesStore()
const budgetsStore = useUserBudgetsStore()
const settingsStore = useUserSettingsStore()
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
const periodBounds = computed(() => {
  const y = parseInt(settingsStore.selectedMonth.slice(0, 4))
  const m = parseInt(settingsStore.selectedMonth.slice(4, 6)) - 1
  return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0, 23, 59, 59, 999) }
})

async function applyPeriod() {
  await transactionsStore.fetchTransactionsByMonth(settingsStore.selectedMonth)
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
    projected: budgetsStore.getEffectiveBudget(cat.id, settingsStore.selectedMonth),
    actual: actuals.get(cat.name) || 0
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

watch(
  () => settingsStore.selectedMonth,
  async () => {
    await applyPeriod()
  }
)
</script>
