<template>
  <v-container fluid class="pa-3">
    <!-- Import Transactions Dialog -->
    <v-dialog v-model="importDialog" max-width="500">
      <v-card rounded>
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-3">
              <v-icon color="primary" size="22">mdi-file-import-outline</v-icon>
              <span class="text-h6 font-weight-bold">Import Transactions</span>
            </div>
            <v-btn
              icon="mdi-close"
              variant="text"
              density="compact"
              @click="importDialog = false"
            />
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <p class="text-body-2 text-medium-emphasis mb-4">
            Select an OFX or QFX file exported from your bank to import its transactions.
          </p>

          <v-file-input
            v-model="selectedFile"
            accept=".ofx,.qfx"
            label="Choose OFX / QFX file"
            prepend-icon=""
            prepend-inner-icon="mdi-folder-open-outline"
            variant="solo"
            inset
            density="comfortable"
            hide-details="auto"
            :error-messages="store.error ? [store.error] : []"
            @update:model-value="store.clearError()"
          />
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="importDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="store.loading"
            :disabled="!selectedFile"
            prepend-icon="mdi-import"
            @click="handleImport"
          >
            Import
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Toolbar -->
    <v-card rounded elevation="2" class="mb-3">
      <v-card-text class="pa-3">
        <div class="d-flex align-center gap-2 flex-wrap mb-2">
          <v-menu v-model="pickerMenu" :close-on-content-click="false" location="bottom start">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                variant="tonal"
                color="primary"
                prepend-icon="mdi-calendar-month-outline"
                size="small"
                :loading="store.loading"
              >
                {{ pickerLabel }}
                <v-icon end size="16">mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <v-card min-width="260" rounded="lg" elevation="8" class="pa-3">
              <!-- Mode tabs -->
              <v-tabs
                v-model="granularity"
                density="compact"
                color="primary"
                align-tabs="center"
                class="mb-2"
                @update:model-value="onGranularityTab"
              >
                <v-tab value="month">Month</v-tab>
                <v-tab value="quarter">Quarter</v-tab>
                <v-tab value="year">Annual</v-tab>
              </v-tabs>

              <!-- Year navigator -->
              <div class="d-flex align-center justify-space-between mb-2">
                <v-btn
                  icon="mdi-chevron-left"
                  variant="text"
                  size="small"
                  @click="changeYear(-1)"
                />
                <div class="text-subtitle-1 font-weight-bold">{{ pickerYear }}</div>
                <v-btn
                  icon="mdi-chevron-right"
                  variant="text"
                  size="small"
                  @click="changeYear(1)"
                />
              </div>

              <!-- Month grid -->
              <v-row v-if="granularity === 'month'" dense>
                <v-col v-for="mo in monthOptions" :key="mo.value" cols="4">
                  <v-btn
                    block
                    size="small"
                    :variant="mo.value === selectedPeriodKey ? 'flat' : 'text'"
                    :color="
                      mo.value === selectedPeriodKey
                        ? 'primary'
                        : monthHasData(mo.value)
                          ? undefined
                          : undefined
                    "
                    :opacity="monthHasData(mo.value) ? 1 : 0.35"
                    @click="selectMonth(mo.value)"
                  >
                    {{ mo.label }}
                  </v-btn>
                </v-col>
              </v-row>

              <!-- Quarter grid -->
              <v-row v-else-if="granularity === 'quarter'" dense>
                <v-col v-for="q in quarterOptions" :key="q.value" cols="6">
                  <v-btn
                    block
                    height="52"
                    :variant="q.value === selectedPeriodKey ? 'flat' : 'text'"
                    :color="q.value === selectedPeriodKey ? 'primary' : undefined"
                    class="d-flex flex-column align-center justify-center"
                    @click="selectQuarter(q.value)"
                  >
                    <span class="text-body-2 font-weight-bold">{{ q.label }}</span>
                    <span class="text-caption opacity-70" style="margin-top: 2px">{{
                      q.months
                    }}</span>
                  </v-btn>
                </v-col>
              </v-row>

              <!-- Annual -->
              <div v-else class="d-flex justify-center py-2">
                <v-btn
                  :variant="String(pickerYear) === selectedPeriodKey ? 'flat' : 'tonal'"
                  color="primary"
                  size="small"
                  @click="selectYear(pickerYear)"
                >
                  Select {{ pickerYear }}
                </v-btn>
              </div>
            </v-card>
          </v-menu>

          <v-spacer />

          <v-slide-x-transition>
            <v-chip
              v-if="lastImported"
              color="success"
              variant="tonal"
              prepend-icon="mdi-check-circle-outline"
              size="small"
            >
              {{ lastImported }}
            </v-chip>
          </v-slide-x-transition>

          <v-btn
            color="primary"
            variant="flat"
            size="small"
            prepend-icon="mdi-file-import-outline"
            @click="importDialog = true"
          >
            Import
          </v-btn>
        </div>

        <div class="d-flex gap-2">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search"
            variant="solo"
            density="compact"
            hide-details
            clearable
            style="flex: 2"
          />
          <v-select
            v-model="filterAccount"
            :items="accountOptions"
            item-title="label"
            item-value="value"
            label="Account"
            variant="solo"
            density="compact"
            hide-details
            clearable
            style="flex: 1"
          />
          <v-select
            v-model="filterType"
            :items="typeOptions"
            item-title="label"
            item-value="value"
            label="Type"
            variant="solo"
            density="compact"
            hide-details
            clearable
            style="flex: 1"
          />
        </div>
      </v-card-text>
    </v-card>

    <!-- Bulk Action Toolbar -->
    <v-slide-y-transition>
      <div v-if="selectedRows.length > 0" class="mb-3">
        <v-sheet rounded color="primary" class="pa-3 d-flex align-center gap-3">
          <v-chip color="white" variant="flat" size="small" class="font-weight-bold">
            {{ selectedRows.length }} selected
          </v-chip>
          <v-btn
            size="small"
            variant="flat"
            color="white"
            prepend-icon="mdi-tag-multiple-outline"
            @click="openBulkCategoryDialog"
          >
            Set Category
          </v-btn>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            color="white"
            density="compact"
            @click="selectedRows = []"
          />
        </v-sheet>
      </div>
    </v-slide-y-transition>

    <!-- Error Banner -->
    <v-alert
      v-if="store.error"
      type="error"
      variant="tonal"
      closable
      class="mb-3"
      @click:close="store.clearError()"
    >
      {{ store.error }}
    </v-alert>

    <!-- Empty State -->
    <v-card v-if="!store.loading && store.transactions.length === 0" rounded elevation="2">
      <v-card-text class="pa-12 text-center">
        <v-icon size="60" class="mb-4 text-disabled">mdi-receipt-text-outline</v-icon>
        <div class="text-h6 font-weight-medium mb-2">No transactions found</div>
        <div class="text-body-2 text-medium-emphasis">
          Import an OFX file from the Accounts page to get started.
        </div>
      </v-card-text>
    </v-card>

    <!-- Data Table -->
    <v-card v-else rounded elevation="2">
      <v-data-table
        v-model:expanded="expandedRows"
        v-model:selected="selectedRows"
        show-expand
        show-select
        item-value="FITID"
        :headers="headers"
        :items="filteredTransactions"
        :loading="store.loading"
        :search="search"
        density="comfortable"
        :items-per-page="25"
        :items-per-page-options="[10, 25, 50, 100]"
        hover
      >
        <!-- Date column -->
        <template #item.DTPOSTED="{ item }">
          <span class="text-body-2">{{ formatDate(item.DTPOSTED) }}</span>
        </template>

        <!-- Description column: show notes as subtitle when set -->
        <template #item.MEMO="{ item }">
          <div>
            <div class="text-body-2">{{ item.MEMO || item.NAME || '—' }}</div>
            <div v-if="item.notes" class="text-caption text-medium-emphasis text-truncate">
              {{ item.notes }}
            </div>
          </div>
        </template>

        <!-- Amount column -->
        <template #item.TRNAMT="{ item }">
          <span
            class="font-weight-medium"
            :class="item.TRNAMT >= 0 ? 'text-success' : 'text-error'"
          >
            {{ item.TRNAMT >= 0 ? '+' : '' }}{{ formatCurrency(Math.abs(item.TRNAMT)) }}
          </span>
        </template>

        <!-- Type column -->
        <template #item.transactionType="{ item }">
          <v-chip :color="typeColor(item.transactionType)" variant="tonal" size="x-small">
            {{ item.transactionType || item.TRNTYPE || '—' }}
          </v-chip>
        </template>

        <!-- Category column (inline edit) -->
        <template #item.category="{ item }">
          <div class="d-flex align-center gap-1">
            <v-chip
              v-if="item.splitCategory1 || item.splitCategory2"
              color="info"
              variant="tonal"
              size="x-small"
            >
              Split
            </v-chip>
            <v-chip v-else-if="item.category" color="secondary" variant="tonal" size="x-small">
              {{ item.category }}
            </v-chip>
            <span v-else class="text-disabled text-caption">Uncategorized</span>

            <v-btn
              v-if="!item.splitCategory1 && !item.splitCategory2"
              icon="mdi-pencil-outline"
              variant="text"
              size="x-small"
              density="compact"
              class="ml-1"
              @click="openEditCategory(item)"
            />
          </div>
        </template>

        <!-- Account column -->
        <template #item.ACCTID="{ item }">
          <span class="text-caption text-medium-emphasis">*{{ item.ACCTID }}</span>
        </template>

        <!-- Actions column -->
        <template #item.actions="{ item }">
          <div class="d-flex align-center justify-end">
            <v-btn
              :icon="item.notes ? 'mdi-note-text' : 'mdi-note-outline'"
              variant="text"
              size="small"
              :color="item.notes ? 'warning' : 'default'"
              density="compact"
              class="mr-1"
              @click="openNotesDialog(item)"
            />
            <v-btn
              icon="mdi-call-split"
              variant="text"
              size="small"
              color="primary"
              density="compact"
              class="mr-1"
              @click="openSplitDialog(item)"
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

        <!-- Expanded Row for Splits -->
        <template #expanded-row="{ columns, item }">
          <tr v-if="item.splitCategory1 || item.splitCategory2">
            <td :colspan="columns.length" class="pa-4 bg-surface-light">
              <div class="text-caption text-uppercase text-medium-emphasis mb-2 font-weight-bold">
                Split Details
              </div>
              <v-table density="compact" class="bg-transparent">
                <tbody>
                  <tr v-if="item.splitCategory1 || item.splitAmount1">
                    <td class="pl-0 text-body-2">
                      <v-chip color="secondary" variant="tonal" size="x-small">
                        {{ item.splitCategory1 || 'Uncategorized' }}
                      </v-chip>
                    </td>
                    <td class="text-body-2 font-weight-medium">
                      {{ formatCurrency(Math.abs(item.splitAmount1 || 0)) }}
                    </td>
                  </tr>
                  <tr v-if="item.splitCategory2 || item.splitAmount2">
                    <td class="pl-0 text-body-2">
                      <v-chip color="secondary" variant="tonal" size="x-small">
                        {{ item.splitCategory2 || 'Uncategorized' }}
                      </v-chip>
                    </td>
                    <td class="text-body-2 font-weight-medium">
                      {{ formatCurrency(Math.abs(item.splitAmount2 || 0)) }}
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </td>
          </tr>
        </template>

        <!-- Loading skeleton -->
        <template #loading>
          <v-skeleton-loader type="table-row@8" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Edit Category Dialog -->
    <v-dialog v-model="editCategoryDialog" max-width="420">
      <v-card rounded>
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-3">
              <v-icon color="primary" size="20">mdi-tag-outline</v-icon>
              <span class="text-h6 font-weight-bold">Edit Category</span>
            </div>
            <v-btn
              icon="mdi-close"
              variant="text"
              density="compact"
              @click="editCategoryDialog = false"
            />
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <div class="text-body-2 text-medium-emphasis mb-4 text-truncate">
            {{ editTarget?.MEMO || editTarget?.NAME || editTarget?.FITID }}
          </div>
          <v-text-field
            v-model="editCategoryValue"
            label="Category"
            variant="solo"
            inset
            density="comfortable"
            hide-details
            autofocus
            clearable
            @keyup.enter="saveCategory"
          />
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="editCategoryDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="store.loading" @click="saveCategory">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Split Transaction Dialog -->
    <v-dialog v-model="splitDialog" max-width="500" persistent>
      <v-card rounded>
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-3">
              <v-icon color="primary" size="20">mdi-call-split</v-icon>
              <span class="text-h6 font-weight-bold">Split Transaction</span>
            </div>
            <v-btn icon="mdi-close" variant="text" density="compact" @click="splitDialog = false" />
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <div
            class="d-flex align-center justify-space-between mb-6 pa-4 bg-surface-light rounded-lg"
          >
            <div>
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">
                Total Amount
              </div>
              <div class="text-body-1 font-weight-bold">{{ formatCurrency(splitTotal) }}</div>
            </div>
            <div class="text-right">
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">
                Remaining
              </div>
              <div
                class="text-body-1 font-weight-bold"
                :class="isSplitValid ? 'text-success' : 'text-error'"
              >
                {{ formatCurrency(Math.abs(splitRemaining)) }}
              </div>
            </div>
          </div>

          <div class="text-body-2 text-medium-emphasis mb-3">
            Split into exactly two categories:
          </div>

          <!-- Split 1 -->
          <div class="d-flex align-start gap-3 mb-3">
            <v-text-field
              v-model="splitState.category1"
              label="Category"
              variant="solo"
              inset
              density="compact"
              hide-details
              class="flex-grow-1"
            />
            <v-text-field
              v-model.number="splitState.amount1"
              label="Amount"
              type="number"
              variant="solo"
              inset
              density="compact"
              hide-details
              prefix="$"
            />
          </div>

          <!-- Split 2 -->
          <div class="d-flex align-start gap-3">
            <v-text-field
              v-model="splitState.category2"
              label="Category"
              variant="solo"
              inset
              density="compact"
              hide-details
              class="flex-grow-1"
            />
            <v-text-field
              v-model.number="splitState.amount2"
              label="Amount"
              type="number"
              variant="solo"
              inset
              density="compact"
              hide-details
              prefix="$"
            />
          </div>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="splitDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="store.loading"
            :disabled="!isSplitValid"
            @click="saveSplits"
          >
            Save Splits
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Notes Dialog -->
    <v-dialog v-model="notesDialog" max-width="460">
      <v-card rounded>
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-3">
              <v-icon color="warning" size="20">mdi-note-text-outline</v-icon>
              <span class="text-h6 font-weight-bold">Notes</span>
            </div>
            <v-btn icon="mdi-close" variant="text" density="compact" @click="notesDialog = false" />
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <div class="text-body-2 text-medium-emphasis mb-4 text-truncate">
            {{ notesTarget?.MEMO || notesTarget?.NAME || notesTarget?.FITID }}
          </div>
          <v-textarea
            v-model="notesValue"
            label="Add a note…"
            variant="solo"
            inset
            rows="4"
            hide-details
            autofocus
            no-resize
          />
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="notesDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="store.loading" @click="saveNotes">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Bulk Category Dialog -->
    <v-dialog v-model="bulkCategoryDialog" max-width="420">
      <v-card rounded>
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-3">
              <v-icon color="primary" size="20">mdi-tag-multiple-outline</v-icon>
              <span class="text-h6 font-weight-bold">Set Category</span>
            </div>
            <v-btn
              icon="mdi-close"
              variant="text"
              density="compact"
              @click="bulkCategoryDialog = false"
            />
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <div class="text-body-2 text-medium-emphasis mb-4">
            Apply to <strong>{{ selectedRows.length }}</strong> selected transaction{{
              selectedRows.length === 1 ? '' : 's'
            }}.
          </div>
          <v-combobox
            v-model="bulkCategoryValue"
            :items="allCategoryNames"
            label="Category"
            variant="solo"
            inset
            density="comfortable"
            hide-details
            autofocus
            clearable
          />
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="bulkCategoryDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="store.loading" @click="saveBulkCategory">
            Apply
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card rounded>
        <v-card-title class="text-h6 pa-6 pb-2">Delete Transaction</v-card-title>
        <v-card-text class="pa-6 pt-2 text-body-2 text-medium-emphasis">
          Permanently delete
          <strong>{{ deleteTarget?.MEMO || deleteTarget?.NAME || deleteTarget?.FITID }}</strong
          >? This action cannot be undone.
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
import { useUserTransactionsStore } from '../stores/userTransactions'
import { useUserAccountsStore } from '../stores/userAccounts'
import { useUserSettingsStore } from '../stores/userSettings'
import { useUserCategoriesStore } from '../stores/userCategories'

