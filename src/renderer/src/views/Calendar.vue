<template>
  <div class="h-100 d-flex flex-column pa-4 bg-background">
    <v-sheet class="d-flex" tile elevation="1" rounded="t">
      <v-btn
        class="ma-2"
        variant="text"
        icon
        @click="$refs.calendar.prev()"
      >
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>
      <v-select
        v-model="type"
        :items="types"
        class="ma-2"
        density="comfortable"
        label="type"
        variant="outlined"
        hide-details
      ></v-select>
      <v-select
        v-model="mode"
        :items="modes"
        class="ma-2"
        density="comfortable"
        label="event-overlap-mode"
        variant="outlined"
        hide-details
      ></v-select>
      <v-select
        v-model="weekday"
        :items="weekdays"
        class="ma-2"
        density="comfortable"
        label="weekdays"
        variant="outlined"
        hide-details
      ></v-select>
      <v-spacer></v-spacer>
      <v-btn
        class="ma-2"
        variant="text"
        icon
        @click="$refs.calendar.next()"
      >
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>
    </v-sheet>
    <v-sheet height="700" class="flex-grow-1" elevation="1" rounded="b">
      <v-calendar
        ref="calendar"
        v-model="value"
        :event-color="getEventColor"
        :event-overlap-mode="mode"
        :event-overlap-threshold="30"
        :events="events"
        :type="type"
        :weekdays="weekday"
        @change="getEvents"
        @click:event="showEvent"
      ></v-calendar>
    </v-sheet>

    <v-dialog v-model="selectedOpen" max-width="400">
      <v-card rounded>
        <v-toolbar :color="selectedEvent?.color" dark density="comfortable">
          <v-toolbar-title class="text-white font-weight-bold">
            {{ selectedEvent?.originalName || selectedEvent?.name }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" color="white" @click="selectedOpen = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-6">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="text-caption text-uppercase text-medium-emphasis font-weight-bold">Amount Due</div>
            <div class="text-h6 font-weight-bold" :class="`text-${selectedEvent?.color}`">
              {{ formatCurrency(selectedEvent?.amount) }}
            </div>
          </div>
          <v-divider class="mb-4"></v-divider>
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-body-2 font-weight-medium">Due Date</div>
            <div class="text-body-2 text-medium-emphasis">
              {{ selectedEvent?.start ? new Date(selectedEvent.start).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : '' }}
            </div>
          </div>
          
          <div v-if="selectedEvent?.accountNumber" class="d-flex align-center justify-space-between mb-2">
            <div class="text-body-2 font-weight-medium">Account</div>
            <div class="text-body-2 text-medium-emphasis">
              *{{ selectedEvent.accountNumber }}
              <span v-if="selectedEvent.institution">({{ selectedEvent.institution }})</span>
            </div>
          </div>

          <div v-if="selectedEvent?.interestRate !== undefined && selectedEvent?.interestRate !== null" class="d-flex align-center justify-space-between mb-2">
            <div class="text-body-2 font-weight-medium">Interest Rate</div>
            <div class="text-body-2 text-medium-emphasis">
              {{ selectedEvent.interestRate }}%
            </div>
          </div>

          <div v-if="selectedEvent?.balance !== undefined && selectedEvent?.balance !== null" class="d-flex align-center justify-space-between mb-2">
            <div class="text-body-2 font-weight-medium">Current Balance</div>
            <div class="text-body-2 text-medium-emphasis">
              {{ formatCurrency(Math.abs(selectedEvent.balance)) }}
            </div>
          </div>

          <div class="d-flex align-center justify-space-between">
            <div class="text-body-2 font-weight-medium">Type</div>
            <div class="text-body-2 text-medium-emphasis">
              {{ selectedEvent?.details }}
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="tonal" @click="selectedOpen = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
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

const type = ref('month')
const types = ['month', 'week', 'day', '4day']
const mode = ref('stack')
const modes = ['stack', 'column']
const weekday = ref([0, 1, 2, 3, 4, 5, 6])
const weekdays = [
  { title: 'Sun - Sat', value: [0, 1, 2, 3, 4, 5, 6] },
  { title: 'Mon - Sun', value: [1, 2, 3, 4, 5, 6, 0] },
  { title: 'Mon - Fri', value: [1, 2, 3, 4, 5] },
  { title: 'Mon, Wed, Fri', value: [1, 3, 5] },
]

const value = ref('')
const events = ref([])

const selectedEvent = ref(null)
const selectedOpen = ref(false)

function showEvent(payload) {
  // Prevent default if it's a native event
  if (payload && payload.nativeEvent) {
    payload.nativeEvent.stopPropagation()
  }

  // Extract the target event object from the payload
  let targetEvt = payload?.event || payload
  if (targetEvt && targetEvt.raw) targetEvt = targetEvt.raw

  // The calendar component often clones and strips custom fields from the event objects.
  // To guarantee we have all our custom data (amount, interest, details, etc), 
  // we look up the exact original object from our events.value array.
  if (targetEvt) {
    const originalEvent = events.value.find(e => {
      if (e === targetEvt) return true
      if (e.name === (targetEvt.name || targetEvt.title)) {
        // Double check date matches if possible
        if (e.start && targetEvt.start) {
          const d1 = new Date(e.start).getTime()
          const d2 = new Date(targetEvt.start).getTime()
          return d1 === d2
        }
        return true
      }
      return false
    })

    if (originalEvent) {
      selectedEvent.value = originalEvent
      selectedOpen.value = true
      return
    }
  }

  // Fallback if lookup fails
  selectedEvent.value = targetEvt
  selectedOpen.value = true
}

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val || 0)
}

