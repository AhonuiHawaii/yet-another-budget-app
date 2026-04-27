<script setup>
const emit = defineEmits(['change-view'])
</script>

<template>
  <v-navigation-drawer permanent color="surface-variant">
    <v-list-item title="Budgeting Tool" subtitle="Version 0.0.0"></v-list-item>
    <v-divider></v-divider>
    <v-list-item link title="Dashboard" @click="emit('change-view', 'Dashboard')"></v-list-item>

    <template v-slot:append>
      <v-list-item link title="Settings" @click="emit('change-view', 'Settings')"></v-list-item>
      <div class="pa-2"><v-btn block> Logout </v-btn></div>
    </template>
  </v-navigation-drawer>
</template>
