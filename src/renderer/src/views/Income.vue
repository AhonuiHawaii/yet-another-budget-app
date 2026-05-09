<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between flex-wrap gap-3 mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Income</h1>
        <p class="text-body-1 text-medium-emphasis mt-1">Track your projected vs actual income</p>
      </div>
    </div>

    <!-- Total Income Header -->
    <v-card class="mb-6 bg-surface py-6 px-4" rounded="xl" elevation="0" border>
      <v-row no-gutters>
        <v-col cols="4" class="text-center border-e border-opacity-25">
          <div
            class="text-caption text-uppercase font-weight-bold tracking-widest text-medium-emphasis mb-1"
          >
            Projected
          </div>
          <div class="text-h4 font-weight-black text-white">
            {{ formatCurrency(totalProjected) }}
          </div>
        </v-col>
        <v-col cols="4" class="text-center border-e border-opacity-25">
          <div
            class="text-caption text-uppercase font-weight-bold tracking-widest text-medium-emphasis mb-1"
          >
            Actual
          </div>
          <div class="text-h4 font-weight-black text-white">{{ formatCurrency(totalActual) }}</div>
        </v-col>
        <v-col cols="4" class="text-center">
          <div
            class="text-caption text-uppercase font-weight-bold tracking-widest text-medium-emphasis mb-1"
          >
            Difference
          </div>
          <div
            class="text-h4 font-weight-black"
            :class="totalActual - totalProjected >= 0 ? 'text-success' : 'text-error'"
          >
            {{ formatCurrency(totalActual - totalProjected) }}
          </div>
        </v-col>
      </v-row>
    </v-card>

    <!-- Merged Projected vs Actual Table & Manage Categories -->
    <div class="d-flex justify-end mb-3">
      <v-btn
        prepend-icon="mdi-plus"
        variant="tonal"
        color="primary"
        size="small"
        @click="addNewRow"
      >
        Add Category
      </v-btn>
    </div>
    <v-card class="bg-transparent" rounded="0" elevation="0">
      <div>
        <v-table density="comfortable" class="bg-transparent text-white" theme="dark">
          <thead>
            <tr>
              <th
                class="text-left font-weight-bold text-uppercase text-caption text-white pb-2 pt-4 pl-6 border-b-0"
              >
                Category
              </th>
              <th
                class="text-center font-weight-bold text-uppercase text-caption text-white pb-2 pt-4 border-b-0"
              >
                Actual<br />
                <span class="text-body-1 font-weight-bold text-white">{{
                  formatCurrency(totalActual)
                }}</span>
              </th>
              <th
                class="text-center font-weight-bold text-uppercase text-caption text-white pb-2 pt-4 border-b-0"
              >
                Projected<br />
                <span class="text-body-1 font-weight-bold text-white">{{
                  formatCurrency(totalProjected)
                }}</span>
              </th>
              <th
                class="text-center font-weight-bold text-uppercase text-caption text-white pb-2 pt-4 border-b-0"
              >
                Diff<br />
                <span class="text-body-1 font-weight-bold text-white">{{
                  formatCurrency(totalActual - totalProjected)
                }}</span>
              </th>
              <th class="border-b-0"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(cat, idx) in combinedCategories" :key="cat.id" class="dashed-row">
              <td class="font-weight-medium text-body-2 text-uppercase pl-4">
                <div class="d-flex align-center position-relative w-100">
                  <span class="position-absolute left-0 text-medium-emphasis text-caption">{{
                    idx + 1
                  }}</span>
                  <div v-if="editingCatId === cat.id">
                    <v-text-field
                      v-model="editingCatName"
                      variant="solo-filled"
                      flat
                      density="compact"
                      hide-details
                      @keyup.enter="saveCategoryEdit"
                      @blur="saveCategoryEdit"
                      autofocus
                      class="text-left"
                    />
                  </div>
                  <div v-else>
                    <span class="cursor-pointer" @click="startCategoryEdit(cat)">{{
                      cat.name
                    }}</span>
                  </div>
                </div>
              </td>
              <td class="text-center font-weight-bold">
                {{ formatCurrency(cat.actual) }}
              </td>
              <td class="text-center">
                <div class="d-flex justify-center">
                  <v-text-field
                    :model-value="cat.projected"
                    @update:model-value="(val) => updateBudgetInline(cat.id, val)"
                    type="number"
                    prefix="$"
                    variant="solo"
                    flat
                    density="compact"
                    hide-details
                    class="mt-n2 mb-n2 text-center font-weight-bold"
                  />
                </div>
              </td>
              <td
                class="text-center font-weight-bold"
                :class="cat.actual - cat.projected >= 0 ? 'text-success' : 'text-error'"
              >
                {{ formatCurrency(cat.actual - cat.projected) }}
              </td>
              <td class="text-center px-0">
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  class="opacity-50"
                  @click="categoriesStore.deleteCategory(cat.id)"
                />
              </td>
            </tr>
            <!-- No trailing row, rows are added directly to the table data -->
          </tbody>
        </v-table>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUserCategoriesStore } from '../stores/userCategories'
