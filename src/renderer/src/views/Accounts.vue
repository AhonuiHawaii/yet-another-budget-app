<template>
  <v-container fluid class="pa-6">
    <!-- Page Header -->
    <div class="page-header mb-8">
      <h1 class="text-h4 font-weight-bold">Accounts</h1>
      <p class="text-body-1 text-medium-emphasis mt-1">Manage your linked financial accounts</p>
    </div>

    <!-- Add Account Button -->
    <div class="mb-8">
      <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" @click="importDialog = true">
        Add Account
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
      <v-card rounded="xl">
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
            rounded="lg"
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
            rounded="lg"
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

    <!-- Accounts List -->
    <div class="accounts-section">
      <div class="d-flex align-center justify-space-between mb-4">
        <h2 class="text-h6 font-weight-semibold">
          Linked Accounts
          <v-chip
            v-if="store.accountCount > 0"
            size="x-small"
            color="primary"
            variant="tonal"
            class="ml-2"
          >
            {{ store.accountCount }}
          </v-chip>
        </h2>
      </div>

      <!-- Empty State -->
      <v-card
        v-if="store.accounts.length === 0"
        class="empty-state"
        rounded="xl"
        elevation="0"
        border
      >
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
        <div v-for="(accounts, bank) in groupedAccounts" :key="bank" class="bank-group mb-4">
          <!-- Bank subheader -->
          <div class="d-flex align-center justify-space-between bank-subheader mb-1">
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
                    <span class="font-monospace">*{{ account.ACCTID || '----' }}</span>
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
      <v-card rounded="xl">
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
            rounded="lg"
            hide-details
            autofocus
            @keyup.enter="saveEditBank"
          />
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="editBankDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" @click="saveEditBank">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Account Name Modal -->
    <v-dialog v-model="editNameDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-3">
              <v-icon color="primary" size="20">mdi-pencil-outline</v-icon>
              <span class="text-h6 font-weight-bold">Edit Account Name</span>
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
            rounded="lg"
            hide-details
            autofocus
            @keyup.enter="saveEditName"
          />
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="editNameDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" @click="saveEditName">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Remove Confirmation Dialog -->
    <v-dialog v-model="removeDialog" max-width="400" rounded="xl">
      <v-card rounded="xl">
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
import { ref, computed } from 'vue'
import { useUserAccountsStore } from '../stores/userAcounts'

const store = useUserAccountsStore()

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

// Edit account name
const editNameDialog = ref(false)
const editNameTarget = ref(null)
const editNameValue = ref('')

function openEditName(account) {
  editNameTarget.value = account
  editNameValue.value = account.displayName || account.ACCTTYPE || ''
  editNameDialog.value = true
}

function saveEditName() {
  if (editNameTarget.value) {
    store.updateAccount(editNameTarget.value.ACCTID, {
      displayName: editNameValue.value.trim() || editNameTarget.value.ACCTTYPE
    })
  }
  editNameDialog.value = false
  editNameTarget.value = null
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
      'Credit Line': 'error'
    }[type] || 'secondary'
  )
}

function accountTypeIcon(type) {
  return (
    {
      Checking: 'mdi-bank-outline',
      Savings: 'mdi-piggy-bank-outline',
      'Money Market': 'mdi-chart-line',
      'Credit Line': 'mdi-credit-card-outline'
    }[type] || 'mdi-bank-outline'
  )
}
</script>
