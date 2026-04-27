<script setup>

const navItems = [
  { title: 'Dashboard', component: Dashboard },
  { title: 'Settings', component: Settings }
]
const emit = defineEmits(['change-view'])
</script>

<template>
  <v-navigation-drawer permanent color="surface-variant">
    <v-list-item title="Budgeting Tool" subtitle="Version 0.0.0"></v-list-item>
    <v-divider></v-divider>
    <v-list-item link title="Dashboard" @click="emit('change-view', 'Dashboard')"></v-list-item>

    <template v-slot:append>
      <div class="pa-2">
        <v-btn block class="mb-2" variant="tonal" @click="emit('change-view', 'Settings')">
          Settings
        </v-btn>
        <v-btn block variant="outlined"> Logout </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>
