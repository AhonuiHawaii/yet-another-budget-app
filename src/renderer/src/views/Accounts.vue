<template>
  <v-container fluid class="pa-4">
    <!-- Add Account Button -->
    <div class="mb-8 d-flex justify-center align-center gap-2">
      <v-btn-group variant="flat" density="comfortable" rounded="sm" divided>
        <v-btn prepend-icon="mdi-plus" @click="importDialog = true">Add Account</v-btn>
        <v-btn prepend-icon="mdi-pencil-plus-outline" @click="manualDialog = true"
          >Add Manual Loan</v-btn
        >
      </v-btn-group>

      <v-slide-x-transition>
        <v-chip
          v-if="lastImported"
          color="success"
          variant="tonal"
          prepend-icon="mdi-check-circle-outline"
          size="small"
          class="ml-3"
        >
          Imported {{ lastImported }}
        </v-chip>
      </v-slide-x-transition>
    </div>

    <!-- Import Account Modal -->
    <v-dialog v-model="importDialog" max-width="500">
      <v-card rounded="sm">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-3">
              <v-icon color="primary" size="22">mdi-file-import-outline</v-icon>
              <span class="text-h6 font-weight-bold">Import Account</span>
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
            Select an OFX or QFX file exported from your bank.
          </p>

          <v-file-input
            v-model="selectedFile"
            accept=".ofx,.qfx"
            label="Choose OFX / QFX file"
            prepend-icon=""
            prepend-inner-icon="mdi-folder-open-outline"
            variant="solo-filled"
            density="comfortable"
            rounded="sm"
            hide-details="auto"
            :error-messages="store.error ? [store.error] : []"
            @update:model-value="store.clearError()"
          />
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="importDialog = false">Cancel</v-btn>
          <v-btn
            variant="flat"
            rounded="sm"
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

    <!-- Add Manual Loan Modal -->
    <v-dialog v-model="manualDialog" max-width="500">
      <v-card rounded="sm">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-3">
              <v-icon color="primary" size="22">mdi-pencil-plus-outline</v-icon>
              <span class="text-h6 font-weight-bold">Add Manual Loan</span>
            </div>
            <v-btn
              icon="mdi-close"
              variant="text"
              density="compact"
              @click="manualDialog = false"
            />
          </div>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <v-text-field
            v-model="manualForm.displayName"
            label="Account name"
            placeholder="e.g. Affirm — Sofa"
            variant="solo-filled"
            density="comfortable"
            rounded="sm"
            hide-details="auto"
            class="mb-4"
            autofocus
          />
          <v-text-field
            v-model="manualForm.ORG"
            label="Lender"
            placeholder="e.g. Affirm"
            variant="solo-filled"
            density="comfortable"
            rounded="sm"
            hide-details="auto"
            class="mb-4"
          />
          <v-select
            v-model="manualForm.ACCTTYPE"
            :items="manualAccountTypes"
            label="Type"
            variant="solo-filled"
            density="comfortable"
            rounded="sm"
            hide-details="auto"
            class="mb-4"
          />
          <v-text-field
            v-model.number="manualForm.interestRate"
            label="Interest Rate (%)"
            type="number"
            variant="solo-filled"
            density="comfortable"
            rounded="sm"
            hide-details="auto"
            class="mb-4"
          />
          <v-text-field
            v-model="manualForm.startingBalance"
            label="Current Balance Owed"
            type="number"
            step="0.01"
            placeholder="0.00"
            variant="solo-filled"
            density="comfortable"
            rounded="sm"
            hide-details="auto"
            class="mb-4"
            prefix="$"
          />
          <template v-if="isVariableDueDate({ ACCTTYPE: manualForm.ACCTTYPE })">
            <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2">
              Payment Frequency
            </div>
            <v-btn-toggle
              v-model="manualForm.paymentFrequency"
              mandatory
              divided
              variant="flat"
              density="compact"
              color="primary"
              class="mb-4"
            >
              <v-btn value="Weekly" size="small">Weekly</v-btn>
              <v-btn value="BiWeekly" size="small">Bi-Weekly</v-btn>
              <v-btn value="Monthly" size="small">Monthly</v-btn>
            </v-btn-toggle>
            <!-- Monthly: day-of-month picker -->
            <v-menu
              v-if="manualForm.paymentFrequency === 'Monthly'"
              :close-on-content-click="false"
              location="bottom end"
            >
              <template #activator="{ props }">
                <v-text-field
                  v-bind="props"
                  :model-value="manualForm.dueDate ? `Day ${manualForm.dueDate}` : ''"
                  label="Due Date"
                  readonly
                  clearable
                  variant="solo-filled"
                  density="comfortable"
                  rounded="sm"
                  hide-details="auto"
                  append-inner-icon="mdi-calendar"
                  @click:clear="manualForm.dueDate = null"
                />
              </template>
              <v-date-picker
                :model-value="dueDateToPickerValue(manualForm.dueDate)"
                color="primary"
                hide-header
                show-adjacent-months
                @update:model-value="
                  (val) => {
                    manualForm.dueDate = val
                      ? new Date(
                          new Date(val).getTime() - new Date(val).getTimezoneOffset() * 60000
                        ).getDate()
                      : null
                  }
                "
              />
            </v-menu>
            <!-- Weekly / BiWeekly: start date + payment count -->
            <template v-else>
              <v-menu :close-on-content-click="false" location="bottom end" class="mb-4">
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="formatIsoDisplay(manualForm.paymentStartDate)"
                    label="First Payment Date"
                    readonly
                    clearable
                    variant="solo-filled"
                    density="comfortable"
                    rounded="sm"
                    hide-details="auto"
                    append-inner-icon="mdi-calendar"
                    class="mb-4"
                    @click:clear="manualForm.paymentStartDate = null"
                  />
                </template>
                <v-date-picker
                  :model-value="isoToPickerValue(manualForm.paymentStartDate)"
                  color="primary"
                  hide-header
                  show-adjacent-months
                  @update:model-value="
                    (val) => {
                      manualForm.paymentStartDate = pickerValToIso(val)
                    }
                  "
                />
              </v-menu>
              <v-text-field
                v-model.number="manualForm.paymentCount"
                label="Number of Payments"
                type="number"
                min="1"
                variant="solo-filled"
                density="comfortable"
                rounded="sm"
                hide-details="auto"
              />
            </template>
          </template>
          <v-menu v-else :close-on-content-click="false" location="bottom end">
            <template #activator="{ props }">
              <v-text-field
                v-bind="props"
                :model-value="manualForm.dueDate ? `Day ${manualForm.dueDate}` : ''"
                label="Due Date"
                readonly
                clearable
                variant="solo-filled"
                density="comfortable"
                rounded="sm"
                hide-details="auto"
                append-inner-icon="mdi-calendar"
                @click:clear="manualForm.dueDate = null"
              />
            </template>
            <v-date-picker
              :model-value="dueDateToPickerValue(manualForm.dueDate)"
              color="primary"
              hide-header
              show-adjacent-months
              @update:model-value="
                (val) => {
                  manualForm.dueDate = val
                    ? new Date(
                        new Date(val).getTime() - new Date(val).getTimezoneOffset() * 60000
                      ).getDate()
                    : null
                }
              "
            />
          </v-menu>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="manualDialog = false">Cancel</v-btn>
          <v-btn
            variant="flat"
            rounded="sm"
            :loading="store.loading"
            :disabled="!manualForm.displayName"
            @click="saveManualAccount"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Accounts List -->
    <div>
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="text-h6 font-weight-bold">Linked Accounts</div>
      </div>

      <!-- Empty State -->
      <v-card v-if="store.accounts.length === 0" rounded="sm" elevation="2">
        <v-card-text class="pa-12 text-center">
          <v-icon size="60" class="mb-4 text-disabled">mdi-bank-off-outline</v-icon>
          <div class="text-h6 font-weight-medium mb-2">No accounts yet</div>
          <div class="text-body-2 text-medium-emphasis">
            Import an OFX or QFX file from your bank to get started.
          </div>
        </v-card-text>
      </v-card>

      <!-- Grouped Account List -->
      <template v-else>
        <div v-for="(accounts, bank) in groupedAccounts" :key="bank" class="mb-4">
          <!-- Bank subheader -->
          <div class="d-flex align-center justify-space-between mb-1">
            <div class="d-flex align-center gap-2">
              <v-icon size="16" color="primary">mdi-bank-outline</v-icon>
              <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis">
                {{ bank }}
              </span>
            </div>
            <v-btn
              icon="mdi-pencil-outline"
              variant="text"
              size="small"
              density="compact"
              @click="openEditBank(bank)"
            />
          </div>

          <v-card rounded="sm" elevation="2">
            <v-list lines="two" class="pa-0">
              <template v-for="(account, i) in accounts" :key="account.ACCTID">
                <v-list-item class="py-3">
                  <template #prepend>
                    <v-avatar
                      :color="accountTypeColor(account.ACCTTYPE)"
                      variant="tonal"
                      size="36"
                      class="mr-1"
                    >
                      <v-icon :icon="accountTypeIcon(account.ACCTTYPE)" size="18" />
                    </v-avatar>
                  </template>

                  <v-list-item-title class="font-weight-medium">
                    {{ account.displayName || account.ACCTTYPE || 'Unknown' }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    <span>*{{ account.ACCTID || '----' }}</span>
                    <span
                      v-if="accountBalance(account) !== null"
                      :class="[
                        'ml-3 font-weight-medium',
                        accountBalance(account) >= 0 ? 'text-success' : 'text-error'
                      ]"
                    >
                      {{ formatBalance(accountBalance(account)) }}
                    </span>
                    <span v-else class="ml-3 text-disabled text-caption">no balance set</span>
                  </v-list-item-subtitle>

                  <template #append>
                    <v-btn
                      icon="mdi-pencil-outline"
                      variant="text"
                      size="small"
                      density="compact"
                      @click="openEditName(account)"
                    />
                    <v-btn
                      icon="mdi-delete-outline"
                      variant="text"
                      size="small"
                      color="error"
                      density="compact"
                      @click="confirmRemove(account)"
                    />
                  </template>
                </v-list-item>

                <v-divider v-if="i < accounts.length - 1" />
              </template>
            </v-list>
          </v-card>
        </div>
      </template>
    </div>

    <!-- Edit Bank Name Modal -->
    <v-dialog v-model="editBankDialog" max-width="400">
      <v-card rounded="sm">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-3">
              <v-icon color="primary" size="20">mdi-domain</v-icon>
              <span class="text-h6 font-weight-bold">Edit Bank Name</span>
            </div>
            <v-btn
              icon="mdi-close"
              variant="text"
              density="compact"
              @click="editBankDialog = false"
            />
          </div>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <v-text-field
            v-model="editBankValue"
            label="Bank name"
            variant="solo-filled"
            density="comfortable"
            rounded="sm"
            hide-details
            autofocus
            @keyup.enter="saveEditBank"
          />
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="editBankDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" rounded="sm" @click="saveEditBank">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Account Modal -->
    <v-dialog v-model="editNameDialog" max-width="400">
      <v-card rounded="sm">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-3">
              <v-icon color="primary" size="20">mdi-pencil-outline</v-icon>
              <span class="text-h6 font-weight-bold">Edit Account</span>
            </div>
            <v-btn
              icon="mdi-close"
              variant="text"
              density="compact"
              @click="editNameDialog = false"
            />
          </div>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <v-text-field
            v-model="editNameValue"
            label="Account name"
            variant="solo-filled"
            density="comfortable"
            rounded="sm"
            hide-details="auto"
            class="mb-4"
            autofocus
            @keyup.enter="saveEditName"
          />
          <v-text-field
            v-model="editStartingBalance"
            label="Starting Balance"
            type="number"
            step="0.01"
            placeholder="0.00"
            variant="solo-filled"
            density="comfortable"
            rounded="sm"
            hide-details="auto"
            class="mb-4"
            prefix="$"
            hint="Balance before any tracked transactions. Set this so the current balance is accurate."
            @keyup.enter="saveEditName"
          />
          <v-select
            v-model="editAccountCategory"
            :items="accountRoleItems"
            item-title="title"
            item-value="value"
            label="Account Role"
            variant="solo-filled"
            density="comfortable"
            rounded="sm"
            hide-details="auto"
            class="mb-4"
            hint="Override how this account is classified in Net Worth. 'Default' uses the account type."
          />
          <template v-if="isLoanAccount(editNameTarget)">
            <v-text-field
              v-model.number="editInterestRate"
              label="Interest Rate (%)"
              type="number"
              variant="solo-filled"
              density="comfortable"
              rounded="sm"
              hide-details="auto"
              class="mb-4"
              @keyup.enter="saveEditName"
            />
            <template v-if="isVariableDueDate(editNameTarget)">
              <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2">
                Payment Frequency
              </div>
              <v-btn-toggle
                v-model="editPaymentFrequency"
                mandatory
                divided
                variant="outlined"
                density="compact"
                color="primary"
                class="mb-4"
              >
                <v-btn value="Weekly" size="small">Weekly</v-btn>
                <v-btn value="BiWeekly" size="small">Bi-Weekly</v-btn>
                <v-btn value="Monthly" size="small">Monthly</v-btn>
              </v-btn-toggle>
              <!-- Monthly: day-of-month picker -->
              <v-menu
                v-if="editPaymentFrequency === 'Monthly'"
                :close-on-content-click="false"
                location="bottom end"
              >
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="editDueDate ? `Day ${editDueDate}` : ''"
                    label="Due Date"
                    readonly
                    clearable
                    variant="solo-filled"
                    density="comfortable"
                    rounded="sm"
                    hide-details="auto"
                    append-inner-icon="mdi-calendar"
                    @click:clear="editDueDate = null"
                  />
                </template>
                <v-date-picker
                  :model-value="dueDateToPickerValue(editDueDate)"
                  color="primary"
                  hide-header
                  show-adjacent-months
                  @update:model-value="
                    (val) => {
                      editDueDate = val
                        ? new Date(
                            new Date(val).getTime() - new Date(val).getTimezoneOffset() * 60000
                          ).getDate()
                        : null
                    }
                  "
                />
              </v-menu>
              <!-- Weekly / BiWeekly: start date + payment count -->
              <template v-else>
                <v-menu :close-on-content-click="false" location="bottom end">
                  <template #activator="{ props }">
                    <v-text-field
                      v-bind="props"
                      :model-value="formatIsoDisplay(editPaymentStartDate)"
                      label="First Payment Date"
                      readonly
                      clearable
                      variant="solo-filled"
                      density="comfortable"
                      rounded="sm"
                      hide-details="auto"
                      append-inner-icon="mdi-calendar"
                      class="mb-4"
                      @click:clear="editPaymentStartDate = null"
                    />
                  </template>
                  <v-date-picker
                    :model-value="isoToPickerValue(editPaymentStartDate)"
                    color="primary"
                    hide-header
                    show-adjacent-months
                    @update:model-value="
                      (val) => {
                        editPaymentStartDate = pickerValToIso(val)
                      }
                    "
                  />
                </v-menu>
                <v-text-field
                  v-model.number="editPaymentCount"
                  label="Number of Payments"
                  type="number"
                  min="1"
                  variant="solo-filled"
                  density="comfortable"
                  rounded="sm"
                  hide-details="auto"
                />
              </template>
            </template>
            <v-menu v-else :close-on-content-click="false" location="bottom end">
              <template #activator="{ props }">
                <v-text-field
                  v-bind="props"
                  :model-value="editDueDate ? `Day ${editDueDate}` : ''"
                  label="Due Date"
                  readonly
                  clearable
                  variant="solo-filled"
                  density="comfortable"
                  rounded="sm"
                  hide-details="auto"
                  append-inner-icon="mdi-calendar"
                  @click:clear="editDueDate = null"
                />
              </template>
              <v-date-picker
                :model-value="dueDateToPickerValue(editDueDate)"
                color="primary"
                hide-header
                show-adjacent-months
                @update:model-value="
                  (val) => {
                    editDueDate = val
                      ? new Date(
                          new Date(val).getTime() - new Date(val).getTimezoneOffset() * 60000
                        ).getDate()
                      : null
                  }
                "
              />
            </v-menu>
          </template>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-alert
            v-if="store.error"
            type="error"
            density="compact"
            class="mb-2 text-caption"
            rounded="sm"
          >
            {{ store.error }}
          </v-alert>
          <v-spacer />
          <v-btn variant="text" @click="editNameDialog = false">Cancel</v-btn>
          <v-btn variant="flat" rounded="sm" :loading="store.loading" @click="saveEditName">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Remove Confirmation Dialog -->
    <v-dialog v-model="removeDialog" max-width="400" rounded="sm">
      <v-card rounded="sm">
        <v-card-title class="text-h6 pa-6 pb-4">Remove Account</v-card-title>
        <v-card-text class="pa-6 pt-0 text-body-2 text-medium-emphasis">
          Remove <strong>{{ pendingRemove?.ORG || 'this account' }}</strong> ending in
          <strong>{{ pendingRemove?.ACCTID }}</strong
          >? This only removes the account from this app — no bank data is affected.
        </v-card-text>
        <v-card-actions class="pa-6 pt-0 gap-2">
          <v-spacer />
          <v-btn variant="text" @click="removeDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" rounded="sm" @click="doRemove">Remove</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  useUserAccountsStore,
  accountTypeColor,
  accountTypeIcon,
  formatCurrency,
  resolveIsAsset
} from '../stores/userAccounts'
import { useUserTransactionsStore } from '../stores/userTransactions'