function getEvents({ start, end }) {
  if (!start || !end) return

  const evts = []
  
  const min = new Date(`${start.date}T00:00:00`)
  const max = new Date(`${end.date}T23:59:59`)

  const minYear = min.getFullYear()
  const maxYear = max.getFullYear()

  for (let y = minYear; y <= maxYear; y++) {
    for (let m = 0; m < 12; m++) {
      
      // Bills
      const bills = categoriesStore.categories.filter(c => c.type === 'bills' && c.dueDate)
      for (const bill of bills) {
        let day = 1
        if (String(bill.dueDate).includes('-')) {
          const parts = String(bill.dueDate).split('-')
          day = parseInt(parts[2], 10)
        } else {
          day = parseInt(bill.dueDate, 10)
        }
        
        if (isNaN(day)) continue

        const evDate = new Date(y, m, day, 12, 0, 0)
        
        if (evDate >= min && evDate <= max) {
          const monthStr = `${y}${String(m + 1).padStart(2, '0')}`
          const amount = budgetsStore.getEffectiveBudget(bill.id, monthStr)
          
          evts.push({
            name: `${bill.name} ${amount ? '(' + formatCurrency(amount) + ')' : ''}`,
            originalName: bill.name,
            start: evDate,
            end: evDate,
            color: 'warning',
            timed: false,
            amount: amount,
            details: 'Bill / Expense'
          })
        }
      }

      // Debts
      const debtAccounts = accountsStore.accounts.filter(a => {
        const t = String(a.ACCTTYPE || '').toLowerCase()
        return t.includes('credit') || t.includes('loan') || t.includes('mortgage') || t.includes('buy now pay later') || t.includes('medical')
      })

      for (const acc of debtAccounts) {
        const details = debtsStore.getDetail(acc.ACCTID) || {}
        const dueDate = acc.dueDate || details.dueDate
        
        if (!dueDate) continue
        
        let day = 1
        if (String(dueDate).includes('-')) {
          const parts = String(dueDate).split('-')
          day = parseInt(parts[2], 10)
        } else {
          day = parseInt(dueDate, 10)
        }
        
        if (isNaN(day)) continue

        const evDate = new Date(y, m, day, 12, 0, 0)
        if (evDate >= min && evDate <= max) {
          const amount = budgetsStore.getBudget(acc.ACCTID)?.amount || Number(details.minimumPayment) || 0
          const title = acc.displayName || acc.ORG || `Account *${acc.ACCTID}`
          
          evts.push({
            name: `${title} ${amount ? '(' + formatCurrency(amount) + ')' : ''}`,
            originalName: title,
            start: evDate,
            end: evDate,
            color: 'error',
            timed: false,
            amount: amount,
            details: `Debt / ${acc.ACCTTYPE || 'Loan'}`,
            accountNumber: acc.ACCTID,
            institution: acc.ORG,
            interestRate: acc.interestRate ?? details.interestRate,
            balance: details.balance ?? details.BALAMT
          })
        }
      }

    }
  }

  events.value = evts
}

function getEventColor(event) {
  return event.color || 'primary'
}

onMounted(async () => {
  await Promise.all([
    categoriesStore.fetchCategories(),
    accountsStore.fetchAccounts()
  ])
  
  // Set initial value to current settings month
  const y = parseInt(settingsStore.selectedMonth.slice(0, 4)) || new Date().getFullYear()
  const m = (parseInt(settingsStore.selectedMonth.slice(4, 6)) || (new Date().getMonth() + 1)) - 1
  
  // Vue Calendar value handles simple dates best
  value.value = [new Date(y, m, 15)]
})
</script>