const store = useUserTransactionsStore()
const accountsStore = useUserAccountsStore()
const settingsStore = useUserSettingsStore()
const categoriesStore = useUserCategoriesStore()

const allCategoryNames = computed(() => categoriesStore.categories.map((c) => c.name))

// ── Bulk Recategorization ─────────────────────────────────────────────────────
const selectedRows = ref([])
const bulkCategoryDialog = ref(false)
const bulkCategoryValue = ref('')

function openBulkCategoryDialog() {
  bulkCategoryValue.value = ''
  bulkCategoryDialog.value = true
}

async function saveBulkCategory() {
  const category = (bulkCategoryValue.value || '').trim() || null
  await Promise.all(
    selectedRows.value.map((item) => store.editTransaction(item.FITID, { category }))
  )
  bulkCategoryDialog.value = false
  selectedRows.value = []
}

// ── Import dialog ────────────────────────────────────────────────────────────
const importDialog = ref(false)
const selectedFile = ref(null)
const lastImported = ref('')

async function handleImport() {
  if (!selectedFile.value) return
  const text = await selectedFile.value.text()

  await accountsStore.importAccountFromOfx(text)
  if (accountsStore.error) return

  const result = await store.importTransactionsFromOfx(text)
  if (result) {
    lastImported.value = `${result.inserted} new · ${result.skipped} skipped`
    selectedFile.value = null
    importDialog.value = false
    await Promise.all([accountsStore.fetchAccounts(), store.fetchMonthsWithData()])
    setTimeout(() => {
      lastImported.value = ''
    }, 5000)
  }
}

