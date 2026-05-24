<script setup>
import { ref } from 'vue'

const isRail = ref(false)
const appName = window.api?.name ?? ''
const appVersion = window.api?.version ?? ''

const navItems = [
  { title: 'Dashboard', value: 'Dashboard', icon: 'mdi-view-dashboard' },
  { title: 'Accounts', value: 'Accounts', icon: 'mdi-bank' },
  { title: 'Spending', value: 'Spending', icon: 'mdi-cash-multiple' },
  { title: 'Debts', value: 'Debts', icon: 'mdi-cash-remove' },
  { title: 'Recurring', value: 'Recurring', icon: 'mdi-calendar-sync' },
  { title: 'Budgets', value: 'Budgets', icon: 'mdi-calculator-variant-outline' },
  { title: 'Earnings', value: 'Income', icon: 'mdi-cash-plus' },
  { title: 'Net Worth', value: 'NetWorth', icon: 'mdi-chart-bar' },
  { title: 'Transactions', value: 'Transactions', icon: 'mdi-magnify' },
  { title: 'Backup & Restore', value: 'Backup', icon: 'mdi-database-sync' },
  { title: 'Auto-Rules', value: 'Rules', icon: 'mdi-tag-multiple-outline' }
]

defineProps({ currentView: { type: String, default: 'Dashboard' } })
const emit = defineEmits(['change-view'])
</script>

<template>
  <v-navigation-drawer permanent color="surface-variant" :rail="isRail">
    <v-list-item
      :prepend-icon="isRail ? 'mdi-menu-close' : undefined"
      :title="isRail ? '' : `${appName}`"
      :subtitle="isRail ? '' : `Version ${appVersion}`"
      v-bind="isRail ? { style: 'cursor:pointer', onClick: () => (isRail = false) } : {}"
    >
      <template v-if="!isRail" #append>
        <v-icon icon="mdi-menu-open" style="cursor: pointer" @click.stop="isRail = true" />
      </template>
    </v-list-item>
    <v-divider></v-divider>

    <v-list density="compact" nav>
      <v-list-item
        :key="'Settings'"
        link
        title="Settings"
        :active="'Settings' === currentView"
        @click="emit('change-view', 'Settings')"
      >
        <template #prepend>
          <v-tooltip text="Settings" location="right">
            <template #activator="{ props: tipProps }">
              <v-icon v-bind="tipProps" icon="mdi-cog-outline" />
            </template>
          </v-tooltip>
        </template>
      </v-list-item>
      <v-divider class="my-1"></v-divider>
      <v-list-item
        v-for="item in navItems"
        :key="item.value"
        link
        :title="item.title"
        :active="item.value === currentView"
        @click="emit('change-view', item.value)"
      >
        <template #prepend>
          <v-tooltip :text="item.title" location="right">
            <template #activator="{ props: tipProps }">
              <v-icon v-bind="tipProps" :icon="item.icon" />
            </template>
          </v-tooltip>
        </template>
      </v-list-item>
    </v-list>

    <template #append>
      <v-divider></v-divider>
      <v-list density="compact" nav>
        <v-list-item
          link
          title="Privacy"
          :active="'Privacy' === currentView"
          @click="emit('change-view', 'Privacy')"
        >
          <template #prepend>
            <v-tooltip text="Privacy" location="right">
              <template #activator="{ props: tipProps }">
                <v-icon v-bind="tipProps" icon="mdi-shield-lock-outline" />
              </template>
            </v-tooltip>
          </template>
        </v-list-item>
      </v-list>
    </template>
  </v-navigation-drawer>
</template>
