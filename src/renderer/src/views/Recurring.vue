<template>
  <div>
    <div class="d-flex justify-center pt-4 pb-2">
      <v-btn-toggle
        v-model="activeTab"
        mandatory
        rounded="pill"
        density="comfortable"
        variant="outlined"
      >
        <v-btn value="upcoming">Upcoming</v-btn>
        <v-btn value="all">All Recurring</v-btn>
        <v-btn value="calendar">Calendar</v-btn>
      </v-btn-toggle>
    </div>

    <component :is="currentComponent" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Upcoming from '../components/Upcoming.vue'
import AllRecurring from '../components/AllRecurring.vue'
import Calendar from '../components/Calendar.vue'

const activeTab = ref('upcoming')

const tabs = { upcoming: Upcoming, all: AllRecurring, calendar: Calendar }

const currentComponent = computed(() => tabs[activeTab.value])
</script>