const store = useUserAccountsStore()
const txStore = useUserTransactionsStore()

const isVariableDueDate = (account) => isLoanAccount(account)

function dueDateToPickerValue(day) {
  if (!day) return null
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), Number(day), 12, 0, 0)
}

function isoToPickerValue(isoStr) {
  if (!isoStr) return null
  const d = new Date(isoStr + 'T12:00:00')
  return isNaN(d.getTime()) ? null : d
}

function formatIsoDisplay(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr + 'T12:00:00')
  if (isNaN(d.getTime())) return isoStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function pickerValToIso(val) {
  if (!val) return null
  const d = new Date(val)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}

const isLoanAccount = (account) => {
  const type = String(account?.ACCTTYPE || '').toLowerCase()
  return (
    type.includes('credit') ||
    type.includes('loan') ||
    type.includes('mortgage') ||
    type.includes('buy now pay later') ||
    type.includes('medical debt') ||
    type === 'other'
  )
}

onMounted(() => {
  store.fetchAccounts()
  txStore.fetchAccountSummary()
})

// Map of masked ACCTID → transaction sum for all stored transactions
const txSummaryMap = computed(() => {
  const map = {}
  for (const s of txStore.accountSummary) {
    map[s.ACCTID] = s.total ?? 0
  }
  return map
})

