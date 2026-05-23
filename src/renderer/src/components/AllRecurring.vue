<template>
  <v-container fluid class="pa-4">
    <v-sheet rounded="sm" elevation="2" class="pa-4">
      <div v-if="recurringLoading" class="d-flex justify-center pa-12">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <div
        v-else-if="!recurringGroups.length"
        class="d-flex flex-column align-center text-medium-emphasis pa-12"
      >
        <v-icon size="60" class="mb-4" style="opacity: 0.3" icon="mdi-calendar-sync" />
        <div class="text-body-1">No recurring transactions detected yet.</div>
        <div class="text-caption mt-1">Import more months of history to improve detection.</div>
        <v-btn
          class="mt-4"
          size="small"
          variant="flat"
          prepend-icon="mdi-refresh"
          rounded="sm"
          :loading="recurringLoading"
          @click="rescan"
          >Rescan</v-btn
        >
      </div>

      <template v-else>
        <div class="d-flex align-center mb-4">
          <span class="text-body-2 text-medium-emphasis">
            {{ recurringGroups.length }} recurring merchants detected
          </span>
          <v-spacer />
          <v-btn
            size="small"
            variant="flat"
            prepend-icon="mdi-refresh"
            rounded="sm"
            :loading="recurringLoading"
            @click="rescan"
            >Rescan</v-btn
          >
        </div>

        <!-- Column headers -->
        <div
          class="recurring-table-header text-caption text-uppercase font-weight-bold text-medium-emphasis px-4 mb-1"
        >
          <span>Name / Frequency</span>
          <span>Account</span>
          <span>Due</span>
          <span class="text-right">Amount</span>
        </div>

        <v-list class="pa-0">
          <v-list-item
            v-for="group in recurringGroups"
            :key="group.name"
            rounded="sm"
            class="mb-1 recurring-row px-4"
          >
            <!-- Avatar -->
            <template #prepend>
              <v-avatar color="primary" variant="tonal" size="36" rounded="sm" class="mr-3">
                <span class="text-caption font-weight-bold">{{ group.initials }}</span>
              </v-avatar>
            </template>

            <!-- Name + frequency -->
            <template #title>
              <span class="text-body-2 font-weight-medium">{{ group.name }}</span>
            </template>
            <template #subtitle>
              <span class="text-caption font-weight-medium text-success">{{
                group.frequency
              }}</span>
            </template>

            <template #append>
              <div class="recurring-row-append">
                <!-- Account -->
                <div class="recurring-col-account">
                  <span class="text-caption text-medium-emphasis">{{
                    group.lastFour ? `••••${group.lastFour}` : '—'
                  }}</span>
                </div>

                <!-- Due -->
                <div class="recurring-col-due">
                  <span
                    v-if="group.dueLabel"
                    class="text-caption font-weight-medium"
                    :class="group.dueUrgent ? 'text-warning' : 'text-medium-emphasis'"
                  >
                    {{ group.dueLabel }}
                  </span>
                  <span v-else class="text-caption text-medium-emphasis">—</span>
                </div>

                <!-- Amount -->
                <div class="recurring-col-amount text-right">
                  <span class="text-body-2 font-weight-bold">
                    {{ formatCurrency(group.typicalAmount) }}
                  </span>
                </div>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </template>
    </v-sheet>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserAccountsStore } from '../stores/userAccounts'

const accountsStore = useUserAccountsStore()

const recurringTransactions = ref([])
const recurringLoading = ref(false)

async function fetchRecurring() {
  recurringLoading.value = true
  const result = await window.electron.ipcRenderer.invoke('transactions:fetch', { recurring: 1 })
  if (result.success) recurringTransactions.value = result.data
  recurringLoading.value = false
}

async function rescan() {
  recurringLoading.value = true
  await window.electron.ipcRenderer.invoke('transactions:rescanRecurring')
  await fetchRecurring()
}

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(val || 0)
}

function median(arr) {
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

function dueLabelFromDays(days) {
  if (days === null) return null
  if (days === 0) return 'due today'
  if (days === 1) return 'tomorrow'
  if (days < 0) return `${Math.abs(days)}d overdue`
  return `in ${days} days`
}

const recurringGroups = computed(() => {
  const map = new Map()

  for (const tx of recurringTransactions.value) {
    const key = tx.NAME || 'Unknown'
    if (!map.has(key))
      map.set(key, {
        name: key,
        amounts: [],
        days: [],
        months: new Set(),
        categories: [],
        acctid: tx.ACCTID || null
      })
    const g = map.get(key)
    const amt = Math.abs(Number(tx.TRNAMT))
    if (amt > 0) g.amounts.push(amt)
    if (tx.DTPOSTED?.length >= 8) g.days.push(parseInt(tx.DTPOSTED.slice(6, 8), 10))
    if (tx.DTPOSTED?.length >= 6) g.months.add(tx.DTPOSTED.slice(0, 6))
    if (tx.category) g.categories.push(tx.category)
  }

  return [...map.values()]
    .map((g) => {
      const typicalAmount = median(g.amounts)
      const typicalDay = g.days.length ? median(g.days) : null
      const category = g.categories.length
        ? g.categories.sort(
            (a, b) =>
              g.categories.filter((c) => c === b).length -
              g.categories.filter((c) => c === a).length
          )[0]
        : null
      const initials = g.name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')

      const acct = accountsStore.accounts.find((a) => a.ACCTID === g.acctid)
      const account = acct?.displayName || acct?.ORG || null
      const lastFour = g.acctid ? g.acctid.slice(-4) : null

      const days = daysUntil(typicalDay)
      const dueLabel = dueLabelFromDays(days)
      const dueUrgent = days !== null && days <= 7

      return {
        name: g.name,
        typicalAmount,
        typicalDay,
        monthCount: g.months.size,
        frequency: 'Monthly',
        category,
        initials,
        account,
        lastFour,
        dueLabel,
        dueUrgent
      }
    })
    .sort((a, b) => (a.typicalDay ?? 99) - (b.typicalDay ?? 99))
})

onMounted(async () => {
  await Promise.all([accountsStore.fetchAccounts(), fetchRecurring()])
})
</script>

<style scoped>
.recurring-table-header {
  display: grid;
  grid-template-columns: 1fr 120px 120px 100px;
  align-items: center;
  gap: 8px;
}

.recurring-row :deep(.v-list-item__append) {
  width: calc(120px + 120px + 100px + 48px);
}

.recurring-row-append {
  display: grid;
  grid-template-columns: 120px 120px 100px 36px;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.recurring-col-account {
  display: flex;
  align-items: center;
}

.recurring-col-due {
  display: flex;
  align-items: center;
}

.recurring-col-amount {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
</style>