// ── On mount ──────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([accountsStore.fetchAccounts(), store.fetchMonthsWithData()])
  const selectedMonth = settingsStore.selectedMonth
  pickerYear.value = parseInt(selectedMonth.slice(0, 4)) || new Date().getFullYear()
  selectedPeriodKey.value = selectedMonth
  await store.fetchTransactionsByMonth(selectedMonth)
})

// ── Date picker ──────────────────────────────────────────────────────────────
const granularity = ref('month')
const pickerMenu = ref(false)
const pickerYear = ref(new Date().getFullYear())

// Tracks what is currently selected as a display key:
// month → 'YYYYMM', quarter → 'YYYY-QN', year → 'YYYY'
const selectedPeriodKey = ref('')

const monthOptions = computed(() =>
  Array.from({ length: 12 }, (_, i) => ({
    label: new Date(pickerYear.value, i, 1).toLocaleDateString('en-US', { month: 'short' }),
    value: `${pickerYear.value}${String(i + 1).padStart(2, '0')}`
  }))
)

const quarterOptions = computed(() =>
  [1, 2, 3, 4].map((q) => {
    const startM = (q - 1) * 3
    const months = [0, 1, 2].map((i) =>
      new Date(pickerYear.value, startM + i, 1).toLocaleDateString('en-US', { month: 'short' })
    )
    return {
      label: `Q${q}`,
      months: months.join(' · '),
      value: `${pickerYear.value}-Q${q}`
    }
  })
)

