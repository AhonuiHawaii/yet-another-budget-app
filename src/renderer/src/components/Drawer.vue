<script setup>
const navItems = [
  { title: 'Dashboard', value: 'Dashboard', icon: 'mdi-view-dashboard' },
  { title: 'Accounts', value: 'Accounts', icon: 'mdi-bank' },
  { title: 'Transactions', value: 'Transactions', icon: 'mdi-swap-horizontal' },
  { title: 'Income', value: 'Income', icon: 'mdi-trending-up' },
  { title: 'Savings', value: 'Savings', icon: 'mdi-piggy-bank' },
  { title: 'Variable Expenses', value: 'Variable', icon: 'mdi-shopping' },
  { title: 'Bills', value: 'Bills', icon: 'mdi-calendar-month' },
  { title: 'Debts', value: 'Debts', icon: 'mdi-cash-remove' },
  { title: 'Budgets', value: 'Budgets', icon: 'mdi-chart-donut' },
  { title: 'Goals', value: 'Goals', icon: 'mdi-flag' },
  { title: 'Reports', value: 'Reports', icon: 'mdi-chart-bar' }
]

const emit = defineEmits(['change-view'])
</script>

<template>
  <v-navigation-drawer permanent color="surface-variant">
    <v-list-item title="Budgeting Tool" subtitle="Version 0.0.0"></v-list-item>
    <v-divider></v-divider>

    <v-list density="compact" nav>
      <v-list-item
        v-for="item in navItems"
        :key="item.value"
        link
        :title="item.title"
        :prepend-icon="item.icon"
        @click="emit('change-view', item.value)"
      />
    </v-list>

    <template #append>
      <div class="pa-2">
        <v-btn block variant="outlined"> Logout </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>
