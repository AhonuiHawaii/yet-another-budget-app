<template>
  <v-container fluid class="pa-4">
    <div class="d-flex justify-center align-center mb-6">
      <v-btn variant="flat" density="comfortable" rounded="sm" @click="prevMonth">
        <v-icon start size="16">mdi-chevron-left</v-icon>
        {{ prevMonthLabel }}
      </v-btn>
      <span class="text-subtitle-1 font-weight-bold mx-6">{{ monthLabel(selectedMonth) }}</span>
      <v-btn
        variant="flat"
        density="comfortable"
        rounded="sm"
        :disabled="isNextMonthFuture"
        @click="nextMonth"
      >
        {{ nextMonthLabel }}
        <v-icon end size="16">mdi-chevron-right</v-icon>
      </v-btn>
    </div>

    <div class="d-flex justify-end mb-4">
      <v-btn variant="flat" rounded="sm" prepend-icon="mdi-download-outline" @click="exportIncome">
        Export Income
      </v-btn>
    </div>

    <v-alert
      v-if="budgetsStore.error || categoriesStore.error || loadError"
      type="error"
      variant="flat"
      class="mb-4"
    >
      {{ budgetsStore.error || categoriesStore.error || loadError }}
    </v-alert>

    <div style="display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start">
      <div>
        <section v-for="section in incomeSections" :key="section.value">
          <v-card rounded="sm" elevation="2" class="mb-6">
            <v-card-item class="pa-4 pb-0">
              <template #prepend>
                <v-icon :color="section.color" size="20" :opacity="0.7">{{ section.icon }}</v-icon>
              </template>
              <v-card-title class="text-h6 font-weight-bold pl-2">{{ section.label }}</v-card-title>
              <template #append>
                <v-btn
                  variant="text"
                  size="small"
                  prepend-icon="mdi-plus"
                  density="compact"
                  @click="startAddingCategory(section.type)"
                >
                  Add Category
                </v-btn>
              </template>
            </v-card-item>

            <v-table density="comfortable" class="mt-2">
              <thead>
                <tr>
                  <th class="text-start text-caption text-medium-emphasis pl-5">Category</th>
                  <th class="text-center text-caption text-medium-emphasis" style="width: 120px">
                    Actual
                  </th>
                  <th class="text-center text-caption text-medium-emphasis" style="width: 150px">
                    Budget
                  </th>
                  <th class="text-center text-caption text-medium-emphasis" style="width: 120px">
                    {{ section.type === 'income' ? 'Variance' : 'Remaining' }}
                  </th>
                  <th style="width: 40px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="section.rows.length === 0">
                  <td colspan="5" class="text-center py-8 text-medium-emphasis">
                    No {{ section.label.toLowerCase() }} categories yet.
                  </td>
                </tr>
                <tr v-for="row in section.rows" :key="row.id">
                  <td class="pl-2 text-body-2 font-weight-medium">
                    <div class="d-flex align-center gap-3">
                      <v-btn
                        :icon="
                          locked[row.id] ? 'mdi-lock-outline' : 'mdi-lock-open-variant-outline'
                        "
                        variant="text"
                        size="x-small"
                        density="compact"
                        :color="locked[row.id] ? 'error' : undefined"
                        :opacity="locked[row.id] ? 0.7 : 0.3"
                        @click="toggleLock(row.id)"
                      />
                      <v-text-field
                        v-if="!locked[row.id]"
                        :model-value="editingNames[row.id] ?? row.name"
                        variant="solo"
                        flat
                        density="compact"
                        hide-details
                        @update:model-value="(v) => (editingNames[row.id] = v)"
                        @keyup.enter="saveCategoryName(row.id, row.name)"
                        @blur="saveCategoryName(row.id, row.name)"
                      />
                      <span v-else class="pl-3">{{ row.name }}</span>
                    </div>
                  </td>
                  <td class="text-center text-body-2 font-weight-bold">
                    {{ formatCurrency(row.actual) }}
                  </td>
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
                    class="text-center text-body-2 font-weight-bold"
                    :class="row.remaining >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ formatCurrency(row.remaining) }}
                  </td>
                  <td class="text-center pr-2">
                    <v-btn
                      icon="mdi-delete-outline"
                      variant="text"
                      size="small"
                      color="error"
                      density="compact"
                      :opacity="0.4"
                      @click="categoriesStore.deleteCategory(row.id)"
                    />
                  </td>
                </tr>
                <tr v-if="addingType === section.type">
                  <td colspan="5" class="pl-4 py-1">
                    <v-text-field
                      v-model="newCategoryName"
                      placeholder="Category name"
                      variant="solo"
                      flat
                      density="compact"
                      hide-details
                      autofocus
                      style="max-width: 280px"
                      @keyup.enter="saveNewCategory(section.type)"
                      @keyup.esc="cancelNewCategory"
                      @blur="saveNewCategory(section.type)"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </section>
      </div>

      <!-- Summary panel -->
      <v-card rounded="sm" elevation="2" style="position: sticky; top: 24px">
        <v-card-text class="pa-5">
          <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-4">
            Summary
          </div>

          <!-- Ring chart with center text -->
          <div style="position: relative; width: 180px; height: 180px; margin: 0 auto 16px">
            <Doughnut :data="summaryChartData" :options="summaryChartOptions" />
            <div
              style="
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                pointer-events: none;
              "
            >
              <v-icon v-if="incomeVariance < 0" color="warning" size="20" class="mb-1"
                >mdi-alert</v-icon
              >
              <span class="text-caption text-medium-emphasis">Earned</span>
              <span
                class="text-h6 font-weight-black"
                :class="incomeVariance < 0 ? 'text-error' : ''"
                >{{ formatCurrency(actualIncome) }}</span
              >
              <span class="text-caption text-medium-emphasis"
                >of {{ formatCurrency(plannedIncome) }}</span
              >
            </div>
          </div>

          <!-- Line items -->
          <v-divider />
          <div class="d-flex justify-space-between align-center py-3">
            <span class="text-body-2">Planned Income</span>
            <span class="text-body-2 font-weight-bold">{{ formatCurrency(plannedIncome) }}</span>
          </div>

          <v-divider />
          <div class="d-flex justify-space-between align-center py-3">
            <span class="text-body-2">Actual Earnings</span>
            <span class="text-body-2 font-weight-bold">{{ formatCurrency(actualIncome) }}</span>
          </div>

          <v-divider />
          <div class="d-flex justify-space-between align-center py-3">
            <span class="text-body-2">Variance</span>
            <span
              class="text-body-2 font-weight-black"
              :class="incomeVariance >= 0 ? 'text-success' : 'text-error'"
              >{{ formatCurrency(incomeVariance) }}</span
            >
          </div>
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import { Doughnut } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip)
import { useUserBudgetsStore } from '../stores/userBudgets'
import { useUserCategoriesStore } from '../stores/userCategories'
import { useUserSettingsStore } from '../stores/userSettings'

