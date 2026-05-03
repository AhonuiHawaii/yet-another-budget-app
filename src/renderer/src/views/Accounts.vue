<template>
  <v-container fluid class="accounts-page pa-6">
    <!-- Page Header -->
    <div class="page-header mb-8">
      <h1 class="text-h4 font-weight-bold">Accounts</h1>
      <p class="text-body-1 text-medium-emphasis mt-1">Manage your linked financial accounts</p>
    </div>

    <!-- Import Card -->
    <v-card class="import-card mb-8" rounded="xl" elevation="0" border>
      <v-card-text class="pa-6">
        <div class="d-flex align-center gap-4 mb-4">
          <v-icon size="28" color="primary">mdi-file-import-outline</v-icon>
          <div>
            <div class="text-subtitle-1 font-weight-semibold">Import Account</div>
            <div class="text-body-2 text-medium-emphasis">
              Select an OFX or QFX file exported from your bank
            </div>
          </div>
        </div>

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
          class="mb-4"
          @update:model-value="store.clearError()"
        />

        <div class="d-flex align-center gap-3">
          <v-btn
            color="primary"
            rounded="lg"
            :loading="store.loading"
            :disabled="!selectedFile"
            prepend-icon="mdi-import"
            @click="handleImport"
          >
            Import Account
          </v-btn>

          <v-slide-x-transition>
            <v-chip
              v-if="lastImported"
              color="success"
              variant="tonal"
              prepend-icon="mdi-check-circle-outline"
              size="small"
            >
              Imported {{ lastImported }}
            </v-chip>
          </v-slide-x-transition>
        </div>
      </v-card-text>
    </v-card>

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
      <v-card v-if="store.accounts.length === 0" class="empty-state" rounded="xl" elevation="0" border>
        <v-card-text class="pa-10 text-center">
          <v-icon size="56" color="primary" class="mb-4" style="opacity: 0.4">
            mdi-bank-off-outline
          </v-icon>
          <div class="text-h6 font-weight-medium mb-2">No accounts yet</div>
          <div class="text-body-2 text-medium-emphasis">
            Import an OFX or QFX file from your bank to get started.
          </div>
        </v-card-text>
      </v-card>

      <!-- Account Cards -->
      <v-row v-else>
        <v-col v-for="account in store.accounts" :key="account.ACCTID" cols="12" sm="6" lg="4">
          <v-card class="account-card" rounded="xl" elevation="0" border height="100%">
            <v-card-text class="pa-5">
              <!-- Account type chip -->
              <div class="d-flex align-center justify-space-between mb-4">
                <v-chip
                  :color="accountTypeColor(account.ACCTTYPE)"
                  variant="tonal"
                  size="small"
                  :prepend-icon="accountTypeIcon(account.ACCTTYPE)"
                >
                  {{ account.ACCTTYPE || 'Unknown' }}
                </v-chip>

                <v-btn
                  icon="mdi-close"
                  variant="text"
                  size="small"
                  color="error"
                  density="compact"
                  @click="confirmRemove(account)"
                />
              </div>

              <!-- Institution -->
              <div class="text-h6 font-weight-bold mb-1">
                {{ account.ORG || 'Unknown Institution' }}
              </div>

              <!-- Routing / Bank ID -->
              <div v-if="account.BANKID" class="text-body-2 text-medium-emphasis mb-3">
                Routing&nbsp;#&nbsp;{{ account.BANKID }}
              </div>

              <v-divider class="mb-3" />

              <!-- Account Number -->
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-caption text-medium-emphasis">Account</div>
                  <div class="text-body-1 font-weight-medium font-monospace">
                    ••••&nbsp;{{ account.ACCTID ? account.ACCTID.slice(-4) : '----' }}
                  </div>
                </div>
                <v-icon color="primary" style="opacity: 0.3" size="32">
                  {{ accountTypeIcon(account.ACCTTYPE) }}
                </v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Remove Confirmation Dialog -->
    <v-dialog v-model="removeDialog" max-width="400" rounded="xl">
      <v-card rounded="xl">
        <v-card-title class="text-h6 pa-6 pb-2">Remove Account</v-card-title>
        <v-card-text class="pa-6 pt-2 text-body-2 text-medium-emphasis">
          Remove <strong>{{ pendingRemove?.ORG || 'this account' }}</strong> ending in
          <strong>{{ pendingRemove?.ACCTID?.slice(-4) }}</strong
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
import { ref } from 'vue'
import { useUserAccountsStore } from '../stores/userAcounts'

const store = useUserAccountsStore()

const selectedFile = ref(null)
const lastImported = ref('')
const removeDialog = ref(false)
const pendingRemove = ref(null)

async function handleImport() {
  if (!selectedFile.value) return

  const file = selectedFile.value
  const text = await file.text()

  const result = await store.importAccountFromOfx(text)

  if (result) {
    lastImported.value = result.ORG
      ? `${result.ORG} ••••${result.ACCTID?.slice(-4)}`
      : `••••${result.ACCTID?.slice(-4)}`
    selectedFile.value = null

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

<style scoped>
.accounts-page {
  max-width: 1100px;
  margin: 0 auto;
}

.import-card {
  background: rgba(var(--v-theme-surface-variant), 0.4);
}

.account-card {
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.account-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}

.font-monospace {
  font-family: 'Roboto Mono', monospace;
}
</style>
