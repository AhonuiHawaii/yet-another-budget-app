<template>
  <v-container fluid class="pa-6">
    <div class="d-flex justify-center align-center mb-6">
      <v-btn variant="tonal" density="comfortable" rounded="lg" @click="prevMonth">
        <v-icon start size="16">mdi-chevron-left</v-icon>
        {{ prevMonthLabel }}
      </v-btn>
      <span class="text-subtitle-1 font-weight-bold mx-6">{{ monthLabel(selectedMonth) }}</span>
      <v-btn variant="tonal" density="comfortable" rounded="lg" :disabled="isNextMonthFuture" @click="nextMonth">
        {{ nextMonthLabel }}
        <v-icon end size="16">mdi-chevron-right</v-icon>
      </v-btn>
    </div>

    <v-sheet rounded elevation="2" class="pa-0">
      <v-tabs v-model="activeTab" bg-color="surface-bright" color="on-surface" class="mb-4" grow>
        <v-tab value="all">All Recurring</v-tab>
        <v-tab value="calendar">Calendar</v-tab>
      </v-tabs>

      <v-tabs-window v-model="activeTab">
        <!-- All Recurring Tab -->
        <v-tabs-window-item value="all">
          <div v-if="recurringLoading" class="d-flex justify-center pa-12">
            <v-progress-circular indeterminate color="primary" />
          </div>

          <v-card v-else-if="!recurringGroups.length" rounded elevation="2">
            <v-card-text class="d-flex flex-column align-center text-medium-emphasis pa-12">
              <v-icon size="48" class="mb-4" style="opacity: 0.3" icon="mdi-calendar-sync" />
              <div class="text-body-1">No recurring transactions detected yet.</div>
              <div class="text-caption mt-1">
                Import more months of history to improve detection.
              </div>
              <v-btn
                class="mt-4"
                size="small"
                variant="tonal"
                prepend-icon="mdi-refresh"
                rounded="sm"
                :loading="recurringLoading"
                @click="rescan"
                >Rescan</v-btn
              >
            </v-card-text>
          </v-card>

          <template v-else>
            <div class="d-flex align-center mb-4">
              <span class="text-body-2 text-medium-emphasis">
                {{ recurringGroups.length }} recurring merchants detected
              </span>
              <v-spacer />
              <v-btn
                size="small"
                variant="tonal"
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
                rounded="lg"
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

                    <!-- Menu -->
                    <v-menu>
                      <template #activator="{ props: menuProps }">
                        <v-btn
                          v-bind="menuProps"
                          icon="mdi-dots-vertical"
                          variant="text"
                          density="compact"
                          size="small"
                          class="ml-1"
                        />
                      </template>
                      <v-list density="compact">
                        <v-list-item
                          title="Mark as not recurring"
                          prepend-icon="mdi-close-circle-outline"
                        />
                      </v-list>
                    </v-menu>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </template>
        </v-tabs-window-item>

        <!-- Calendar Tab -->
        <v-tabs-window-item value="calendar">
          <!-- Navigation -->
          <div class="d-flex align-center gap-3 mb-6">
            <v-btn
              icon="mdi-chevron-left"
              variant="text"
              density="comfortable"
              @click="prevMonth"
            />
            <span class="text-h6 font-weight-bold calendar-title">{{ monthTitle }}</span>
            <v-btn
              icon="mdi-chevron-right"
              variant="text"
              density="comfortable"
              @click="nextMonth"
            />
            <v-btn size="small" variant="tonal" rounded="sm" @click="goToday">Today</v-btn>
            <v-spacer />
            <!-- Legend -->
            <div class="d-flex align-center gap-3">
              <v-chip color="warning" variant="flat" size="small" prepend-icon="mdi-calendar-month"
                >Bill</v-chip
              >
              <v-chip
                color="error"
                variant="flat"
                size="small"
                prepend-icon="mdi-credit-card-outline"
                >Debt</v-chip
              >
              <v-chip color="primary" variant="flat" size="small" prepend-icon="mdi-refresh"
                >Recurring</v-chip
              >
            </div>
          </div>

          <!-- Day-of-week headers -->
          <div class="cal-grid mb-1">
            <div
              v-for="d in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']"
              :key="d"
              class="text-caption text-center text-uppercase font-weight-bold text-medium-emphasis py-2"
            >
              {{ d }}
            </div>
          </div>

          <!-- Calendar cells -->
          <div class="cal-grid">
            <div
              v-for="day in calendarDays"
              :key="day.key"
              class="cal-cell"
              :class="{
                'cal-cell--other': !day.currentMonth,
                'cal-cell--today': day.isToday
              }"
            >
              <div
                class="cal-day-num text-caption font-weight-bold mb-1"
                :class="day.isToday ? 'text-primary' : 'text-medium-emphasis'"
              >
                <span v-if="day.isToday">
                  <v-avatar color="primary" size="20" class="text-caption font-weight-bold">
                    {{ day.date.getDate() }}
                  </v-avatar>
                </span>
                <span v-else>{{ day.date.getDate() }}</span>
              </div>

              <template v-if="day.currentMonth">
                <v-chip
                  v-for="evt in eventsByDay.get(day.key) || []"
                  :key="evt.id"
                  :color="evt.color"
                  size="x-small"
                  variant="flat"
                  class="cal-chip mb-1 cursor-pointer"
                  @click.stop="openEvent(evt)"
                >
                  <span class="cal-chip-label">{{ evt.name }}</span>
                </v-chip>
              </template>
            </div>
          </div>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-sheet>

    <!-- Event Detail Dialog -->
    <v-dialog v-model="dialogOpen" max-width="420">
      <v-card v-if="selectedEvent" rounded="sm">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-3">
              <v-icon :color="selectedEvent.color" size="20">
                {{
                  selectedEvent.eventType === 'bill'
                    ? 'mdi-calendar-month'
                    : selectedEvent.eventType === 'debt'
                      ? 'mdi-credit-card-outline'
                      : 'mdi-refresh'
                }}
              </v-icon>
              <span class="text-h6 font-weight-bold">{{ selectedEvent.name }}</span>
            </div>
            <v-btn icon="mdi-close" variant="text" density="compact" @click="dialogOpen = false" />
          </div>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis">
              {{
                selectedEvent.eventType === 'bill'
                  ? 'Budgeted Amount'
                  : selectedEvent.eventType === 'debt'
                    ? 'Min. Payment'
                    : 'Typical Amount'
              }}
            </div>
            <div class="text-h6 font-weight-bold" :class="`text-${selectedEvent.color}`">
              {{ formatCurrency(selectedEvent.amount) }}
            </div>
          </div>

          <v-divider class="mb-3" />

          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-body-2 font-weight-medium">Due</span>
            <span class="text-body-2 text-medium-emphasis">{{ selectedEvent.dueLabel }}</span>
          </div>

          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-body-2 font-weight-medium">Type</span>
            <span class="text-body-2 text-medium-emphasis">{{ selectedEvent.typeLabel }}</span>
          </div>

          <template v-if="selectedEvent.eventType === 'debt'">
            <div
              v-if="selectedEvent.interestRate"
              class="d-flex align-center justify-space-between mb-2"
            >
              <span class="text-body-2 font-weight-medium">Interest Rate</span>
              <span class="text-body-2 text-medium-emphasis"
                >{{ selectedEvent.interestRate }}%</span
              >
            </div>
            <div
              v-if="selectedEvent.currentBalance"
              class="d-flex align-center justify-space-between mb-2"
            >
              <span class="text-body-2 font-weight-medium">Current Balance</span>
              <span class="text-body-2 text-medium-emphasis">
                {{ formatCurrency(selectedEvent.currentBalance) }}
              </span>
            </div>
            <div
              v-if="selectedEvent.paymentFrequency"
              class="d-flex align-center justify-space-between mb-2"
            >
              <span class="text-body-2 font-weight-medium">Frequency</span>
              <span class="text-body-2 text-medium-emphasis">
                {{
                  selectedEvent.paymentFrequency === 'BiWeekly'
                    ? 'Bi-Weekly'
                    : selectedEvent.paymentFrequency
                }}
                <span v-if="selectedEvent.paymentCount">
                  · {{ selectedEvent.paymentCount }} payments</span
                >
              </span>
            </div>
            <div v-if="selectedEvent.institution" class="d-flex align-center justify-space-between">
              <span class="text-body-2 font-weight-medium">Lender</span>
              <span class="text-body-2 text-medium-emphasis">{{ selectedEvent.institution }}</span>
            </div>
          </template>

          <template v-if="selectedEvent.eventType === 'recurring'">
            <div
              v-if="selectedEvent.category"
              class="d-flex align-center justify-space-between mb-2"
            >
              <span class="text-body-2 font-weight-medium">Category</span>
              <span class="text-body-2 text-medium-emphasis">{{ selectedEvent.category }}</span>
            </div>
            <div
              v-if="selectedEvent.account"
              class="d-flex align-center justify-space-between mb-2"
            >
              <span class="text-body-2 font-weight-medium">Account</span>
              <span class="text-body-2 text-medium-emphasis">
                {{ selectedEvent.account }}
                <span v-if="selectedEvent.lastFour">(••••{{ selectedEvent.lastFour }})</span>
              </span>
            </div>
          </template>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="tonal" rounded="sm" @click="dialogOpen = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserCategoriesStore } from '../stores/userCategories'