function monthHasData(yyyymm) {
  return store.monthsWithData.includes(yyyymm)
}

function changeYear(dir) {
  pickerYear.value += dir
}

// Months (yyyymm strings) for the active selection — drives the table
const activePeriodMonths = computed(() => {
  const key = selectedPeriodKey.value
  if (!key) return []
  if (granularity.value === 'month') return [key]
  if (granularity.value === 'quarter') {
    const y = parseInt(key.slice(0, 4))
    const q = parseInt(key.slice(-1)) - 1 // 0-based quarter
    const startM = q * 3
    return [0, 1, 2].map((i) => `${y}${String(startM + i + 1).padStart(2, '0')}`)
  }
  // annual
  const y = parseInt(key)
  return Array.from({ length: 12 }, (_, i) => `${y}${String(i + 1).padStart(2, '0')}`)
})

const pickerLabel = computed(() => {
  const key = selectedPeriodKey.value
  if (!key) return 'Pick period'
  if (granularity.value === 'quarter') return key.replace('-', ' ')
  if (granularity.value === 'year') return key
  const y = key.slice(0, 4)
  const m = parseInt(key.slice(4, 6)) - 1
  return new Date(Number(y), m, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
})

function selectMonth(yyyymm) {
  selectedPeriodKey.value = yyyymm
  applyPeriod()
  pickerMenu.value = false
}

function selectQuarter(key) {
  selectedPeriodKey.value = key
  applyPeriod()
  pickerMenu.value = false
}

function selectYear(y) {
  selectedPeriodKey.value = String(y)
  applyPeriod()
  pickerMenu.value = false
}

function onGranularityTab() {
  selectedPeriodKey.value = ''
}

async function applyPeriod() {
  const months = activePeriodMonths.value
  const toFetch = months.filter((m) => store.monthsWithData.includes(m))
  await store.fetchTransactionsForPeriod(toFetch)
}

// ── Filters ───────────────────────────────────────────────────────────────────
const search = ref('')
const filterAccount = ref(null)
const filterType = ref(null)

const accountOptions = computed(() =>
  accountsStore.accounts.map((a) => ({
    label: `${a.displayName || a.ACCTTYPE || 'Account'} (*${a.ACCTID})`,
    value: a.ACCTID
  }))
)

const typeOptions = [
  { label: 'Credit', value: 'CREDIT' }, // Generic credit
  { label: 'Debit', value: 'DEBIT' }, // Generic debit
  { label: 'Check', value: 'CHECK' }, // Written check
  { label: 'Deposit', value: 'DEP' }, // Deposit
  { label: 'ATM', value: 'ATM' }, // ATM debit/credit
  { label: 'Purchases', value: 'POS' }, // Point-of-sale
  { label: 'Transfer', value: 'XFER' }, // Account transfer
  { label: 'Payment', value: 'PAYMENT' }, // Electronic payment
  { label: 'Cash', value: 'CASH' }, // Cash withdrawal
  { label: 'Direct Dep', value: 'DIRECTDEP' }, // Direct deposit
  { label: 'Direct Debit', value: 'DIRECTDEBIT' }, // Merchant-initiated debit
  { label: 'Repeat Payment', value: 'REPEATPMT' }, // Standing order / repeat payment
  { label: 'Interest', value: 'INT' }, // Interest earned or charged
  { label: 'Dividend', value: 'DIV' }, // Dividend
  { label: 'Fee', value: 'FEE' }, // Financial institution fee
  { label: 'Service Charge', value: 'SRVCHG' }, // Service charge
  { label: 'Other', value: 'OTHER' } // Catch-all
]

// ── Table headers ─────────────────────────────────────────────────────────────
const headers = [
  { title: 'Date', key: 'DTPOSTED', width: '120px', sortable: true },
  { title: 'Description', key: 'MEMO', sortable: false },
  { title: 'Amount', key: 'TRNAMT', width: '130px', sortable: true, align: 'end' },
  { title: 'Type', key: 'transactionType', width: '120px', sortable: true },
  { title: 'Category', key: 'category', width: '180px', sortable: true },
  { title: 'Account', key: 'ACCTID', width: '110px', sortable: true },
  { title: '', key: 'actions', width: '100px', sortable: false, align: 'center' }
]

// ── Filtered data ─────────────────────────────────────────────────────────────
const filteredTransactions = computed(() => {
  let rows = store.transactions

  // When quarter/year is selected, filter client-side to only rows in the period
  if (activePeriodMonths.value.length > 1) {
    rows = rows.filter((t) => {
      const s = String(t.DTPOSTED || '')
      const ym = s.slice(0, 6)
      return activePeriodMonths.value.includes(ym)
    })
  }

  if (filterAccount.value) {
    rows = rows.filter((t) => t.ACCTID === filterAccount.value)
  }
  if (filterType.value) {
    rows = rows.filter(
      (t) => (t.transactionType || t.TRNTYPE || '').toUpperCase() === filterType.value
    )
  }
  return rows
})

// ── Summary totals ────────────────────────────────────────────────────────────
const totalCredit = computed(() =>
  filteredTransactions.value.filter((t) => t.TRNAMT >= 0).reduce((s, t) => s + Number(t.TRNAMT), 0)
)

const totalDebit = computed(() =>
  filteredTransactions.value
    .filter((t) => t.TRNAMT < 0)
    .reduce((s, t) => s + Math.abs(Number(t.TRNAMT)), 0)
)

// ── Formatters ────────────────────────────────────────────────────────────────

function formatDate(raw) {
  if (!raw) return '—'
  // raw may be '20260501120000' or '202605' or ISO string
  const s = String(raw)
  const year = s.slice(0, 4)
  const month = s.slice(4, 6)
  const day = s.slice(6, 8) || '01'
  if (!year || !month) return raw
  return new Date(`${year}-${month}-${day}`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function typeColor(type) {
  return (
    {
      CREDIT: 'success',
      DEBIT: 'error',
      CHECK: 'warning',
      DEP: 'success',
      POS: 'error',
      ATM: 'warning'
    }[String(type || '').toUpperCase()] || 'secondary'
  )
}

// ── Edit Category ─────────────────────────────────────────────────────────────
const editCategoryDialog = ref(false)
const editTarget = ref(null)
const editCategoryValue = ref('')

function openEditCategory(item) {
  editTarget.value = item
  editCategoryValue.value = item.category || ''
  editCategoryDialog.value = true
}

async function saveCategory() {
  if (!editTarget.value) return
  await store.editTransaction(editTarget.value.FITID, {
    category: editCategoryValue.value.trim() || null
  })
  editCategoryDialog.value = false
  editTarget.value = null
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
  await store.removeTransaction(deleteTarget.value.FITID)
  deleteDialog.value = false
  deleteTarget.value = null
}

// ── Notes ─────────────────────────────────────────────────────────────────────
const notesDialog = ref(false)
const notesTarget = ref(null)
const notesValue = ref('')

function openNotesDialog(item) {
  notesTarget.value = item
  notesValue.value = item.notes || ''
  notesDialog.value = true
}

async function saveNotes() {
  if (!notesTarget.value) return
  await store.editTransaction(notesTarget.value.FITID, {
    notes: notesValue.value.trim() || null
  })
  notesDialog.value = false
  notesTarget.value = null
}

// ── Split Transactions ────────────────────────────────────────────────────────
const splitDialog = ref(false)
const splitTarget = ref(null)
const expandedRows = ref([])
const splitState = ref({
  category1: '',
  amount1: 0,
  category2: '',
  amount2: 0
})

function openSplitDialog(item) {
  splitTarget.value = item
  splitState.value = {
    category1: item.splitCategory1 || '',
    amount1: item.splitAmount1
      ? Math.abs(Number(item.splitAmount1))
      : Math.abs(Number(item.TRNAMT)),
    category2: item.splitCategory2 || '',
    amount2: item.splitAmount2 ? Math.abs(Number(item.splitAmount2)) : 0
  }
  splitDialog.value = true
}

const splitTotal = computed(() => {
  if (!splitTarget.value) return 0
  return Math.abs(Number(splitTarget.value.TRNAMT))
})

const splitSum = computed(() => {
  return (Number(splitState.value.amount1) || 0) + (Number(splitState.value.amount2) || 0)
})

const splitRemaining = computed(() => {
  return splitTotal.value - splitSum.value
})

const isSplitValid = computed(() => {
  return Math.abs(splitRemaining.value) < 0.001
})

async function saveSplits() {
  if (!splitTarget.value || !isSplitValid.value) return

  const sign = Math.sign(Number(splitTarget.value.TRNAMT)) || 1

  await store.editTransaction(splitTarget.value.FITID, {
    splitCategory1: splitState.value.category1 || null,
    splitAmount1: splitState.value.amount1 ? Number(splitState.value.amount1) * sign : null,
    splitCategory2: splitState.value.category2 || null,
    splitAmount2: splitState.value.amount2 ? Number(splitState.value.amount2) * sign : null
  })

  splitDialog.value = false
  splitTarget.value = null
}
</script>