function accountBalance(account) {
  if (account.startingBalance === null || account.startingBalance === undefined) return null
  const txTotal = txSummaryMap.value[account.ACCTID] ?? 0
  return account.startingBalance + txTotal
}

function formatBalance(amount) {
  if (amount === null || amount === undefined) return null
  return formatCurrency(amount)
}

// Group accounts by institution name (ORG), falling back to 'Unknown Institution'
const groupedAccounts = computed(() => {
  return store.accounts.reduce((groups, account) => {
    const bank = account.ORG || 'Unknown Institution'
    if (!groups[bank]) groups[bank] = []
    groups[bank].push(account)
    return groups
  }, {})
})

const selectedFile = ref(null)
const lastImported = ref('')
const importDialog = ref(false)
const removeDialog = ref(false)
const pendingRemove = ref(null)

// Edit bank name
const editBankDialog = ref(false)
const editBankValue = ref('')
const editBankOldName = ref('')

function openEditBank(bankName) {
  editBankOldName.value = bankName
  editBankValue.value = bankName
  editBankDialog.value = true
}

function saveEditBank() {
  const newName = editBankValue.value.trim()
  if (newName && newName !== editBankOldName.value) {
    store.updateBankName(editBankOldName.value, newName)
  }
  editBankDialog.value = false
}

