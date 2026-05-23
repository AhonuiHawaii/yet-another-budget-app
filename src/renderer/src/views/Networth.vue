<template>
  <v-container fluid class="pa-4">
    <v-alert v-if="reportError" type="error" variant="flat" class="mb-4">
      {{ reportError }}
    </v-alert>

    <v-row class="mb-6">
      <!-- Net Worth Trend Chart -->
      <v-col cols="12" lg="8">
        <v-card rounded="sm" elevation="2" class="h-100">
          <v-card-text class="pa-6 pb-4">
            <div class="text-caption text-medium-emphasis font-weight-medium mb-1">
              Total net worth
            </div>
            <div class="text-h4 font-weight-black mb-1">{{ formatCurrency(netWorth) }}</div>
            <div v-if="netWorthHistory.length >= 2" class="d-flex align-center ga-1 mb-4">
              <v-icon :color="sixMonthChange >= 0 ? 'success' : 'error'" size="16">
                {{ sixMonthChange >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
              <span
                class="text-body-2"
                :class="sixMonthChange >= 0 ? 'text-success' : 'text-error'"
              >
                {{ sixMonthChange >= 0 ? 'Up ' : 'Down '
                }}{{ formatCurrency(Math.abs(sixMonthChange)) }} over the last 6 months
              </span>
            </div>
            <div v-else class="mb-4" />

            <div style="height: 220px">
              <Line
                v-if="filteredChartData.labels.length > 0"
                :data="filteredChartData"
                :options="chartOptions"
              />
              <div
                v-else
                class="d-flex align-center justify-center h-100 text-medium-emphasis text-body-2"
              >
                No history yet
              </div>
            </div>

            <div class="d-flex justify-center ga-1 mt-4">
              <v-btn
                v-for="range in timeRanges"
                :key="range"
                :variant="selectedRange === range ? 'flat' : 'text'"
                size="small"
                rounded="xl"
                density="compact"
                class="px-3"
                @click="selectedRange = range"
              >
                {{ range }}
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Summary card -->
      <v-col cols="12" lg="4">
        <v-card rounded="sm" elevation="2" class="h-100">
          <v-card-text class="pa-6">
            <p class="text-body-2 text-medium-emphasis mb-5" style="line-height: 1.6">
              This is how your net worth is calculated. Make sure all of your accounts are connected
              for an accurate summary.
            </p>

            <!-- Assets -->
            <div class="d-flex align-center py-3">
              <v-avatar size="32" color="success" variant="tonal" class="mr-3 flex-shrink-0">
                <v-icon size="16">mdi-plus</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-body-2 font-weight-semibold">Assets</div>
                <div class="text-caption text-medium-emphasis">
                  {{ assetRows.length }} account{{ assetRows.length !== 1 ? 's' : '' }}
                </div>
              </div>
              <span class="text-body-2 font-weight-bold text-success text-no-wrap">
                {{ formatCurrency(totalAssets) }}
              </span>
            </div>
            <v-divider />

            <!-- Debts -->
            <div class="d-flex align-center py-3">
              <v-avatar size="32" color="warning" variant="tonal" class="mr-3 flex-shrink-0">
                <v-icon size="16">mdi-minus</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-body-2 font-weight-semibold">Debts</div>
                <div class="text-caption text-medium-emphasis">
                  {{ liabilityRows.length }} account{{ liabilityRows.length !== 1 ? 's' : '' }}
                </div>
              </div>
              <span class="text-body-2 font-weight-bold text-no-wrap">
                {{ formatCurrency(totalLiabilities) }}
              </span>
            </div>
            <v-divider />

            <!-- Net Worth -->
            <div class="d-flex align-center py-3">
              <v-avatar size="32" variant="outlined" class="mr-3 flex-shrink-0">
                <v-icon size="16">mdi-equal</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-body-2 font-weight-semibold">Net Worth</div>
                <div class="text-caption text-medium-emphasis">Assets - Debts</div>
              </div>
              <span
                class="text-body-2 font-weight-bold text-no-wrap"
                :class="netWorth >= 0 ? 'text-success' : 'text-error'"
              >
                {{ formatCurrency(netWorth) }}
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Assets by category -->
    <v-card rounded="sm" elevation="2">
      <v-card-item class="pa-4 pb-0">
        <template #prepend>
          <v-icon color="success" size="20" :opacity="0.7">mdi-bank-outline</v-icon>
        </template>
        <v-card-title class="text-h6 font-weight-bold pl-2">Assets</v-card-title>
      </v-card-item>

      <v-expansion-panels v-model="openPanels" multiple flat class="mt-2">
        <v-expansion-panel
          v-for="category in assetCategories"
          :key="category.name"
          :value="category.name"
        >
          <v-expansion-panel-title>
            <div class="d-flex align-center w-100 ga-4">
              <span class="text-body-2 font-weight-medium flex-grow-1">{{ category.name }}</span>
              <span class="text-body-2 text-medium-emphasis text-right" style="min-width: 110px"
                >{{ category.percentage }}% of assets</span
              >
              <span class="text-body-2 font-weight-bold text-right" style="min-width: 90px">{{
                formatCurrency(category.total)
              }}</span>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <v-card variant="flat" rounded="sm" class="mx-2 mb-2">
              <div
                class="d-flex align-center justify-space-between px-4 py-2 text-caption text-medium-emphasis"
              >
                <span
                  >{{ category.accounts.length }} Account{{
                    category.accounts.length !== 1 ? 's' : ''
                  }}</span
                >
                <span>Balance</span>
              </div>
              <template v-for="account in category.accounts" :key="account.ACCTID">
                <v-divider />
                <div class="d-flex align-center px-4 py-3 ga-3">
                  <v-avatar size="36" :color="accountTypeColor(account.ACCTTYPE)" variant="tonal">
                    <v-icon :icon="accountTypeIcon(account.ACCTTYPE)" size="18" />
                  </v-avatar>
                  <div class="flex-grow-1">
                    <div class="text-body-2 font-weight-medium">
                      {{ account.displayName || account.ACCTTYPE || 'Account' }}
                    </div>
                    <div v-if="account.ORG" class="text-caption text-medium-emphasis">
                      {{ account.ORG }}
                    </div>
                  </div>
                  <span class="text-body-2 font-weight-bold">{{
                    formatCurrency(account.balance)
                  }}</span>
                </div>
              </template>
            </v-card>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card>

    <!-- Debts by category -->
    <v-card rounded="sm" elevation="2" class="mt-6">
      <v-card-item class="pa-4 pb-0">
        <template #prepend>
          <v-icon color="error" size="20" :opacity="0.7">mdi-credit-card-outline</v-icon>
        </template>
        <v-card-title class="text-h6 font-weight-bold pl-2">Debts</v-card-title>
      </v-card-item>

      <div
        v-if="debtCategories.length === 0"
        class="pa-6 text-center text-medium-emphasis text-body-2"
      >
        No debts. Nicely done.
      </div>

      <v-expansion-panels v-model="openDebtPanels" multiple flat class="mt-2">
        <v-expansion-panel
          v-for="category in debtCategories"
          :key="category.name"
          :value="category.name"
        >
          <v-expansion-panel-title>
            <div class="d-flex align-center w-100 ga-4">
              <span class="text-body-2 font-weight-medium flex-grow-1">{{ category.name }}</span>
              <span class="text-body-2 text-medium-emphasis text-right" style="min-width: 110px"
                >{{ category.percentage }}% of debts</span
              >
              <span
                class="text-body-2 font-weight-bold text-error text-right"
                style="min-width: 90px"
                >{{ formatCurrency(category.total) }}</span
              >
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <v-card variant="flat" rounded="sm" class="mx-2 mb-2">
              <div
                class="d-flex align-center justify-space-between px-4 py-2 text-caption text-medium-emphasis"
              >
                <span
                  >{{ category.accounts.length }} Account{{
                    category.accounts.length !== 1 ? 's' : ''
                  }}</span
                >
                <span>Balance Owed</span>
              </div>
              <template v-for="account in category.accounts" :key="account.ACCTID">
                <v-divider />
                <div class="d-flex align-center px-4 py-3 ga-3">
                  <v-avatar size="36" :color="accountTypeColor(account.ACCTTYPE)" variant="tonal">
                    <v-icon :icon="accountTypeIcon(account.ACCTTYPE)" size="18" />
                  </v-avatar>
                  <div class="flex-grow-1">
                    <div class="text-body-2 font-weight-medium">
                      {{ account.displayName || account.ACCTTYPE || 'Account' }}
                    </div>
                    <div v-if="account.ORG" class="text-caption text-medium-emphasis">
                      {{ account.ORG }}
                    </div>
                  </div>
                  <span class="text-body-2 font-weight-bold text-error">{{
                    formatCurrency(account.balance)
                  }}</span>
                </div>
              </template>
            </v-card>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import {
  useUserAccountsStore,
  accountTypeColor,
  accountTypeIcon,
  formatCurrency,
  resolveIsAsset,
  CATEGORY_MAP,
  CATEGORY_ORDER,
  ALWAYS_SHOW_CATEGORIES
} from '../stores/userAccounts'
import { useUserTransactionsStore } from '../stores/userTransactions'
import { useUserDebtsStore } from '../stores/userDebts'

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const accountsStore = useUserAccountsStore()
const transactionsStore = useUserTransactionsStore()
const debtsStore = useUserDebtsStore()

const reportError = ref(null)
const openPanels = ref([])
const openDebtPanels = ref([])
const selectedRange = ref('6M')
const timeRanges = ['1M', '3M', '6M', '1Y', 'ALL']

const ALWAYS_SHOW = ALWAYS_SHOW_CATEGORIES

const netWorthHistory = computed(() => transactionsStore.netWorthHistory)
const latest = computed(() => netWorthHistory.value[netWorthHistory.value.length - 1] || null)
const previous = computed(() => netWorthHistory.value[netWorthHistory.value.length - 2] || null)

const netWorth = computed(() => latest.value?.netWorth ?? 0)
const monthlyChange = computed(() => {
  if (!latest.value || !previous.value) return 0
  return latest.value.netWorth - previous.value.netWorth
})

const sixMonthChange = computed(() => {
  const rows = netWorthHistory.value
  if (rows.length < 2) return 0
  const from = rows.length >= 7 ? rows[rows.length - 7] : rows[0]
  return rows[rows.length - 1].netWorth - from.netWorth
})

const filteredChartData = computed(() => {
  const all = netWorthHistory.value
  const count = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 }[selectedRange.value]
  const rows = count ? all.slice(-count) : all
  return {
    labels: rows.map((r) => {
      const y = r.month.slice(0, 4)
      const m = parseInt(r.month.slice(4, 6)) - 1
      return new Date(y, m, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }),
    datasets: [
      {
        label: 'Net Worth',
        data: rows.map((r) => r.netWorth),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25,118,210,0.12)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2.5
      },
      {
        label: 'Assets',
        data: rows.map((r) => r.assets),
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76,175,80,0.04)',
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderDash: [4, 4]
      },
      {
        label: 'Liabilities',
        data: rows.map((r) => r.liabilities),
        borderColor: '#f44336',
        backgroundColor: 'rgba(244,67,54,0.04)',
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderDash: [4, 4]
      }
    ]
  }
})

