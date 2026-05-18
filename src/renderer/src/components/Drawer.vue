<script setup>
import { computed, ref, watch } from 'vue'
import { useUserSettingsStore } from '../stores/userSettings'

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
  { title: 'Net Worth', value: 'NetWorth', icon: 'mdi-chart-bar' },
  { title: 'Transactions', value: 'Transactions', icon: 'mdi-magnify' },
  { title: 'Auto-Rules', value: 'Rules', icon: 'mdi-tag-multiple-outline' }
]

defineProps({ currentView: { type: String, default: 'Dashboard' } })
const emit = defineEmits(['change-view'])

const settingsStore = useUserSettingsStore()
const monthMenu = ref(false)
const pickerYear = ref(getSelectedYear())

const monthOptions = computed(() => {
  return Array.from({ length: 12 }, (_, index) => ({
    label: new Date(pickerYear.value, index, 1).toLocaleDateString('en-US', { month: 'short' }),
    value: `${pickerYear.value}${String(index + 1).padStart(2, '0')}`
  }))
})

function getSelectedYear() {
  return Number(settingsStore.selectedMonth.slice(0, 4)) || new Date().getFullYear()
}

function selectMonth(month) {
  settingsStore.setSelectedMonth(month)
  monthMenu.value = false
}

function changeYear(direction) {
  pickerYear.value += direction
}

watch(monthMenu, (isOpen) => {
  if (isOpen) pickerYear.value = getSelectedYear()
})
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

    <div v-if="!isRail" class="pa-3">
      <v-menu v-model="monthMenu" location="bottom start" :close-on-content-click="false">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            block
            variant="tonal"
            color="primary"
            prepend-icon="mdi-calendar-month-outline"
          >
            {{ settingsStore.selectedMonthLabel }}
            <v-icon end size="16">mdi-chevron-down</v-icon>
          </v-btn>
        </template>

        <v-card min-width="260" rounded="lg" elevation="8" class="pa-3">
          <div class="d-flex align-center justify-space-between mb-2">
            <v-btn
              icon="mdi-chevron-left"
              variant="text"
              size="small"
              aria-label="Previous year"
              @click="changeYear(-1)"
            />
            <div class="text-subtitle-1 font-weight-bold">{{ pickerYear }}</div>
            <v-btn
              icon="mdi-chevron-right"
              variant="text"
              size="small"
              aria-label="Next year"
              @click="changeYear(1)"
            />
          </div>

          <v-row dense>
            <v-col v-for="month in monthOptions" :key="month.value" cols="4">
              <v-btn
                block
                size="small"
                variant="text"
                :color="month.value === settingsStore.selectedMonth ? 'primary' : undefined"
                @click="selectMonth(month.value)"
              >
                {{ month.label }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-menu>
    </div>
    <div v-else class="d-flex justify-center pa-2">
      <v-btn
        icon="mdi-calendar-month-outline"
        variant="text"
        size="small"
        @click="isRail = false"
      />
    </div>

    <v-divider></v-divider>

    <v-list density="compact" nav>
      <v-list-item
        v-for="item in navItems"
        :key="item.value"
        link
        :title="item.title"
        :prepend-icon="item.icon"
        :active="item.value === currentView"
        @click="emit('change-view', item.value)"
      />
    </v-list>

    <template #append> </template>
  </v-navigation-drawer>
</template>