// Edit account details
const editNameDialog = ref(false)
const editNameTarget = ref(null)
const editNameValue = ref('')
const editInterestRate = ref(0)
const editDueDate = ref(null)
const editPaymentFrequency = ref('Monthly')
const editPaymentStartDate = ref(null)
const editPaymentCount = ref(null)
const editStartingBalance = ref(null)
const editAccountCategory = ref(null) // null | 'asset' | 'liability'

const accountRoleItems = [
  { title: 'Default (auto-detect)', value: null },
  { title: 'Asset (counts toward net worth)', value: 'asset' },
  { title: 'Liability (counts as debt)', value: 'liability' }
]

function openEditName(account) {
  editNameTarget.value = account
  editNameValue.value = account.displayName || account.ACCTTYPE || ''
  editInterestRate.value = account.interestRate || 0
  editDueDate.value = account.dueDate || null
  editPaymentFrequency.value = account.paymentFrequency || 'Monthly'
  editPaymentStartDate.value = account.paymentStartDate || null
  editPaymentCount.value = account.paymentCount || null
  editStartingBalance.value =
    account.startingBalance !== null && account.startingBalance !== undefined
      ? account.startingBalance
      : ''
  editAccountCategory.value = account.accountCategory ?? null
  editNameDialog.value = true
}

