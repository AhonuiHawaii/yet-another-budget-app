<template>
  <v-container fluid class="pa-6">
    <!-- Navigation -->
    <div class="d-flex align-center gap-3 mb-6">
      <v-btn icon="mdi-chevron-left" variant="text" density="comfortable" @click="prevMonth" />
      <span class="text-h6 font-weight-bold calendar-title">{{ monthTitle }}</span>
      <v-btn icon="mdi-chevron-right" variant="text" density="comfortable" @click="nextMonth" />
      <v-btn size="small" variant="tonal" rounded="sm" @click="goToday">Today</v-btn>
      <v-spacer />
      <!-- Legend -->
      <div class="d-flex align-center gap-3">
        <v-chip color="warning" variant="tonal" size="small" prepend-icon="mdi-calendar-month">Bill</v-chip>
        <v-chip color="error" variant="tonal" size="small" prepend-icon="mdi-credit-card-outline">Debt</v-chip>
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
          <div
            v-for="evt in eventsByDay.get(day.key) || []"
            :key="evt.id"
            class="cal-event mb-1 cursor-pointer"
            :class="`cal-event--${evt.color}`"
            @click.stop="openEvent(evt)"
          >
            {{ evt.name }}
          </div>
        </template>
      </div>
    </div>

    <!-- Event Detail Dialog -->
    <v-dialog v-model="dialogOpen" max-width="420">
      <v-card v-if="selectedEvent" rounded="sm">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-3">
              <v-icon :color="selectedEvent.color" size="20">
                {{ selectedEvent.eventType === 'bill' ? 'mdi-calendar-month' : 'mdi-credit-card-outline' }}
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
              {{ selectedEvent.eventType === 'bill' ? 'Budgeted Amount' : 'Min. Payment' }}
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
              <span class="text-body-2 text-medium-emphasis">{{ selectedEvent.interestRate }}%</span>
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
              v-if="selectedEvent.institution"
              class="d-flex align-center justify-space-between"
            >
              <span class="text-body-2 font-weight-medium">Lender</span>
              <span class="text-body-2 text-medium-emphasis">{{ selectedEvent.institution }}</span>
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
import { useUserSettingsStore } from '../stores/userSettings'

const categoriesStore = useUserCategoriesStore()
const accountsStore = useUserAccountsStore()
const budgetsStore = useUserBudgetsStore()
const debtsStore = useUserDebtsStore()
const settingsStore = useUserSettingsStore()

// ── Navigation ────────────────────────────────────────────────────────────────

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth()) // 0-indexed

const monthTitle = computed(() =>
  new Date(viewYear.value, viewMonth.value, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
)

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else {
    viewMonth.value--
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else {
    viewMonth.value++
  }
}

function goToday() {
  viewYear.value = today.getFullYear()
  viewMonth.value = today.getMonth()
}

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

function isDebtAccount(account) {
  const t = String(account?.ACCTTYPE || '').toLowerCase()
  return (
    t.includes('credit') ||
    t.includes('loan') ||
    t.includes('mortgage') ||
    t.includes('buy now pay later') ||
    t.includes('medical debt') ||
    t === 'other'
  )
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

  // ── Debts ─────────────────────────────────────────────────────────────────
  for (const acc of accountsStore.accounts.filter(isDebtAccount)) {
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
        paymentFrequency: acc.paymentFrequency || null
      }
    }

    const freq = acc.paymentFrequency
    if (freq === 'Weekly') {
      for (let d = 1; d <= daysInMonth; d += 7) addEvent(d, makeDebtEvent(d))
    } else if (freq === 'BiWeekly') {
      for (let d = 1; d <= daysInMonth; d += 14) addEvent(d, makeDebtEvent(d))
    } else {
      // Monthly or no frequency — needs a specific due date
      const day = acc.dueDate
      if (!day) continue
      addEvent(day, makeDebtEvent(day))
    }
  }

  return map
})

// ── Dialog ────────────────────────────────────────────────────────────────────

const dialogOpen = ref(false)
const selectedEvent = ref(null)

function openEvent(evt) {
  selectedEvent.value = evt
  dialogOpen.value = true
}

// ── Init ──────────────────────────────────────────────────────────────────────

onMounted(async () => {
  // Seed the view to the currently selected budget month
  const s = settingsStore.selectedMonth
  if (s && s.length >= 6) {
    viewYear.value = parseInt(s.slice(0, 4)) || today.getFullYear()
    viewMonth.value = (parseInt(s.slice(4, 6)) || today.getMonth() + 1) - 1
  }

  await Promise.all([
    categoriesStore.fetchCategories(),
    accountsStore.fetchAccounts(),
    budgetsStore.fetchBudgets(),
    debtsStore.fetchDebtDetails()
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

.cal-event {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.3;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
}

.cal-event--warning {
  background-color: rgb(var(--v-theme-warning));
}

.cal-event--error {
  background-color: rgb(var(--v-theme-error));
}
</style>
