<template>
  <v-container fluid class="pa-6">
    <!-- Adaptive Summary Header -->
    <v-card class="mb-6" rounded elevation="2">
      <v-row no-gutters>
        <!-- Monthly tab header -->
        <template v-if="activeTab === 'monthly'">
          <v-col cols="4" class="pa-6 text-center">
            <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2">
              Projected
            </div>
            <div class="text-h4 font-weight-black text-white">
              {{ formatCurrency(totalProjected) }}
            </div>
          </v-col>
          <v-col cols="4" class="pa-6 text-center">
            <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2">
              Actual
            </div>
            <div class="text-h4 font-weight-black text-white">
              {{ formatCurrency(totalActual) }}
            </div>
          </v-col>
          <v-col cols="4" class="pa-6 text-center">
            <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2">
              Difference
            </div>
            <div
              class="text-h4 font-weight-black"
              :class="totalActual - totalProjected >= 0 ? 'text-success' : 'text-error'"
            >
              {{ formatCurrency(totalActual - totalProjected) }}
            </div>
          </v-col>
        </template>

        <!-- Goals tab header -->
        <template v-else>
          <v-col cols="3" class="pa-6 text-center">
            <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2">
              Total Target
            </div>
            <div class="text-h4 font-weight-black text-white">
              {{ formatCurrency(goalsStore.totalTarget) }}
            </div>
          </v-col>
          <v-col cols="3" class="pa-6 text-center">
            <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2">
              Saved
            </div>
            <div class="text-h4 font-weight-black text-success">
              {{ formatCurrency(goalsStore.totalSaved) }}
            </div>
          </v-col>
          <v-col cols="3" class="pa-6 text-center">
            <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2">
              Remaining
            </div>
            <div class="text-h4 font-weight-black text-white">
              {{ formatCurrency(goalsStore.totalRemaining) }}
            </div>
          </v-col>
          <v-col cols="3" class="pa-6 text-center">
            <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2">
              Completed
            </div>
            <div class="text-h4 font-weight-black text-white">
              {{ goalsStore.completedGoals.length }}
            </div>
          </v-col>
        </template>
      </v-row>
    </v-card>

    <!-- Tabs -->
    <v-card rounded elevation="2">
      <v-tabs v-model="activeTab" color="primary" class="px-4 pt-2">
        <v-tab value="monthly" prepend-icon="mdi-piggy-bank">Savings</v-tab>
        <v-tab value="goals" prepend-icon="mdi-flag-outline">Goals</v-tab>
      </v-tabs>

      <v-divider />

      <v-window v-model="activeTab">
        <!-- ── Monthly Tab ───────────────────────────────────────────────── -->
        <v-window-item value="monthly">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="info" size="20" :opacity="0.7">mdi-piggy-bank</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">Categories</v-card-title>
            <template #append>
              <v-btn
                prepend-icon="mdi-plus"
                variant="tonal"
                color="primary"
                size="small"
                @click="addNewRow"
              >
                Add Category
              </v-btn>
            </template>
          </v-card-item>

          <v-table density="comfortable" class="mt-2">
            <thead>
              <tr>
                <th class="text-start font-weight-bold text-uppercase text-caption pl-4">
                  Category
                </th>
                <th class="text-center font-weight-bold text-uppercase text-caption">
                  Actual
                  <div class="text-body-2 font-weight-bold">{{ formatCurrency(totalActual) }}</div>
                </th>
                <th class="text-center font-weight-bold text-uppercase text-caption">
                  Projected
                  <div class="text-body-2 font-weight-bold">
                    {{ formatCurrency(totalProjected) }}
                  </div>
                </th>
                <th class="text-center font-weight-bold text-uppercase text-caption">
                  Diff
                  <div class="text-body-2 font-weight-bold">
                    {{ formatCurrency(totalActual - totalProjected) }}
                  </div>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(cat, idx) in combinedCategories" :key="cat.id">
                <td class="font-weight-medium text-body-2 text-uppercase pl-4">
                  <div class="d-flex align-center position-relative w-100">
                    <span class="position-absolute left-0 text-medium-emphasis text-caption">{{
                      idx + 1
                    }}</span>
                    <div v-if="editingCatId === cat.id" class="w-100">
                      <v-text-field
                        v-model="editingCatName"
                        variant="solo-filled"
                        flat
                        density="compact"
                        hide-details
                        @keyup.enter="saveCategoryEdit"
                        @blur="saveCategoryEdit"
                        autofocus
                        class="text-start"
                      />
                    </div>
                    <div v-else>
                      <span class="cursor-pointer" @click="startCategoryEdit(cat)">{{
                        cat.name
                      }}</span>
                    </div>
                  </div>
                </td>
                <td class="text-center font-weight-bold">{{ formatCurrency(cat.actual) }}</td>
                <td class="text-center">
                  <v-chip
                    v-if="budgetsStore.getRolloverAmount(cat.id, settingsStore.selectedMonth) > 0"
                    size="x-small"
                    color="info"
                    variant="tonal"
                    class="mb-1"
                  >
                    +{{
                      formatCurrency(
                        budgetsStore.getRolloverAmount(cat.id, settingsStore.selectedMonth)
                      )
                    }}
                    rollover
                  </v-chip>
                  <v-text-field
                    :model-value="cat.projected"
                    @update:model-value="(val) => updateBudgetInline(cat.id, val)"
                    type="number"
                    prefix="$"
                    variant="solo"
                    flat
                    density="compact"
                    hide-details
                    class="text-center font-weight-bold"
                  />
                </td>
                <td
                  class="text-center font-weight-bold"
                  :class="cat.actual - cat.projected >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ formatCurrency(cat.actual - cat.projected) }}
                </td>
                <td class="text-center px-0">
                  <v-btn
                    :color="budgetsStore.getBudget(cat.id)?.rolloverEnabled ? 'info' : 'default'"
                    icon="mdi-reload"
                    variant="text"
                    size="small"
                    density="compact"
                    class="opacity-70 mr-1"
                    title="Toggle rollover"
                    @click="
                      budgetsStore.toggleRolloverEnabled(
                        cat.id,
                        !budgetsStore.getBudget(cat.id)?.rolloverEnabled
                      )
                    "
                  />
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
            </tbody>
          </v-table>
        </v-window-item>

        <!-- ── Goals Tab ─────────────────────────────────────────────────── -->
        <v-window-item value="goals">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="primary" size="20" :opacity="0.7">mdi-flag-outline</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">Goals</v-card-title>
            <template #append>
              <v-btn
                prepend-icon="mdi-plus"
                variant="tonal"
                color="primary"
                size="small"
                @click="openNewGoal"
              >
                Add Goal
              </v-btn>
            </template>
          </v-card-item>

          <v-alert v-if="goalsStore.error" type="error" variant="tonal" class="mx-4 mt-3">
            {{ goalsStore.error }}
          </v-alert>

          <v-table density="comfortable" class="mt-2">
            <thead>
              <tr>
                <th class="text-start text-uppercase text-caption font-weight-bold pl-4">Goal</th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Priority</th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Saved</th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Target</th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Remaining</th>
                <th class="text-center text-uppercase text-caption font-weight-bold">Progress</th>
                <th class="text-center text-uppercase text-caption font-weight-bold">
                  Target Date
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="goalRows.length === 0">
                <td colspan="8" class="text-center py-10 text-medium-emphasis">No goals yet.</td>
              </tr>
              <tr
                v-for="goal in goalRows"
                :key="goal.id"
                draggable="true"
                @dragstart="onDragStart(goal.id)"
                @dragover.prevent
                @drop="onDrop(goal.id)"
              >
                <td class="pl-4 font-weight-medium text-body-2">{{ goal.name }}</td>
                <td class="text-center">
                  <v-chip color="primary" variant="tonal" size="x-small" rounded>{{
                    goal.priority
                  }}</v-chip>
                </td>
                <td>
                  <v-text-field
                    :model-value="goal.currentAmount"
                    type="number"
                    prefix="$"
                    variant="solo"
                    flat
                    density="compact"
                    hide-details
                    @update:model-value="(value) => updateCurrentAmount(goal.id, value)"
                  />
                </td>
                <td class="text-center text-body-2 font-weight-bold">
                  {{ formatCurrency(goal.targetAmount) }}
                </td>
                <td
                  class="text-center text-body-2 font-weight-bold"
                  :class="goal.remaining <= 0 ? 'text-success' : 'text-medium-emphasis'"
                >
                  {{ formatCurrency(goal.remaining) }}
                </td>
                <td class="text-center">
                  <div class="d-flex align-center gap-2 px-2">
                    <v-progress-linear
                      :model-value="goal.progress"
                      :color="goal.status === 'completed' ? 'success' : 'primary'"
                      height="4"
                      rounded
                    />
                    <span class="text-caption text-medium-emphasis" style="min-width: 32px">{{
                      goal.progressLabel
                    }}</span>
                  </div>
                </td>
                <td class="text-center text-body-2">{{ formatDate(goal.targetDate) }}</td>
                <td class="text-right">
                  <v-btn
                    icon="mdi-pencil-outline"
                    variant="text"
                    size="small"
                    density="compact"
                    @click="openEditGoal(goal)"
                  />
                  <v-btn
                    icon="mdi-delete-outline"
                    variant="text"
                    size="small"
                    density="compact"
                    color="error"
                    @click="goalsStore.deleteGoal(goal.id)"
                  />
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-window-item>
      </v-window>
    </v-card>

    <!-- Add / Edit Goal Dialog -->
    <v-dialog v-model="goalDialog" max-width="520">
      <v-card rounded="sm">
        <v-card-title class="d-flex align-center justify-space-between pa-6">
          <span class="text-h6 font-weight-bold">{{
            editingGoalId ? 'Edit Goal' : 'Add Goal'
          }}</span>
          <v-btn icon="mdi-close" variant="text" density="compact" @click="closeGoalDialog" />
        </v-card-title>
        <v-card-text class="px-6 pt-0">
          <v-text-field
            v-model="goalForm.name"
            label="Goal name"
            variant="outlined"
            density="comfortable"
          />
          <v-text-field
            v-model.number="goalForm.targetAmount"
            label="Target amount"
            type="number"
            prefix="$"
            variant="outlined"
            density="comfortable"
          />
          <v-text-field
            v-model.number="goalForm.currentAmount"
            label="Saved so far"
            type="number"
            prefix="$"
            variant="outlined"
            density="comfortable"
          />
          <v-text-field
            v-model="goalForm.targetDate"
            label="Target date"
            type="date"
            variant="outlined"
            density="comfortable"
          />
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="closeGoalDialog">Cancel</v-btn>
          <v-btn color="primary" variant="tonal" :loading="goalsStore.loading" @click="saveGoal"
            >Save</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUserCategoriesStore } from '../stores/userCategories'