async function saveEditName() {
  if (editNameTarget.value) {
    const updates = {
      displayName: editNameValue.value.trim() || editNameTarget.value.ACCTTYPE
    }
    const balVal = parseFloat(editStartingBalance.value)
    updates.startingBalance = isNaN(balVal) ? null : balVal
    updates.accountCategory = editAccountCategory.value ?? null
    if (isLoanAccount(editNameTarget.value)) {
      updates.interestRate = Number(editInterestRate.value) || 0
      if (isVariableDueDate(editNameTarget.value)) {
        updates.paymentFrequency = editPaymentFrequency.value
        updates.dueDate =
          editPaymentFrequency.value === 'Monthly' ? Number(editDueDate.value) || null : null
        updates.paymentStartDate =
          editPaymentFrequency.value !== 'Monthly' ? editPaymentStartDate.value || null : null
        updates.paymentCount =
          Number(editPaymentCount.value) > 0 ? Math.round(Number(editPaymentCount.value)) : null
      } else {
        updates.dueDate = Number(editDueDate.value) || null
      }
    }
    const ok = await store.updateAccount(editNameTarget.value.ACCTID, updates)
    if (!ok) return
    txStore.fetchAccountSummary()
  }
  editNameDialog.value = false
  editNameTarget.value = null
}

