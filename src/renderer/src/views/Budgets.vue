<template>
  <v-container fluid class="pa-6">
    <v-row class="mb-6">
      <v-col cols="12" sm="6" lg="3">
        <v-card class="pa-4 h-100" rounded="sm" elevation="3">
          <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-1">
            Planned Income
          </div>
          <div class="text-h5 font-weight-black">{{ formatCurrency(plannedIncome) }}</div>
          <div class="text-caption text-medium-emphasis mt-1">
            Actual {{ formatCurrency(actualIncome) }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="pa-4 h-100" rounded="sm" elevation="3">
          <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-1">
            Planned Outflow
          </div>
          <div class="text-h5 font-weight-black">{{ formatCurrency(plannedOutflow) }}</div>
          <div class="text-caption text-medium-emphasis mt-1">
            Actual {{ formatCurrency(actualOutflow) }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="pa-4 h-100" rounded="sm" elevation="3">
          <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-1">
            Planned Net
          </div>
          <div
            class="text-h5 font-weight-black"
            :class="plannedNet >= 0 ? 'text-success' : 'text-error'"
          >
            {{ formatCurrency(plannedNet) }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            Actual {{ formatCurrency(actualNet) }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="pa-4 h-100" rounded="sm" elevation="3">
          <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-1">
            Budget Variance
          </div>
          <div
            class="text-h5 font-weight-black"
            :class="budgetVariance >= 0 ? 'text-success' : 'text-error'"
          >
            {{ formatCurrency(budgetVariance) }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">Actual net vs planned net</div>
        </v-card>
      </v-col>
    </v-row>

    <v-alert
      v-if="budgetsStore.error || categoriesStore.error || loadError"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ budgetsStore.error || categoriesStore.error || loadError }}
    </v-alert>

    <div>
      <section v-for="section in budgetSections" :key="section.value">
        <div class="d-flex align-center justify-space-between flex-wrap gap-3 mb-2">
          <div class="d-flex align-center gap-2">
            <v-icon :color="section.color" size="20">{{ section.icon }}</v-icon>
            <h2 class="text-h6 font-weight-bold">{{ section.label }}</h2>
          </div>
        </div>

        <v-table density="comfortable" class="mb-6">
          <thead>
            <tr>
              <th class="text-start text-uppercase text-caption font-weight-bold pl-4">Category</th>
              <th class="text-center text-uppercase text-caption font-weight-bold">Actual</th>
              <th class="text-center text-uppercase text-caption font-weight-bold">Budget</th>
              <th class="text-center text-uppercase text-caption font-weight-bold">
                {{ section.type === 'income' ? 'Variance' : 'Remaining' }}
              </th>
              <th class="text-center text-uppercase text-caption font-weight-bold">Used</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="section.rows.length === 0">
              <td colspan="5" class="text-center py-8 text-medium-emphasis">
                No {{ section.label.toLowerCase() }} categories yet.
              </td>
            </tr>
            <tr v-for="row in section.rows" :key="row.id">
              <td class="pl-4">
                <span>{{ row.name }}</span>
              </td>
              <td class="text-center font-weight-bold">{{ formatCurrency(row.actual) }}</td>
              <td>
                <v-text-field
                  :model-value="row.planned"
                  type="number"
                  prefix="$"
                  variant="solo"
                  flat
                  density="compact"
                  hide-details
                  @update:model-value="(value) => updateBudget(row.id, value)"
                />
              </td>
              <td
                class="text-center font-weight-bold"
                :class="row.remaining >= 0 ? 'text-success' : 'text-error'"
              >
                {{ formatCurrency(row.remaining) }}
              </td>
              <td class="text-center">
                <div class="d-flex align-center gap-2">
                  <v-progress-linear
                    :model-value="row.percentUsed"
                    :color="row.percentColor"
                    height="8"
                    rounded
                  />
                  <span class="text-caption">{{ row.percentLabel }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </section>
    </div>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useUserBudgetsStore } from '../stores/userBudgets'
import { useUserCategoriesStore } from '../stores/userCategories'
import { useUserSettingsStore } from '../stores/userSettings'

const budgetsStore = useUserBudgetsStore()
const categoriesStore = useUserCategoriesStore()
const settingsStore = useUserSettingsStore()

const ipc = window.electron?.ipcRenderer
const transactions = ref([])
const loadError = ref(null)

const categoryTypeOptions = [
  { label: 'Income', value: 'income', icon: 'mdi-trending-up', color: 'success' },
  { label: 'Savings', value: 'savings', icon: 'mdi-piggy-bank', color: 'info' },
  { label: 'Bills', value: 'bills', icon: 'mdi-calendar-month', color: 'warning' },
  { label: 'Variable', value: 'variable', icon: 'mdi-shopping', color: 'secondary' },
  { label: 'Debt', value: 'debt', icon: 'mdi-cash-remove', color: 'error' }
]

const selectedMonth = computed(() => settingsStore.selectedMonth)

const categoryMeta = computed(() => {
  return Object.fromEntries(categoryTypeOptions.map((type) => [type.value, type]))
})

const actualsByCategory = computed(() => {
  const actuals = new Map()

  for (const transaction of transactions.value) {
    const amount = Number(transaction.TRNAMT) || 0
    addActual(actuals, transaction.category, amount)
    addActual(actuals, transaction.splitCategory1, Number(transaction.splitAmount1) || 0)
    addActual(actuals, transaction.splitCategory2, Number(transaction.splitAmount2) || 0)
  }

  return actuals
})

const budgetRows = computed(() => {
  return categoriesStore.categories.map((category) => {
    const meta = categoryMeta.value[category.type] || categoryMeta.value.variable
    const budget = budgetsStore.getBudget(category.id)
    const planned = budget?.amount || 0
    const actual = actualsByCategory.value.get(category.name) || 0
    const remaining = category.type === 'income' ? actual - planned : planned - actual
    const rawPercent = planned > 0 ? (actual / planned) * 100 : actual > 0 ? 100 : 0
    const percentUsed = Math.min(rawPercent, 100)

    return {
      ...category,
      actual,
      planned,
      remaining,
      percentUsed,
      percentLabel: `${Math.round(rawPercent)}%`,
      percentColor: getPercentColor(category.type, rawPercent),
      typeLabel: meta.label,
      icon: meta.icon,
      color: meta.color
    }
  })
})

const budgetSections = computed(() => {
  return categoryTypeOptions.map((type) => {
    const rows = budgetRows.value
      .filter((row) => row.type === type.value)
      .sort((a, b) => a.name.localeCompare(b.name))
    const planned = rows.reduce((sum, row) => sum + row.planned, 0)
    const actual = rows.reduce((sum, row) => sum + row.actual, 0)

    return {
      ...type,
      type: type.value,
      rows,
      planned,
      actual,
      remaining: type.value === 'income' ? actual - planned : planned - actual
    }
  })
})

const plannedIncome = computed(() => sumByType('income', 'planned'))
const actualIncome = computed(() => sumByType('income', 'actual'))
const plannedOutflow = computed(() =>
  budgetRows.value.filter((row) => row.type !== 'income').reduce((sum, row) => sum + row.planned, 0)
)
const actualOutflow = computed(() =>
  budgetRows.value.filter((row) => row.type !== 'income').reduce((sum, row) => sum + row.actual, 0)
)
const plannedNet = computed(() => plannedIncome.value - plannedOutflow.value)
const actualNet = computed(() => actualIncome.value - actualOutflow.value)
const budgetVariance = computed(() => actualNet.value - plannedNet.value)

function addActual(actuals, categoryName, rawAmount) {
  if (!categoryName || !rawAmount) return
  actuals.set(categoryName, (actuals.get(categoryName) || 0) + Math.abs(rawAmount))
}

function sumByType(type, key) {
  return budgetRows.value.filter((row) => row.type === type).reduce((sum, row) => sum + row[key], 0)
}

function getPercentColor(type, percent) {
  if (type === 'income') return percent >= 100 ? 'success' : 'warning'
  if (percent > 100) return 'error'
  if (percent >= 85) return 'warning'
  return 'success'
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)
}

async function loadMonth() {
  loadError.value = null
  try {
    if (!ipc) throw new Error('Electron IPC is not available.')
    const result = await ipc.invoke('transactions:fetch', { DTPOSTED: selectedMonth.value })
    if (!result.success) throw new Error(result.error)
    transactions.value = result.data
  } catch (err) {
    loadError.value = err?.message ?? String(err)
  }
}

async function updateBudget(categoryId, value) {
  await budgetsStore.upsertBudget(categoryId, Number(value) || 0)
}

onMounted(async () => {
  await Promise.all([categoriesStore.fetchCategories(), budgetsStore.fetchBudgets()])
  await loadMonth()
})

watch(
  () => settingsStore.selectedMonth,
  () => {
    loadMonth()
  }
)
</script>
