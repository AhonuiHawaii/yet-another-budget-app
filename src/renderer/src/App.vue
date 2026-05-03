<script setup>
import { shallowRef } from 'vue'
import Drawer from './components/Drawer.vue'
import Dashboard from './views/Dashboard.vue'
import Settings from './views/Settings.vue'
import Accounts from './views/Accounts.vue'

const views = {
  Dashboard,
  Settings,
  Accounts
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