const accountBalances = computed(() => {
  const balanceById = new Map(
    transactionsStore.accountSummary.map((s) => [s.ACCTID, Number(s.total) || 0])
  )
  return accountsStore.accounts.map((account) => {
    const txTotal = balanceById.get(account.ACCTID) || 0
    const starting = Number(account.startingBalance) || 0
    const raw = starting + txTotal
    const isAsset = resolveIsAsset(account) // honours accountCategory override
    return { ...account, isAsset, balance: isAsset ? raw : -raw }
  })
})

const assetRows = computed(() =>
  accountBalances.value.filter((a) => a.isAsset).sort((a, b) => b.balance - a.balance)
)

const liabilityRows = computed(() =>
  accountBalances.value.filter((a) => !a.isAsset).sort((a, b) => b.balance - a.balance)
)

const totalAssets = computed(() => assetRows.value.reduce((sum, a) => sum + a.balance, 0))
const totalLiabilities = computed(() => liabilityRows.value.reduce((sum, a) => sum + a.balance, 0))

const debtCategories = computed(() => {
  const detailMap = new Map(debtsStore.details.map((d) => [d.id, d]))
  const grouped = {}
  for (const account of liabilityRows.value) {
    const type = account.ACCTTYPE || 'Other'
    if (!grouped[type]) grouped[type] = []
    const detail = detailMap.get(account.ACCTID)
    grouped[type].push({
      ...account,
      balance: detail?.currentBalance > 0 ? detail.currentBalance : account.balance
    })
  }
  const total = totalLiabilities.value || 1
  return Object.entries(grouped)
    .map(([name, accounts]) => {
      const catTotal = accounts.reduce((s, a) => s + a.balance, 0)
      return { name, accounts, total: catTotal, percentage: Math.round((catTotal / total) * 100) }
    })
    .sort((a, b) => b.total - a.total)
})

const assetCategories = computed(() => {
  const grouped = Object.fromEntries(CATEGORY_ORDER.map((n) => [n, []]))
  for (const account of assetRows.value) {
    const cat = CATEGORY_MAP[account.ACCTTYPE] || 'Other Assets'
    grouped[cat].push(account)
  }
  const total = totalAssets.value || 1
  return CATEGORY_ORDER.map((name) => {
    const accounts = grouped[name]
    const catTotal = accounts.reduce((s, a) => s + a.balance, 0)
    return { name, accounts, total: catTotal, percentage: Math.round((catTotal / total) * 100) }
  }).filter((c) => c.accounts.length > 0 || ALWAYS_SHOW.has(c.name))
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'top', labels: { usePointStyle: true, padding: 16 } },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`
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
      transactionsStore.fetchNetWorthHistory(),
      transactionsStore.fetchAccountSummary(),
      accountsStore.fetchAccounts(),
      debtsStore.fetchDebtDetails()
    ])
  } catch (err) {
    reportError.value = err?.message ?? String(err)
  }
}

onMounted(async () => {
  await loadReport()
})
</script>
