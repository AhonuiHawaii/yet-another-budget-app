<template>
  <v-container fluid class="pa-6">
    <!-- Add Account Button -->
    <div class="mb-8 d-flex align-center gap-2">
      <v-btn color="primary" rounded="sm" prepend-icon="mdi-plus" @click="importDialog = true">
        Add Account
      </v-btn>
      <v-btn
        color="secondary"
        variant="tonal"
        rounded="sm"
        prepend-icon="mdi-pencil-plus-outline"
        @click="manualDialog = true"
      >
        Add Manual Loan
      </v-btn>

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
            color="primary"
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
          <template v-if="manualForm.ACCTTYPE === 'Buy Now Pay Later'">
            <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2">
              Payment Frequency
            </div>
            <v-btn-toggle
              v-model="manualForm.paymentFrequency"
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
            <v-text-field
              v-if="manualForm.paymentFrequency === 'Monthly'"
              v-model.number="manualForm.dueDate"
              label="Due Date (Day of month)"
              type="number"
              min="1"
              max="31"
              variant="solo-filled"
              density="comfortable"
              rounded="sm"
              hide-details="auto"
            />
          </template>
          <v-text-field
            v-else
            v-model.number="manualForm.dueDate"
            label="Due Date (Day of month)"
            type="number"
            min="1"
            max="31"
            variant="solo-filled"
            density="comfortable"
            rounded="sm"
            hide-details="auto"
          />
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="manualDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
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
        <h2 class="text-h6 font-weight-semibold">Linked Accounts</h2>
      </div>

      <!-- Empty State -->
      <v-card v-if="store.accounts.length === 0" rounded="sm" elevation="3">
        <v-card-text class="pa-10 text-center">
          <v-icon size="56" color="primary" class="mb-4 text-disabled">mdi-bank-off-outline</v-icon>
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

          <v-card>
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
              <v-text-field
                v-if="editPaymentFrequency === 'Monthly'"
                v-model.number="editDueDate"
                label="Due Date (Day of month)"
                type="number"
                min="1"
                max="31"
                variant="solo-filled"
                density="comfortable"
                rounded="sm"
                hide-details="auto"
                @keyup.enter="saveEditName"
              />
            </template>
            <v-text-field
              v-else
              v-model.number="editDueDate"
              label="Due Date (Day of month)"
              type="number"
              min="1"
              max="31"
              variant="solo-filled"
              density="comfortable"
              rounded="sm"
              hide-details="auto"
              @keyup.enter="saveEditName"
            />
          </template>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="editNameDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" rounded="sm" @click="saveEditName">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Remove Confirmation Dialog -->
    <v-dialog v-model="removeDialog" max-width="400" rounded="sm">
      <v-card rounded="sm">
        <v-card-title class="text-h6 pa-6 pb-2">Remove Account</v-card-title>
        <v-card-text class="pa-6 pt-2 text-body-2 text-medium-emphasis">
          Remove <strong>{{ pendingRemove?.ORG || 'this account' }}</strong> ending in
          <strong>{{ pendingRemove?.ACCTID }}</strong
          >? This only removes the account from this app — no bank data is affected.
        </v-card-text>
        <v-card-actions class="pa-6 pt-0 gap-2">
          <v-spacer />
          <v-btn variant="text" @click="removeDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="tonal" @click="doRemove">Remove</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserAccountsStore } from '../stores/userAccounts'

const store = useUserAccountsStore()

const isVariableDueDate = (account) =>
  String(account?.ACCTTYPE || '').toLowerCase().includes('buy now pay later')

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

onMounted(() => store.fetchAccounts())

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
const editDueDate = ref('')
const editPaymentFrequency = ref('Monthly')

function openEditName(account) {
  editNameTarget.value = account
  editNameValue.value = account.displayName || account.ACCTTYPE || ''
  editInterestRate.value = account.interestRate || 0
  editDueDate.value = account.dueDate || ''
  editPaymentFrequency.value = account.paymentFrequency || 'Monthly'
  editNameDialog.value = true
}

function saveEditName() {
  if (editNameTarget.value) {
    const updates = {
      displayName: editNameValue.value.trim() || editNameTarget.value.ACCTTYPE
    }
    if (isLoanAccount(editNameTarget.value)) {
      updates.interestRate = Number(editInterestRate.value) || 0
      if (isVariableDueDate(editNameTarget.value)) {
        updates.paymentFrequency = editPaymentFrequency.value
        updates.dueDate = editPaymentFrequency.value === 'Monthly' ? (Number(editDueDate.value) || null) : null
      } else {
        updates.dueDate = Number(editDueDate.value) || null
      }
    }
    store.updateAccount(editNameTarget.value.ACCTID, updates)
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
  dueDate: null
})
const manualForm = ref(emptyManualForm())

async function saveManualAccount() {
  const payload = {
    displayName: manualForm.value.displayName.trim(),
    ORG: manualForm.value.ORG.trim() || null,
    ACCTTYPE: manualForm.value.ACCTTYPE,
    interestRate: Number(manualForm.value.interestRate) || 0,
    paymentFrequency: manualForm.value.ACCTTYPE === 'Buy Now Pay Later' ? manualForm.value.paymentFrequency : null,
    dueDate: manualForm.value.ACCTTYPE === 'Buy Now Pay Later' && manualForm.value.paymentFrequency === 'Monthly'
      ? (Number(manualForm.value.dueDate) || null)
      : manualForm.value.ACCTTYPE !== 'Buy Now Pay Later'
        ? (Number(manualForm.value.dueDate) || null)
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

function accountTypeColor(type) {
  return (
    {
      Checking: 'primary',
      Savings: 'success',
      'Money Market': 'warning',
      'Credit Line': 'error',
      'Buy Now Pay Later': 'error',
      'Personal Loan': 'error',
      'Auto Loan': 'error',
      'Student Loan': 'error',
      Mortgage: 'error',
      'Medical Debt': 'error',
      'Family / Friend Loan': 'error',
      Other: 'error'
    }[type] || 'secondary'
  )
}

function accountTypeIcon(type) {
  return (
    {
      Checking: 'mdi-bank-outline',
      Savings: 'mdi-piggy-bank-outline',
      'Money Market': 'mdi-chart-line',
      'Credit Line': 'mdi-credit-card-outline',
      'Buy Now Pay Later': 'mdi-shopping-outline',
      'Personal Loan': 'mdi-cash-multiple',
      'Auto Loan': 'mdi-car',
      'Student Loan': 'mdi-school-outline',
      Mortgage: 'mdi-home-outline',
      'Medical Debt': 'mdi-hospital-box-outline',
      'Family / Friend Loan': 'mdi-account-heart-outline',
      Other: 'mdi-dots-horizontal-circle-outline'
    }[type] || 'mdi-bank-outline'
  )
}
</script>