import { useUserAccountsStore } from '../stores/userAccounts'
import { useUserBudgetsStore } from '../stores/userBudgets'
import { useUserDebtsStore } from '../stores/userDebts'
import { useUserTransactionsStore } from '../stores/userTransactions'

const categoriesStore = useUserCategoriesStore()
const accountsStore = useUserAccountsStore()
const budgetsStore = useUserBudgetsStore()
const debtsStore = useUserDebtsStore()
const transactionsStore = useUserTransactionsStore()

// ── Navigation ────────────────────────────────────────────────────────────────

const today = new Date()

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
const viewYear = computed(() => Number(selectedMonth.value.slice(0, 4)))
const viewMonth = computed(() => Number(selectedMonth.value.slice(4, 6)) - 1) // 0-indexed
const prevMonthLabel = computed(() => shortMonthLabel(offsetMonth(selectedMonth.value, -1)))
const nextMonthLabel = computed(() => shortMonthLabel(offsetMonth(selectedMonth.value, 1)))
const isNextMonthFuture = computed(() => offsetMonth(selectedMonth.value, 1) > currentMonthValue())

const monthTitle = computed(() => monthLabel(selectedMonth.value))

function prevMonth() { selectedMonth.value = offsetMonth(selectedMonth.value, -1) }
function nextMonth() { selectedMonth.value = offsetMonth(selectedMonth.value, 1) }
function goToday() { selectedMonth.value = currentMonthValue() }