import { useUserBudgetsStore } from '../stores/userBudgets'
import { useUserSettingsStore } from '../stores/userSettings'
import { useUserTransactionsStore } from '../stores/userTransactions'

const categoriesStore = useUserCategoriesStore()
const budgetsStore = useUserBudgetsStore()
const settingsStore = useUserSettingsStore()
const transactionsStore = useUserTransactionsStore()

// ── Period Picker Logic ───────────────────────────────────────────────────────
const pickerMenu = ref(false)
const granularity = ref('month')
const granularities = [
  { label: 'Weekly', value: 'week' },
  { label: 'Bi-Weekly', value: 'biweek' },
  { label: 'Month', value: 'month' },
  { label: 'Quarter', value: 'quarter' },
  { label: 'Year', value: 'year' }
]
const pickerDate = ref(monthToDate(settingsStore.selectedMonth))

const pickerViewMode = computed(() => {
  if (granularity.value === 'year') return 'year'
  if (granularity.value === 'quarter') return 'month'
  return 'month'
})

// Calculate the start and end dates based on the selected date and granularity
const periodBounds = computed(() => {
  if (!pickerDate.value) return null
  const d = new Date(pickerDate.value)
  const y = d.getFullYear()
  const m = d.getMonth()
  const day = d.getDay() // 0 is Sunday

  let start, end

  if (granularity.value === 'week') {
    // Start on Sunday
    const diff = d.getDate() - day
    start = new Date(y, m, diff)
    end = new Date(y, m, diff + 6, 23, 59, 59, 999)
  } else if (granularity.value === 'biweek') {
    // 14 days starting from Sunday of selected week
    const diff = d.getDate() - day
    start = new Date(y, m, diff)
    end = new Date(y, m, diff + 13, 23, 59, 59, 999)
  } else if (granularity.value === 'month') {
    start = new Date(y, m, 1)
    end = new Date(y, m + 1, 0, 23, 59, 59, 999)
  } else if (granularity.value === 'quarter') {
    const qStartMonth = Math.floor(m / 3) * 3
    start = new Date(y, qStartMonth, 1)
    end = new Date(y, qStartMonth + 3, 0, 23, 59, 59, 999)
  } else if (granularity.value === 'year') {
    start = new Date(y, 0, 1)
    end = new Date(y, 11, 31, 23, 59, 59, 999)
  }

  return { start, end }
})

const pickerLabel = computed(() => {
  const bounds = periodBounds.value
  if (!bounds) return 'Pick period'

  const s = bounds.start
  const e = bounds.end

  if (granularity.value === 'week' || granularity.value === 'biweek') {
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }
  if (granularity.value === 'month')
    return s.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  if (granularity.value === 'quarter')
    return `Q${Math.floor(s.getMonth() / 3) + 1} ${s.getFullYear()}`
  if (granularity.value === 'year') return String(s.getFullYear())

  return ''
})