import { useUserBudgetsStore } from '../stores/userBudgets'
import { useUserSettingsStore } from '../stores/userSettings'
import { useUserTransactionsStore } from '../stores/userTransactions'
import { useUserGoalsStore } from '../stores/userGoals'

const categoriesStore = useUserCategoriesStore()
const budgetsStore = useUserBudgetsStore()
const settingsStore = useUserSettingsStore()
const transactionsStore = useUserTransactionsStore()
const goalsStore = useUserGoalsStore()

// ── Tab State ─────────────────────────────────────────────────────────────────
const activeTab = ref('monthly')

// ── Period Picker Logic ───────────────────────────────────────────────────────
const periodBounds = computed(() => {
  const y = parseInt(settingsStore.selectedMonth.slice(0, 4))
  const m = parseInt(settingsStore.selectedMonth.slice(4, 6)) - 1
  return {
    start: new Date(y, m, 1),
    end: new Date(y, m + 1, 0, 23, 59, 59, 999)
  }
})

async function applyPeriod() {
  await transactionsStore.fetchTransactionsByMonth(settingsStore.selectedMonth)
}

// ── Categories Management ─────────────────────────────────────────────────────
const editingCatId = ref(null)
const editingCatName = ref('')

const savingsCategories = computed(() => categoriesStore.getCategoriesByType('savings'))

