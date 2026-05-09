<script setup>
import { shallowRef } from 'vue'
import Drawer from './components/Drawer.vue'
import Dashboard from './views/Dashboard.vue'
import Settings from './views/Settings.vue'
import Accounts from './views/Accounts.vue'
import Transactions from './views/Transactions.vue'
import Income from './views/Income.vue'
import Variable from './views/Variable.vue'
import Savings from './views/Savings.vue'
import Debt from './views/Debt.vue'
import Bills from './views/Bills.vue'

const views = {
  Dashboard,
  Settings,
  Accounts,
  Transactions,
  Income,
  Variable,
  Savings,
  Debt,
  Bills
}

const currentComponent = shallowRef(views.Dashboard)

const changeView = (viewName) => {
  if (views[viewName]) {
    currentComponent.value = views[viewName]
  }
}
</script>

<template>
  <v-app>
    <Drawer @change-view="changeView" />
    <v-main>
      <component :is="currentComponent" />
    </v-main>
  </v-app>
</template>