const budgetsStore = useUserBudgetsStore()
const categoriesStore = useUserCategoriesStore()
const { formatCurrency } = useUserSettingsStore()

const ipc = window.electron?.ipcRenderer
const transactions = ref([])
const loadError = ref(null)

function currentMonthValue() {
  const now = new Date()
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(yyyymm) {
  const year = Number(yyyymm.slice(0, 4))
  const month = Number(yyyymm.slice(4)) - 1
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function offsetMonth(yyyymm, delta) {
  const year = Number(yyyymm.slice(0, 4))
  const month = Number(yyyymm.slice(4)) - 1
  const d = new Date(year, month + delta, 1)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
}
function shortMonthLabel(yyyymm) {
  const year = Number(yyyymm.slice(0, 4))
  const month = Number(yyyymm.slice(4)) - 1
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

const selectedMonth = ref(currentMonthValue())
const prevMonthLabel = computed(() => shortMonthLabel(offsetMonth(selectedMonth.value, -1)))
const nextMonthLabel = computed(() => shortMonthLabel(offsetMonth(selectedMonth.value, 1)))
const isNextMonthFuture = computed(() => offsetMonth(selectedMonth.value, 1) > currentMonthValue())
function prevMonth() {
  selectedMonth.value = offsetMonth(selectedMonth.value, -1)
}
function nextMonth() {
  selectedMonth.value = offsetMonth(selectedMonth.value, 1)
}

const categoryTypeOptions = [
  { label: 'Earnings', value: 'income', icon: 'mdi-trending-up', color: 'success' },
  { label: 'Savings Goals', value: 'savings', icon: 'mdi-piggy-bank', color: 'info' }
]

const incomeTypes = new Set(categoryTypeOptions.map((t) => t.value))

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

const incomeRows = computed(() => {
  return categoriesStore.categories
    .filter((c) => incomeTypes.has(c.type))
    .map((category) => {
      const planned = budgetsStore.getBudget(category.id)?.amount || 0
      const actual = actualsByCategory.value.get(category.id) || 0
      const remaining = category.type === 'income' ? actual - planned : planned - actual
      return { ...category, actual, planned, remaining }
    })
})

const incomeSections = computed(() =>
  categoryTypeOptions.map((type) => {
    const rows = incomeRows.value
      .filter((row) => row.type === type.value)
      .sort((a, b) => a.name.localeCompare(b.name))
    const planned = rows.reduce((sum, row) => sum + row.planned, 0)
    const actual = rows.reduce((sum, row) => sum + row.actual, 0)
    return { ...type, type: type.value, rows, planned, actual, remaining: actual - planned }
  })
)

const plannedIncome = computed(() =>
  incomeRows.value.filter((r) => r.type === 'income').reduce((s, r) => s + r.planned, 0)
)
const actualIncome = computed(() =>
  incomeRows.value.filter((r) => r.type === 'income').reduce((s, r) => s + r.actual, 0)
)
const incomeVariance = computed(() => actualIncome.value - plannedIncome.value)

const summaryChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '78%',
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  animation: { duration: 300 }
}

const summaryChartData = computed(() => {
  const planned = plannedIncome.value
  const actual = actualIncome.value
  const dim = 'rgba(255,255,255,0.1)'
  if (planned <= 0 && actual <= 0)
    return { datasets: [{ data: [1], backgroundColor: [dim], borderWidth: 0 }] }
  if (planned <= 0)
    return { datasets: [{ data: [actual], backgroundColor: ['#4caf50'], borderWidth: 0 }] }
  const remaining = Math.max(0, planned - actual)
  const over = Math.max(0, actual - planned)
  if (over > 0)
    return {
      datasets: [{ data: [planned, over], backgroundColor: ['#4caf50', '#81c784'], borderWidth: 0 }]
    }
  return {
    datasets: [
      {
        data: [actual || 0.001, remaining || 0.001],
        backgroundColor: ['#4caf50', dim],
        borderWidth: 0
      }
    ]
  }
})

function addActual(actuals, categoryName, rawAmount) {
  if (!categoryName || !rawAmount) return
  actuals.set(categoryName, (actuals.get(categoryName) || 0) + Math.abs(rawAmount))
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

const locked = ref({})
const editingNames = ref({})

function toggleLock(id) {
  if (locked.value[id]) {
    const rest = { ...locked.value }
    delete rest[id]
    locked.value = rest
  } else {
    locked.value = { ...locked.value, [id]: true }
    const rest = { ...editingNames.value }
    delete rest[id]
    editingNames.value = rest
  }
}

async function saveCategoryName(id, currentName) {
  const name = (editingNames.value[id] ?? currentName).trim()
  if (!name || name === currentName) return
  await categoriesStore.updateCategory(id, { name })
}

const addingType = ref(null)
const newCategoryName = ref('')

function startAddingCategory(type) {
  addingType.value = type
  newCategoryName.value = ''
}

async function saveNewCategory(type) {
  const name = newCategoryName.value.trim()
  addingType.value = null
  newCategoryName.value = ''
  if (!name) return
  await categoriesStore.addCategory({ type, name })
}

function cancelNewCategory() {
  addingType.value = null
  newCategoryName.value = ''
}

async function updateBudget(categoryId, value) {
  await budgetsStore.upsertBudget(categoryId, Number(value) || 0)
}

function exportIncome() {
  const payload = {
    exportedAt: new Date().toISOString(),
    month: selectedMonth.value,
    sections: incomeSections.value.map((section) => ({
      type: section.type,
      label: section.label,
      planned: section.planned,
      actual: section.actual,
      remaining: section.remaining,
      rows: section.rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        planned: row.planned,
        actual: row.actual,
        remaining: row.remaining
      }))
    })),
    totals: {
      plannedIncome: plannedIncome.value,
      actualIncome: actualIncome.value,
      incomeVariance: incomeVariance.value
    }
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `income-${selectedMonth.value}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  await Promise.all([categoriesStore.fetchCategories(), budgetsStore.fetchBudgets()])
  await loadMonth()
})

watch(selectedMonth, () => loadMonth())
</script>
