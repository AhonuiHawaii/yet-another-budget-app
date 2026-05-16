<script setup>
import { computed, shallowRef, ref, onMounted, onErrorCaptured } from 'vue'
import { useUserTransactionsStore } from './stores/userTransactions'
import { useUserSettingsStore } from './stores/userSettings'
import Drawer from './components/Drawer.vue'
import Dashboard from './views/Dashboard.vue'
import Settings from './views/Settings.vue'
import Accounts from './views/Accounts.vue'
import Transactions from './views/Transactions.vue'
import Income from './views/Income.vue'
import Variable from './views/Variable.vue'
import Savings from './views/Savings.vue'
import Debts from './views/Debt.vue'
import Budgets from './views/Budgets.vue'
import Reports from './views/Reports.vue'
import Goals from './views/Goals.vue'
import Rules from './views/Rules.vue'
import Calendar from './views/Calendar.vue'

const views = {
  Dashboard,
  Settings,
  Accounts,
  Transactions,
  Income,
  Variable,
  Savings,
  Debts,
  Budgets,
  Reports,
  Goals,
  Rules,
  Calendar
}

const currentView = ref('Dashboard')
const currentComponent = computed(() => views[currentView.value] ?? views.Dashboard)

const transactionsStore = useUserTransactionsStore()
const settingsStore = useUserSettingsStore()

// 2.2: Single authoritative initialization of monthsWithData + selectedMonth
onMounted(async () => {
  await transactionsStore.fetchMonthsWithData()
  settingsStore.initializeSelectedMonth(transactionsStore.monthsWithData)
})

// 2.3: Warn on unknown view names instead of silently ignoring
const changeView = (viewName) => {
  if (!views[viewName]) {
    console.warn(`[App] Unknown view: "${viewName}"`)
    return
  }
  currentView.value = viewName
}

// 2.4: Top-level error boundary so a crashing child view shows a recovery UI
const appError = ref(null)
onErrorCaptured((err) => {
  appError.value = err.message
  return false
})
</script>

<template>
  <v-app>
    <Drawer :current-view="currentView" @change-view="changeView" />
    <v-main>
      <v-alert v-if="appError" type="error" class="ma-4" closable @click:close="appError = null">
        {{ appError }}
      </v-alert>
      <component v-else :is="currentComponent" />
    </v-main>
  </v-app>
</template>