async function addNewRow() {
  const newCat = await categoriesStore.addCategory({ name: 'New Category', type: 'savings' })
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

// ── Budgets Management ────────────────────────────────────────────────────────
async function updateBudgetInline(categoryId, amount) {
  await budgetsStore.upsertBudget(categoryId, Number(amount) || 0)
}

// ── Data Aggregation (Monthly) ────────────────────────────────────────────────
const currentTransactions = computed(() => {
  const bounds = periodBounds.value
  if (!bounds) return []
  return transactionsStore.transactions.filter((t) => {
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
      actuals.set(t.category, (actuals.get(t.category) || 0) + (trnAmt < 0 ? Math.abs(trnAmt) : 0))
    if (t.splitCategory1 && t.splitCategory1 !== t.category && t.splitAmount1 > 0)
      actuals.set(t.splitCategory1, (actuals.get(t.splitCategory1) || 0) + t.splitAmount1)
    if (t.splitCategory2 && t.splitCategory2 !== t.category && t.splitAmount2 > 0)
      actuals.set(t.splitCategory2, (actuals.get(t.splitCategory2) || 0) + t.splitAmount2)
  }
  return savingsCategories.value.map((cat) => ({
    ...cat,
    projected: budgetsStore.getEffectiveBudget(cat.id, settingsStore.selectedMonth),
    actual: actuals.get(cat.name) || 0
  }))
})

const totalProjected = computed(() => combinedCategories.value.reduce((s, c) => s + c.projected, 0))
const totalActual = computed(() => combinedCategories.value.reduce((s, c) => s + c.actual, 0))

// ── Goals Logic ───────────────────────────────────────────────────────────────
const goalDialog = ref(false)
const editingGoalId = ref(null)
const goalForm = ref(createEmptyGoal())
const draggedGoalId = ref(null)

const goalRows = computed(() => {
  return goalsStore.goals
    .map((goal) => {
      const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0)
      const rawProgress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
      return {
        ...goal,
        remaining,
        progress: Math.min(rawProgress, 100),
        progressLabel: `${Math.round(rawProgress)}%`
      }
    })
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'completed' ? 1 : -1
      const prioritySort = a.priority - b.priority
      if (prioritySort !== 0) return prioritySort
      if (!a.targetDate) return 1
      if (!b.targetDate) return -1
      return a.targetDate.localeCompare(b.targetDate)
    })
})

