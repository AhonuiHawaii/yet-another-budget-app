<script setup>
const navItems = [
  { title: 'Dashboard', value: 'Dashboard' },
  { title: 'Accounts', value: 'Accounts' },
  { title: 'Transactions', value: 'Transactions' },
  { title: 'Budgets', value: 'Budgets' },
  { title: 'Goals', value: 'Goals' },
  { title: 'Debts', value: 'Debts' },
  { title: 'Income', value: 'Income' },
  { title: 'Expenses', value: 'Expenses' },
  { title: 'Bills', value: 'Bills' },
  { title: 'Reports', value: 'Reports' }
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
        @click="emit('change-view', item.value)"
      ></v-list-item>
    </v-list>

    <template #append>
      <div class="pa-2">
        <v-btn block variant="outlined"> Logout </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>