function onGranularityTab(g) {
  granularity.value = g
  if (pickerDate.value) applyPeriod()
}

function onPickerSelect(date) {
  if (!date) return
  settingsStore.setSelectedMonthFromDate(date)
  pickerMenu.value = false
}

async function applyPeriod() {
  await transactionsStore.fetchTransactionsByMonth(settingsStore.selectedMonth)
}

function monthToDate(month) {
  const y = parseInt(month.slice(0, 4))
  const m = parseInt(month.slice(4, 6)) - 1
  return new Date(y, m, 1)
}

// ── Categories Management ──────────────────────────────────────────────────────
const editingCatId = ref(null)
const editingCatName = ref('')

const incomeCategories = computed(() => categoriesStore.getCategoriesByType('income'))

async function addNewRow() {
  const newCat = await categoriesStore.addCategory({ name: 'New Category', type: 'income' })
  startCategoryEdit(newCat)
}

function startCategoryEdit(cat) {
  editingCatId.value = cat.id
  editingCatName.value = cat.name
}

async function saveCategoryEdit() {
  if (editingCatId.value && editingCatName.value.trim()) {
    await categoriesStore.updateCategory(editingCatId.value, { name: editingCatName.value.trim() })
  }
  editingCatId.value = null
  editingCatName.value = ''
}

// ── Budgets Management ───────────────────────────────────────────────────────

async function updateBudgetInline(categoryId, amount) {
  await budgetsStore.upsertBudget(categoryId, Number(amount) || 0)
}

// ── Data Aggregation ─────────────────────────────────────────────────────────

// Filter transactions to strictly within the period bounds
const currentTransactions = computed(() => {
  const bounds = periodBounds.value
  if (!bounds) return []

  return transactionsStore.transactions.filter((t) => {
    // DTPOSTED is YYYYMMDD...
    const s = String(t.DTPOSTED || '')
    const y = parseInt(s.slice(0, 4))
    const m = parseInt(s.slice(4, 6)) - 1
    const d = parseInt(s.slice(6, 8))
    const tDate = new Date(y, m, d)
    return tDate >= bounds.start && tDate <= bounds.end
  })
})

const combinedCategories = computed(() => {
  const actuals = new Map()
  for (const t of currentTransactions.value) {
    const trnAmt = Number(t.TRNAMT)
    if (t.category)
      actuals.set(t.category, (actuals.get(t.category) || 0) + (trnAmt > 0 ? trnAmt : 0))
    if (t.splitCategory1 && t.splitCategory1 !== t.category && t.splitAmount1 > 0)
      actuals.set(t.splitCategory1, (actuals.get(t.splitCategory1) || 0) + t.splitAmount1)
    if (t.splitCategory2 && t.splitCategory2 !== t.category && t.splitAmount2 > 0)
      actuals.set(t.splitCategory2, (actuals.get(t.splitCategory2) || 0) + t.splitAmount2)
  }

  return incomeCategories.value.map((cat) => ({
    ...cat,
    projected: budgetsStore.getBudget(cat.id)?.amount || 0,
    actual: actuals.get(cat.name) || 0
  }))
})

const totalProjected = computed(() => combinedCategories.value.reduce((s, c) => s + c.projected, 0))
const totalActual = computed(() => combinedCategories.value.reduce((s, c) => s + c.actual, 0))

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)
}

onMounted(async () => {
  await transactionsStore.fetchMonthsWithData()
  settingsStore.initializeSelectedMonth(transactionsStore.monthsWithData)
  pickerDate.value = monthToDate(settingsStore.selectedMonth)
  await applyPeriod()
})

watch(
  () => settingsStore.selectedMonth,
  async (month) => {
    pickerDate.value = monthToDate(month)
    await applyPeriod()
  }
)
</script>
