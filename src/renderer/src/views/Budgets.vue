<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center mb-6">
      <v-menu v-model="monthMenu" location="bottom start" :close-on-content-click="false">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-calendar-month-outline"
          >
            {{ monthLabel(selectedMonth) }}
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
              @click="pickerYear--"
            />
            <div class="text-subtitle-1 font-weight-bold">{{ pickerYear }}</div>
            <v-btn
              icon="mdi-chevron-right"
              variant="text"
              size="small"
              aria-label="Next year"
              @click="pickerYear++"
            />
          </div>

          <v-row dense>
            <v-col v-for="month in monthOptions" :key="month.value" cols="4">
              <v-btn
                block
                size="small"
                variant="text"
                :color="month.value === selectedMonth ? 'primary' : undefined"
                @click="selectMonth(month.value)"
              >
                {{ month.label }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-menu>
    </div>

    <v-row class="mb-6">
      <v-col cols="12" sm="6" lg="3">
        <v-card class="h-100" rounded elevation="2">
          <v-card-text class="pa-4">
            <div class="d-flex align-start justify-space-between mb-3">
              <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis"
                >Planned Income</span
              >
              <v-icon color="success" size="18" :opacity="0.4">mdi-trending-up</v-icon>
            </div>
            <div class="text-h5 font-weight-black">{{ formatCurrency(plannedIncome) }}</div>
            <div class="text-caption text-medium-emphasis mt-1">
              Actual {{ formatCurrency(actualIncome) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="h-100" rounded elevation="2">
          <v-card-text class="pa-4">
            <div class="d-flex align-start justify-space-between mb-3">
              <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis"
                >Planned Outflow</span
              >
              <v-icon color="error" size="18" :opacity="0.4">mdi-arrow-up-circle-outline</v-icon>
            </div>
            <div class="text-h5 font-weight-black">{{ formatCurrency(plannedOutflow) }}</div>
            <div class="text-caption text-medium-emphasis mt-1">
              Actual {{ formatCurrency(actualOutflow) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="h-100" rounded elevation="2">
          <v-card-text class="pa-4">
            <div class="d-flex align-start justify-space-between mb-3">
              <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis"
                >Planned Net</span
              >
              <v-icon :color="plannedNet >= 0 ? 'success' : 'error'" size="18" :opacity="0.4"
                >mdi-trending-up</v-icon
              >
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
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card class="h-100" rounded elevation="2">
          <v-card-text class="pa-4">
            <div class="d-flex align-start justify-space-between mb-3">
              <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis"
                >Budget Variance</span
              >
              <v-icon :color="budgetVariance >= 0 ? 'success' : 'warning'" size="18" :opacity="0.4"
                >mdi-wallet-outline</v-icon
              >
            </div>
            <div
              class="text-h5 font-weight-black"
              :class="budgetVariance >= 0 ? 'text-success' : 'text-error'"
            >
              {{ formatCurrency(budgetVariance) }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">Actual net vs planned net</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-alert
      v-if="budgetsStore.error || categoriesStore.error || loadError"
      type="error"
      variant="flat"
      class="mb-4"
    >
      {{ budgetsStore.error || categoriesStore.error || loadError }}
    </v-alert>

    <div>
      <section v-for="section in budgetSections" :key="section.value">
        <v-card rounded elevation="2" class="mb-6">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon :color="section.color" size="20" :opacity="0.7">{{ section.icon }}</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">{{ section.label }}</v-card-title>
            <template v-if="['income', 'bills', 'variable', 'savings'].includes(section.type)" #append>
              <v-btn
                variant="text"
                size="small"
                prepend-icon="mdi-plus"
                color="primary"
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
                <th
                  v-if="section.type === 'bills' || section.type === 'debt'"
                  class="text-center text-caption text-medium-emphasis"
                  style="width: 120px"
                >
                  Due
                </th>
                <th class="text-center text-caption text-medium-emphasis" style="width: 120px">Actual</th>
                <th class="text-center text-caption text-medium-emphasis" style="width: 150px">Budget</th>
                <th class="text-center text-caption text-medium-emphasis" style="width: 120px">
                  {{ section.type === 'income' ? 'Variance' : 'Remaining' }}
                </th>
                <th class="text-center text-caption text-medium-emphasis pr-5" style="width: 160px">Used</th>
                <th style="width: 40px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="section.rows.length === 0">
                <td
                  :colspan="section.type === 'bills' || section.type === 'debt' ? 7 : 6"
                  class="text-center py-8 text-medium-emphasis"
                >
                  No {{ section.label.toLowerCase() }} categories yet.
                </td>
              </tr>
              <tr v-for="row in section.rows" :key="row.id">
                <td class="pl-2 text-body-2 font-weight-medium">
                  <div class="d-flex align-center gap-3">
                    <v-btn
                      :icon="locked[row.id] ? 'mdi-lock-outline' : 'mdi-lock-open-variant-outline'"
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
                <td v-if="section.type === 'bills' || section.type === 'debt'" class="text-center">
                  <v-menu
                    :model-value="openDueDateId === row.id"
                    :close-on-content-click="false"
                    @update:model-value="(v) => { if (!v) openDueDateId = null }"
                  >
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        variant="text"
                        size="small"
                        density="compact"
                        :color="row.dueDate ? 'primary' : undefined"
                        :icon="!row.dueDate"
                        class="text-caption"
                        @click="openDueDateId = row.id"
                      >
                        <v-icon
                          :size="row.dueDate ? 14 : 18"
                          :class="row.dueDate ? 'mr-1' : ''"
                          :opacity="row.dueDate ? 1 : 0.4"
                        >
                          {{ row.dueDate ? 'mdi-calendar-check' : 'mdi-calendar-plus' }}
                        </v-icon>
                        <span v-if="row.dueDate">Day {{ row.dueDate }}</span>
                      </v-btn>
                    </template>
                    <v-date-picker
                      :model-value="dueDateToModelValue(row.dueDate)"
                      hide-header
                      color="primary"
                      elevation="4"
                      @update:model-value="(d) => { updateDueDate(row.id, d); openDueDateId = null }"
                    />
                  </v-menu>
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
                <td class="text-center pr-5">
                  <div class="d-flex align-center gap-2 px-2">
                    <v-progress-linear
                      :model-value="row.percentUsed"
                      :color="row.percentColor"
                      height="4"
                      rounded
                    />
                    <span class="text-caption text-medium-emphasis" style="min-width: 32px">{{
                      row.percentLabel
                    }}</span>
                  </div>
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
                <td :colspan="section.type === 'bills' ? 7 : 6" class="pl-4 py-1">
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
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useUserBudgetsStore } from '../stores/userBudgets'
import { useUserCategoriesStore } from '../stores/userCategories'

const budgetsStore = useUserBudgetsStore()
const categoriesStore = useUserCategoriesStore()

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

const selectedMonth = ref(currentMonthValue())
const monthMenu = ref(false)
const pickerYear = ref(new Date().getFullYear())

const monthOptions = computed(() =>
  Array.from({ length: 12 }, (_, i) => ({
    label: new Date(pickerYear.value, i, 1).toLocaleDateString('en-US', { month: 'short' }),
    value: `${pickerYear.value}${String(i + 1).padStart(2, '0')}`
  }))
)

function selectMonth(month) {
  selectedMonth.value = month
  monthMenu.value = false
}

watch(monthMenu, (isOpen) => {
  if (isOpen) pickerYear.value = Number(selectedMonth.value.slice(0, 4)) || new Date().getFullYear()
})

const categoryTypeOptions = [
  { label: 'Income', value: 'income', icon: 'mdi-trending-up', color: 'success' },
  { label: 'Savings', value: 'savings', icon: 'mdi-piggy-bank', color: 'info' },
  { label: 'Bills', value: 'bills', icon: 'mdi-calendar-month', color: 'warning' },
  { label: 'Variable', value: 'variable', icon: 'mdi-shopping', color: 'secondary' },
  { label: 'Debt', value: 'debt', icon: 'mdi-cash-remove', color: 'error' }
]

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
      color: meta.color,
      dueDate: category.dueDate ?? null
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

const openDueDateId = ref(null)
const locked = ref({})
const editingNames = ref({})

function toggleLock(id) {
  if (locked.value[id]) {
    const { [id]: _, ...rest } = locked.value
    locked.value = rest
  } else {
    locked.value = { ...locked.value, [id]: true }
    const { [id]: _, ...rest } = editingNames.value
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

function dueDateToModelValue(dueDay) {
  if (!dueDay) return null
  const year = Number(selectedMonth.value.slice(0, 4))
  const month = Number(selectedMonth.value.slice(4)) - 1
  return new Date(year, month, dueDay)
}

async function updateBudget(categoryId, value) {
  await budgetsStore.upsertBudget(categoryId, Number(value) || 0)
}

async function updateDueDate(categoryId, date) {
  const d = date instanceof Date ? date : date ? new Date(date) : null
  await categoriesStore.updateCategory(categoryId, { dueDate: d ? d.getDate() : null })
}

onMounted(async () => {
  await Promise.all([categoriesStore.fetchCategories(), budgetsStore.fetchBudgets()])
  await loadMonth()
})

watch(selectedMonth, () => loadMonth())
</script>
