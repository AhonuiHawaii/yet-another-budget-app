<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center flex-wrap gap-3 mb-6">
      <v-chip v-if="netWorthHistory.length === 0" variant="outlined" size="small">
        No transaction history yet
      </v-chip>
    </div>

    <v-alert v-if="reportError" type="error" variant="flat" class="mb-4">
      {{ reportError }}
    </v-alert>

    <!-- Net Worth Trend Chart -->
    <v-card v-if="netWorthHistory.length > 0" rounded elevation="2" class="mb-6">
      <v-card-item class="pa-4 pb-0">
        <template #prepend>
          <v-icon color="primary" size="20" :opacity="0.7">mdi-chart-line</v-icon>
        </template>
        <v-card-title class="text-h6 font-weight-bold pl-2">
          Net Worth Trend
          <v-chip size="small" variant="flat" color="primary" class="ml-2">All time</v-chip>
        </v-card-title>
      </v-card-item>
      <div class="pa-4 pt-2" style="height: 340px">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </v-card>

    <v-row class="mb-6">
      <v-col cols="12" sm="6" lg="3">
        <v-card class="h-100" rounded elevation="2">
          <v-card-text class="pa-4">
            <div class="d-flex align-start justify-space-between mb-3">
              <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis"
                >Net Worth</span
              >
              <v-icon :color="netWorth >= 0 ? 'success' : 'error'" size="18" :opacity="0.4"
                >mdi-scale-balance</v-icon
              >
            </div>
            <div
              class="text-h5 font-weight-black"
              :class="netWorth >= 0 ? 'text-success' : 'text-error'"
            >
              {{ formatCurrency(netWorth) }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">Assets minus liabilities</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="h-100" rounded elevation="2">
          <v-card-text class="pa-4">
            <div class="d-flex align-start justify-space-between mb-3">
              <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis"
                >Total Assets</span
              >
              <v-icon color="success" size="18" :opacity="0.4">mdi-bank-outline</v-icon>
            </div>
            <div class="text-h5 font-weight-black text-success">
              {{ formatCurrency(totalAssets) }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ assetRows.length }} {{ assetRows.length === 1 ? 'account' : 'accounts' }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="h-100" rounded elevation="2">
          <v-card-text class="pa-4">
            <div class="d-flex align-start justify-space-between mb-3">
              <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis"
                >Total Liabilities</span
              >
              <v-icon color="error" size="18" :opacity="0.4">mdi-credit-card-outline</v-icon>
            </div>
            <div class="text-h5 font-weight-black text-error">
              {{ formatCurrency(totalLiabilities) }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ liabilityRows.length }} {{ liabilityRows.length === 1 ? 'account' : 'accounts' }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="h-100" rounded elevation="2">
          <v-card-text class="pa-4">
            <div class="d-flex align-start justify-space-between mb-3">
              <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis"
                >Monthly Change</span
              >
              <v-icon
                :color="monthlyChange >= 0 ? 'success' : 'error'"
                size="18"
                :opacity="0.4"
                >{{ monthlyChange >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}</v-icon
              >
            </div>
            <div
              class="text-h5 font-weight-black"
              :class="monthlyChange >= 0 ? 'text-success' : 'text-error'"
            >
              {{ monthlyChange >= 0 ? '+' : '' }}{{ formatCurrency(monthlyChange) }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">vs. previous month</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="6">
        <v-card rounded elevation="2" class="h-100">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="success" size="20" :opacity="0.7">mdi-bank-outline</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">Assets</v-card-title>
          </v-card-item>
          <v-table density="comfortable" class="mt-2">
            <thead>
              <tr>
                <th class="text-start text-caption text-medium-emphasis pl-5">Account</th>
                <th class="text-center text-caption text-medium-emphasis">Type</th>
                <th class="text-center text-caption text-medium-emphasis pr-5">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="assetRows.length === 0">
                <td colspan="3" class="text-center py-8 text-medium-emphasis">
                  No asset accounts yet.
                </td>
              </tr>
              <tr v-for="account in assetRows" :key="account.ACCTID">
                <td class="pl-5 text-body-2 font-weight-medium">
                  {{ account.displayName || account.ORG || `*${account.ACCTID}` }}
                </td>
                <td class="text-center">
                  <v-chip color="success" variant="flat" size="small" rounded>
                    {{ account.ACCTTYPE || '—' }}
                  </v-chip>
                </td>
                <td class="text-center text-body-2 font-weight-bold pr-5 text-success">
                  {{ formatCurrency(account.balance) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6">
        <v-card rounded elevation="2" class="h-100">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="error" size="20" :opacity="0.7">mdi-credit-card-outline</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">Liabilities</v-card-title>
          </v-card-item>
          <v-table density="comfortable" class="mt-2">
            <thead>
              <tr>
                <th class="text-start text-caption text-medium-emphasis pl-5">Account</th>
                <th class="text-center text-caption text-medium-emphasis">Type</th>
                <th class="text-center text-caption text-medium-emphasis pr-5">Owed</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="liabilityRows.length === 0">
                <td colspan="3" class="text-center py-8 text-medium-emphasis">
                  No liabilities. Nicely done.
                </td>
              </tr>
              <tr v-for="account in liabilityRows" :key="account.ACCTID">
                <td class="pl-5 text-body-2 font-weight-medium">
                  {{ account.displayName || account.ORG || `*${account.ACCTID}` }}
                </td>
                <td class="text-center">
                  <v-chip color="error" variant="flat" size="small" rounded>
                    {{ account.ACCTTYPE || '—' }}
                  </v-chip>
                </td>
                <td class="text-center text-body-2 font-weight-bold pr-5 text-error">
                  {{ formatCurrency(account.balance) }}
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
import { useUserTransactionsStore } from '../stores/userTransactions'

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

const accountsStore = useUserAccountsStore()
const transactionsStore = useUserTransactionsStore()

const reportError = ref(null)

const ASSET_TYPES = new Set(['Checking', 'Savings', 'Money Market'])

const netWorthHistory = computed(() => transactionsStore.netWorthHistory)

const latest = computed(() => netWorthHistory.value[netWorthHistory.value.length - 1] || null)
const previous = computed(
  () => netWorthHistory.value[netWorthHistory.value.length - 2] || null
)

const netWorth = computed(() => latest.value?.netWorth ?? 0)
const monthlyChange = computed(() => {
  if (!latest.value || !previous.value) return 0
  return latest.value.netWorth - previous.value.netWorth
})

const accountBalances = computed(() => {
  const balanceById = new Map(
    transactionsStore.accountSummary.map((s) => [s.ACCTID, Number(s.total) || 0])
  )
  return accountsStore.accounts.map((account) => {
    const raw = balanceById.get(account.ACCTID) || 0
    const isAsset = ASSET_TYPES.has(account.ACCTTYPE)
    return {
      ...account,
      isAsset,
      balance: isAsset ? raw : -raw
    }
  })
})

const assetRows = computed(() =>
  accountBalances.value
    .filter((a) => a.isAsset)
    .sort((a, b) => b.balance - a.balance)
)

const liabilityRows = computed(() =>
  accountBalances.value
    .filter((a) => !a.isAsset)
    .sort((a, b) => b.balance - a.balance)
)

const totalAssets = computed(() => assetRows.value.reduce((sum, a) => sum + a.balance, 0))
const totalLiabilities = computed(() =>
  liabilityRows.value.reduce((sum, a) => sum + a.balance, 0)
)

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)
}

const chartData = computed(() => {
  const rows = netWorthHistory.value
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
      transactionsStore.fetchNetWorthHistory(),
      transactionsStore.fetchAccountSummary(),
      accountsStore.fetchAccounts()
    ])
  } catch (err) {
    reportError.value = err?.message ?? String(err)
  }
}

onMounted(async () => {
  await loadReport()
})
</script>