// ── Calendar Grid ─────────────────────────────────────────────────────────────

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const calendarDays = computed(() => {
  const y = viewYear.value
  const m = viewMonth.value
  const firstDow = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const daysInPrevMonth = new Date(y, m, 0).getDate()
  const todayKey = dateKey(today)
  const days = []

  for (let i = firstDow - 1; i >= 0; i--) {
    const date = new Date(y, m - 1, daysInPrevMonth - i)
    days.push({ date, key: dateKey(date), currentMonth: false, isToday: false })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(y, m, d)
    const key = dateKey(date)
    days.push({ date, key, currentMonth: true, isToday: key === todayKey })
  }

  const trailing = 42 - days.length
  for (let d = 1; d <= trailing; d++) {
    const date = new Date(y, m + 1, d)
    days.push({ date, key: dateKey(date), currentMonth: false, isToday: false })
  }

  return days
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(val || 0)
}

// Bills store dueDate as full ISO "YYYY-MM-DD" or a plain day number.
// In both cases we only need the day-of-month for recurring monthly display.
function extractDayOfMonth(dueDate) {
  if (!dueDate) return null
  const s = String(dueDate)
  if (s.includes('-')) {
    const d = parseInt(s.split('-')[2], 10)
    return isNaN(d) ? null : d
  }
  const d = parseInt(s, 10)
  return isNaN(d) ? null : d
}

// An account contributes to the calendar if it has either a fixed monthly
// dueDate or a weekly/biweekly payment schedule. ACCTTYPE is intentionally
// not used as a gate — if the user set a due date, we display it.
function hasDueDateData(account) {
  if (account?.dueDate) return true
  const freq = account?.paymentFrequency
  if ((freq === 'Weekly' || freq === 'BiWeekly') && account?.paymentStartDate) return true
  return false
}

// ── Event Generation ──────────────────────────────────────────────────────────

const eventsByDay = computed(() => {
  const y = viewYear.value
  const m = viewMonth.value
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const monthStr = `${y}${String(m + 1).padStart(2, '0')}`
  const map = new Map()

  function addEvent(day, evt) {
    if (day < 1 || day > daysInMonth) return
    const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(evt)
  }

  // ── Bills ────────────────────────────────────────────────────────────────
  for (const cat of categoriesStore.getCategoriesByType('bills')) {
    const day = extractDayOfMonth(cat.dueDate)
    if (!day) continue
    const amount = budgetsStore.getEffectiveBudget(cat.id, monthStr)
    addEvent(day, {
      id: `bill-${cat.id}`,
      name: cat.name,
      eventType: 'bill',
      color: 'warning',
      amount,
      dueLabel: `${new Date(y, m, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      typeLabel: 'Bill / Expense'
    })
  }

  // ── Account due dates ────────────────────────────────────────────────────
  for (const acc of accountsStore.accounts.filter(hasDueDateData)) {
    const details = debtsStore.getDetail(acc.ACCTID)
    const title = acc.displayName || acc.ORG || `*${acc.ACCTID}`
    const amount = Number(details.minimumPayment) || 0
    const interestRate = acc.interestRate || details.interestRate || 0
    const currentBalance = details.currentBalance || 0

    function makeDebtEvent(day) {
      return {
        id: `debt-${acc.ACCTID}-${day}`,
        name: title,
        eventType: 'debt',
        color: 'error',
        amount,
        dueLabel: `${new Date(y, m, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        typeLabel: `Debt · ${acc.ACCTTYPE || 'Loan'}`,
        interestRate: interestRate || null,
        currentBalance: currentBalance || null,
        institution: acc.ORG || null,
        paymentFrequency: acc.paymentFrequency || null,
        paymentCount: acc.paymentCount || null
      }
    }

    const freq = acc.paymentFrequency
    if ((freq === 'Weekly' || freq === 'BiWeekly') && acc.paymentStartDate) {
      const interval = freq === 'Weekly' ? 7 : 14
      const maxPayments = acc.paymentCount || 999
      const start = new Date(acc.paymentStartDate + 'T12:00:00')
      let cursor = new Date(start)
      let count = 0
      // Wind forward to first occurrence on or after the start of this month
      const monthStart = new Date(y, m, 1)
      while (cursor < monthStart && count < maxPayments) {
        cursor = new Date(cursor.getTime() + interval * 86400000)
        count++
      }
      // Emit events that fall within this month
      while (cursor.getMonth() === m && cursor.getFullYear() === y && count < maxPayments) {
        addEvent(cursor.getDate(), makeDebtEvent(cursor.getDate()))
        cursor = new Date(cursor.getTime() + interval * 86400000)
        count++
      }
    } else {
      // Monthly or no frequency — needs a specific due date
      const day = extractDayOfMonth(acc.dueDate)
      if (!day) continue
      addEvent(day, makeDebtEvent(day))
    }
  }

  // ── Recurring Transactions ───────────────────────────────────────────────
  for (const group of recurringGroups.value) {
    if (group.typicalDay) {
      addEvent(group.typicalDay, {
        id: `recurring-${group.name}`,
        name: group.name,
        eventType: 'recurring',
        color: 'primary',
        amount: group.typicalAmount,
        dueLabel: `${new Date(y, m, group.typicalDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        typeLabel: 'Recurring Transaction',
        category: group.category,
        account: group.account,
        lastFour: group.lastFour
      })
    }
  }

  return map
})

// ── All Recurring ─────────────────────────────────────────────────────────────

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

// ── Dialog ────────────────────────────────────────────────────────────────────

const activeTab = ref('all')

const dialogOpen = ref(false)
const selectedEvent = ref(null)

function openEvent(evt) {
  selectedEvent.value = evt
  dialogOpen.value = true
}

// ── Init ──────────────────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([
    categoriesStore.fetchCategories(),
    accountsStore.fetchAccounts(),
    budgetsStore.fetchBudgets(),
    debtsStore.fetchDebtDetails(),
    fetchRecurring()
  ])
})
</script>

<style scoped>
.calendar-title {
  min-width: 200px;
  text-align: center;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
}

.cal-cell {
  min-height: 110px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 6px;
  padding: 6px;
  overflow: hidden;
}

.cal-cell--other {
  opacity: 0.3;
}

.cal-cell--today {
  border-color: rgba(var(--v-theme-primary), 0.6);
  background: rgba(var(--v-theme-primary), 0.04);
}

.cal-day-num {
  line-height: 1;
  margin-bottom: 4px;
}

.cal-chip {
  display: flex;
  width: 100%;
  max-width: 100%;
}

.cal-chip-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

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
