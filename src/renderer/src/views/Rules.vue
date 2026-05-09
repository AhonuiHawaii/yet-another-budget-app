<template>
  <v-container fluid class="pa-6">
    <!-- Page Header -->
    <div class="d-flex align-center justify-space-between flex-wrap gap-3 mb-6">
      <div class="d-flex align-center gap-3">
        <v-btn
          variant="tonal"
          color="secondary"
          rounded="lg"
          prepend-icon="mdi-play-outline"
          :loading="store.loading"
          @click="applyToCurrentMonth"
        >
          Apply to {{ settingsStore.selectedMonthLabel }}
        </v-btn>

        <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" @click="openAddDialog">
          Add Rule
        </v-btn>
      </div>
    </div>

    <!-- Apply result banner -->
    <v-slide-y-transition>
      <v-alert
        v-if="applyResult !== null"
        :type="applyResult.applied > 0 ? 'success' : 'info'"
        variant="tonal"
        rounded="lg"
        closable
        class="mb-4"
        @click:close="applyResult = null"
      >
        {{ applyResult.applied }} transaction{{ applyResult.applied === 1 ? '' : 's' }} categorized.
      </v-alert>
    </v-slide-y-transition>

    <!-- Error Banner -->
    <v-alert
      v-if="store.error"
      type="error"
      variant="tonal"
      rounded="lg"
      closable
      class="mb-4"
      @click:close="store.clearError()"
    >
      {{ store.error }}
    </v-alert>

    <!-- Empty State -->
    <v-card v-if="!store.loading && store.rules.length === 0" rounded="xl" elevation="0" border>
      <v-card-text class="pa-12 text-center">
        <v-icon size="60" class="mb-4 text-disabled">mdi-tag-multiple-outline</v-icon>
        <div class="text-h6 font-weight-medium mb-2">No rules yet</div>
        <div class="text-body-2 text-medium-emphasis mb-6">
          Add a rule to automatically categorize transactions when importing.
        </div>
        <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" @click="openAddDialog">
          Add First Rule
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Rules Table -->
    <v-card v-else rounded="xl" elevation="0" border>
      <v-data-table
        :headers="headers"
        :items="store.rules"
        :loading="store.loading"
        density="comfortable"
        :items-per-page="25"
        :items-per-page-options="[10, 25, 50]"
        hover
      >
        <!-- Field -->
        <template #item.field="{ item }">
          <v-chip size="x-small" variant="tonal" color="primary" rounded="lg">
            {{ item.field }}
          </v-chip>
        </template>

        <!-- Operator -->
        <template #item.operator="{ item }">
          <span class="text-body-2 text-medium-emphasis font-italic">{{ item.operator }}</span>
        </template>

        <!-- Value -->
        <template #item.value="{ item }">
          <span class="text-body-2 font-weight-medium">"{{ item.value }}"</span>
        </template>

        <!-- Category -->
        <template #item.category="{ item }">
          <v-chip size="x-small" variant="tonal" color="secondary" rounded="lg">
            {{ item.category }}
          </v-chip>
        </template>

        <!-- Type -->
        <template #item.type="{ item }">
          <v-chip v-if="item.type" size="x-small" variant="tonal" color="info" rounded="lg">
            {{ item.type }}
          </v-chip>
          <span v-else class="text-disabled text-caption">—</span>
        </template>

        <!-- Priority -->
        <template #item.priority="{ item }">
          <span class="text-body-2">{{ item.priority }}</span>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex align-center justify-end gap-1">
            <v-btn
              icon="mdi-pencil-outline"
              variant="text"
              size="small"
              density="compact"
              @click="openEditDialog(item)"
            />
            <v-btn
              icon="mdi-delete-outline"
              variant="text"
              size="small"
              color="error"
              density="compact"
              @click="confirmDelete(item)"
            />
          </div>
        </template>

        <template #loading>
          <v-skeleton-loader type="table-row@5" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Add / Edit Rule Dialog -->
    <v-dialog v-model="ruleDialog" max-width="520" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-3">
              <v-icon color="primary" size="20">mdi-tag-multiple-outline</v-icon>
              <span class="text-h6 font-weight-bold">{{
                editTarget ? 'Edit Rule' : 'Add Rule'
              }}</span>
            </div>
            <v-btn icon="mdi-close" variant="text" density="compact" @click="closeRuleDialog" />
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <v-row>
            <!-- Field -->
            <v-col cols="6">
              <v-select
                v-model="form.field"
                :items="fieldOptions"
                item-title="label"
                item-value="value"
                label="Field"
                variant="solo"
                inset
                density="comfortable"
                rounded="lg"
                hide-details
              />
            </v-col>

            <!-- Operator -->
            <v-col cols="6">
              <v-select
                v-model="form.operator"
                :items="operatorOptions"
                item-title="label"
                item-value="value"
                label="Operator"
                variant="solo"
                inset
                density="comfortable"
                rounded="lg"
                hide-details
              />
            </v-col>

            <!-- Value -->
            <v-col cols="12" class="mt-3">
              <v-text-field
                v-model="form.value"
                label="Match value"
                variant="solo"
                inset
                density="comfortable"
                rounded="lg"
                hide-details
                autofocus
              />
            </v-col>

            <!-- Category -->
            <v-col cols="8" class="mt-3">
              <v-combobox
                v-model="form.category"
                :items="allCategoryNames"
                label="Assign category"
                variant="solo"
                inset
                density="comfortable"
                rounded="lg"
                hide-details
                clearable
              />
            </v-col>

            <!-- Priority -->
            <v-col cols="4" class="mt-3">
              <v-text-field
                v-model.number="form.priority"
                label="Priority"
                type="number"
                variant="solo"
                inset
                density="comfortable"
                rounded="lg"
                hide-details
                hint="Higher = runs first"
              />
            </v-col>

            <!-- Type (optional) -->
            <v-col cols="12" class="mt-3">
              <v-select
                v-model="form.type"
                :items="typeOptions"
                item-title="label"
                item-value="value"
                label="Assign transaction type (optional)"
                variant="solo"
                inset
                density="comfortable"
                rounded="lg"
                hide-details
                clearable
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="closeRuleDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            :loading="store.loading"
            :disabled="!form.field || !form.operator || !form.value || !form.category"
            @click="saveRule"
          >
            {{ editTarget ? 'Save' : 'Add' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="text-h6 pa-6 pb-2">Delete Rule</v-card-title>
        <v-card-text class="pa-6 pt-2 text-body-2 text-medium-emphasis">
          Delete the rule matching
          <strong
            >{{ deleteTarget?.field }} {{ deleteTarget?.operator }} "{{
              deleteTarget?.value
            }}"</strong
          >? This cannot be undone.
        </v-card-text>
        <v-card-actions class="pa-6 pt-0 gap-2">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="tonal" :loading="store.loading" @click="doDelete">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserRulesStore } from '../stores/userRules'