function createEmptyGoal() {
  return { name: '', targetAmount: 0, currentAmount: 0, targetDate: '' }
}

function openNewGoal() {
  editingGoalId.value = null
  goalForm.value = createEmptyGoal()
  goalDialog.value = true
}

function openEditGoal(goal) {
  editingGoalId.value = goal.id
  goalForm.value = {
    name: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    targetDate: goal.targetDate || ''
  }
  goalDialog.value = true
}

function closeGoalDialog() {
  goalDialog.value = false
  editingGoalId.value = null
  goalForm.value = createEmptyGoal()
}

async function saveGoal() {
  if (editingGoalId.value) {
    await goalsStore.updateGoal(editingGoalId.value, goalForm.value)
  } else {
    await goalsStore.addGoal(goalForm.value)
  }
  if (!goalsStore.error) closeGoalDialog()
}

async function updateCurrentAmount(id, value) {
  await goalsStore.updateGoal(id, { currentAmount: Number(value) || 0 })
}

function onDragStart(id) {
  draggedGoalId.value = id
}

async function onDrop(targetId) {
  if (!draggedGoalId.value || draggedGoalId.value === targetId) return
  const rows = [...goalRows.value]
  const fromIndex = rows.findIndex((goal) => goal.id === draggedGoalId.value)
  const toIndex = rows.findIndex((goal) => goal.id === targetId)
  if (fromIndex === -1 || toIndex === -1) return
  const [movedGoal] = rows.splice(fromIndex, 1)
  rows.splice(toIndex, 0, movedGoal)
  draggedGoalId.value = null
  await goalsStore.reorderGoals(rows.map((goal) => goal.id))
}

// ── Shared Utilities ──────────────────────────────────────────────────────────
function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

onMounted(async () => {
  await applyPeriod()
  await goalsStore.fetchGoals()
})

watch(
  () => settingsStore.selectedMonth,
  async () => {
    await applyPeriod()
  }
)
</script>