// Add manual loan account
const manualDialog = ref(false)
const manualAccountTypes = [
  'Buy Now Pay Later',
  'Personal Loan',
  'Medical Debt',
  'Family / Friend Loan',
  'Other'
]
const emptyManualForm = () => ({
  displayName: '',
  ORG: '',
  ACCTTYPE: 'Buy Now Pay Later',
  interestRate: 0,
  paymentFrequency: 'Monthly',
  dueDate: null,
  paymentStartDate: null,
  paymentCount: null,
  startingBalance: ''
})
const manualForm = ref(emptyManualForm())

async function saveManualAccount() {
  const balVal = parseFloat(manualForm.value.startingBalance)
  const payload = {
    displayName: manualForm.value.displayName.trim(),
    ORG: manualForm.value.ORG.trim() || null,
    ACCTTYPE: manualForm.value.ACCTTYPE,
    interestRate: Number(manualForm.value.interestRate) || 0,
    startingBalance: isNaN(balVal) ? null : balVal,
    paymentFrequency: isVariableDueDate({ ACCTTYPE: manualForm.value.ACCTTYPE })
      ? manualForm.value.paymentFrequency
      : null,
    dueDate:
      isVariableDueDate({ ACCTTYPE: manualForm.value.ACCTTYPE }) &&
      manualForm.value.paymentFrequency === 'Monthly'
        ? Number(manualForm.value.dueDate) || null
        : !isVariableDueDate({ ACCTTYPE: manualForm.value.ACCTTYPE })
          ? Number(manualForm.value.dueDate) || null
          : null,
    paymentStartDate:
      isVariableDueDate({ ACCTTYPE: manualForm.value.ACCTTYPE }) &&
      manualForm.value.paymentFrequency !== 'Monthly'
        ? manualForm.value.paymentStartDate || null
        : null,
    paymentCount:
      Number(manualForm.value.paymentCount) > 0
        ? Math.round(Number(manualForm.value.paymentCount))
        : null
  }
  const created = await store.createManualAccount(payload)
  if (created) {
    manualDialog.value = false
    manualForm.value = emptyManualForm()
  }
}

async function handleImport() {
  if (!selectedFile.value) return

  const file = selectedFile.value
  const text = await file.text()

  const result = await store.importAccountFromOfx(text)

  if (result) {
    lastImported.value = result.ORG ? `${result.ORG} ••••${result.ACCTID}` : `••••${result.ACCTID}`
    selectedFile.value = null
    importDialog.value = false

    // Clear the success badge after 4 s
    setTimeout(() => {
      lastImported.value = ''
    }, 4000)
  }
}

function confirmRemove(account) {
  pendingRemove.value = account
  removeDialog.value = true
}

function doRemove() {
  if (pendingRemove.value) {
    store.removeAccount(pendingRemove.value.ACCTID)
  }
  removeDialog.value = false
  pendingRemove.value = null
}

// accountTypeColor, accountTypeIcon, and formatCurrency are imported from the store.
// resolveIsAsset is used by the template to show the correct colour when an override is active.
</script>