import { useUserCategoriesStore } from '../stores/userCategories'
import { useUserTransactionsStore } from '../stores/userTransactions'
import { useUserSettingsStore } from '../stores/userSettings'

const store = useUserRulesStore()
const categoriesStore = useUserCategoriesStore()
const transactionsStore = useUserTransactionsStore()
const settingsStore = useUserSettingsStore()

onMounted(() => store.fetchRules())

const allCategoryNames = computed(() => categoriesStore.categories.map((c) => c.name))

// ── Table headers ─────────────────────────────────────────────────────────────
const headers = [
  { title: 'Field', key: 'field', width: '110px', sortable: true },
  { title: 'Operator', key: 'operator', width: '120px', sortable: true },
  { title: 'Value', key: 'value', sortable: false },
  { title: 'Category', key: 'category', width: '150px', sortable: true },
  { title: 'Type', key: 'type', width: '110px', sortable: false },
  { title: 'Priority', key: 'priority', width: '90px', sortable: true, align: 'center' },
  { title: '', key: 'actions', width: '80px', sortable: false, align: 'end' }
]

const fieldOptions = [
  { label: 'Name (payee)', value: 'NAME' },
  { label: 'Memo', value: 'MEMO' },
  { label: 'Amount', value: 'TRNAMT' },
  { label: 'Tran. type', value: 'TRNTYPE' }
]

const operatorOptions = [
  { label: 'contains', value: 'contains' },
  { label: 'equals', value: 'equals' },
  { label: 'starts with', value: 'startsWith' },
  { label: '> (greater than)', value: 'gt' },
  { label: '< (less than)', value: 'lt' }
]

const typeOptions = [
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' },
  { label: 'Bills', value: 'bills' },
  { label: 'Variable', value: 'variable' },
  { label: 'Savings', value: 'savings' }
]

// ── Add / Edit dialog ─────────────────────────────────────────────────────────
const ruleDialog = ref(false)
const editTarget = ref(null)

const blankForm = () => ({
  field: 'NAME',
  operator: 'contains',
  value: '',
  category: '',
  type: null,
  priority: 0
})
const form = ref(blankForm())

function openAddDialog() {
  editTarget.value = null
  form.value = blankForm()
  ruleDialog.value = true
}

function openEditDialog(item) {
  editTarget.value = item
  form.value = {
    field: item.field,
    operator: item.operator,
    value: item.value,
    category: item.category,
    type: item.type ?? null,
    priority: item.priority ?? 0
  }
  ruleDialog.value = true
}

function closeRuleDialog() {
  ruleDialog.value = false
  editTarget.value = null
}

async function saveRule() {
  if (editTarget.value) {
    await store.editRule(editTarget.value.id, {
      field: form.value.field,
      operator: form.value.operator,
      value: form.value.value,
      category: form.value.category,
      type: form.value.type || null,
      priority: form.value.priority ?? 0
    })
  } else {
    await store.createRule({
      field: form.value.field,
      operator: form.value.operator,
      value: form.value.value,
      category: form.value.category,
      type: form.value.type || null,
      priority: form.value.priority ?? 0
    })
  }
  if (!store.error) closeRuleDialog()
}

// ── Delete ────────────────────────────────────────────────────────────────────
const deleteDialog = ref(false)
const deleteTarget = ref(null)

function confirmDelete(item) {
  deleteTarget.value = item
  deleteDialog.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  await store.removeRule(deleteTarget.value.id)
  deleteDialog.value = false
  deleteTarget.value = null
}

// ── Apply to month ────────────────────────────────────────────────────────────
const applyResult = ref(null)

async function applyToCurrentMonth() {
  applyResult.value = null
  const result = await store.applyToMonth(settingsStore.selectedMonth)
  if (result?.success) {
    applyResult.value = result.data
    await transactionsStore.fetchTransactionsByMonth(settingsStore.selectedMonth)
  }
}
</script>
