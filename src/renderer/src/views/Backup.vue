<template>
  <v-container fluid class="pa-3">
    <v-alert
      v-if="error"
      type="error"
      variant="flat"
      class="mb-3"
      closable
      @click:close="error = ''"
    >
      {{ error }}
    </v-alert>

    <v-alert
      v-if="success"
      type="success"
      variant="flat"
      class="mb-3"
      closable
      @click:close="success = ''"
    >
      {{ success }}
    </v-alert>

    <v-row>
      <v-col cols="12">
        <v-card rounded elevation="2">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="primary" size="20" :opacity="0.7">mdi-shield-lock-outline</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">Encrypted Backup</v-card-title>
          </v-card-item>

          <v-card-text class="pa-4">
            <p class="text-body-2 text-medium-emphasis mb-4">
              Securely export your full database to an encrypted file, or restore a previous
              backup. A passphrase is required to encrypt and decrypt. Keep it safe — backups
              cannot be restored without it.
            </p>

            <v-text-field
              v-model="passphrase"
              label="Encryption Passphrase"
              type="password"
              variant="outlined"
              density="comfortable"
              hint="Must be at least 8 characters. Do not lose this passphrase."
              persistent-hint
              class="mb-4"
            />

            <v-btn-group divided color="primary" variant="flat" density="comfortable">
              <v-btn
                prepend-icon="mdi-export"
                :disabled="!isValid"
                :loading="isExporting"
                @click="handleExport"
              >
                Export Backup
              </v-btn>
              <v-btn
                prepend-icon="mdi-import"
                :disabled="!isValid"
                :loading="isImporting"
                @click="handleImport"
              >
                Restore Backup
              </v-btn>
            </v-btn-group>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card rounded elevation="2">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="primary" size="20" :opacity="0.7">mdi-code-json</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">Export JSON</v-card-title>
          </v-card-item>

          <v-card-text class="pa-4">
            <p class="text-body-2 text-medium-emphasis mb-4">
              Download a plain-text JSON snapshot of your budgets and categories. Useful for
              sharing data, reporting, or migrating outside the app. Not encrypted — don't share
              if it contains sensitive details.
            </p>

            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-download-outline"
              :loading="isExportingJson"
              @click="handleExportJson"
            >
              Export Budgets as JSON
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="showConfirmDialog" max-width="400" persistent>
      <v-card rounded="sm">
        <v-card-title class="pa-6 pb-4 text-h6 font-weight-bold">Confirm Restore</v-card-title>
        <v-card-text class="pa-6 pt-0 text-body-1">
          Restoring a backup will overwrite your current database. Are you sure you want to
          proceed?
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="flat" rounded="sm" @click="showConfirmDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            variant="flat"
            rounded="sm"
            :loading="isImporting"
            @click="confirmImport"
          >
            Yes, Overwrite
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserBudgetsStore } from '../stores/userBudgets'
import { useUserCategoriesStore } from '../stores/userCategories'

const budgetsStore = useUserBudgetsStore()
const categoriesStore = useUserCategoriesStore()

const passphrase = ref('')
const isExporting = ref(false)
const isImporting = ref(false)
const isExportingJson = ref(false)
const showConfirmDialog = ref(false)
const error = ref('')
const success = ref('')

const isValid = computed(() => passphrase.value.length >= 8)

async function handleExport() {
  error.value = ''
  success.value = ''
  isExporting.value = true
  try {
    const res = await window.electron.ipcRenderer.invoke('backup:export', passphrase.value)
    if (res.canceled) {
      // User canceled dialog, do nothing
    } else if (res.success) {
      success.value = 'Backup exported successfully.'
      passphrase.value = ''
    } else {
      error.value = res.error || 'Failed to export backup.'
    }
  } catch (err) {
    error.value = err.message || 'An unexpected error occurred.'
  } finally {
    isExporting.value = false
  }
}

function handleImport() {
  showConfirmDialog.value = true
}

async function confirmImport() {
  error.value = ''
  success.value = ''
  isImporting.value = true
  try {
    const res = await window.electron.ipcRenderer.invoke('backup:import', passphrase.value)
    if (res.canceled) {
      showConfirmDialog.value = false
    } else if (res.success) {
      success.value =
        'Backup restored successfully. Please restart the application to load your restored data.'
      passphrase.value = ''
      showConfirmDialog.value = false
    } else {
      error.value = res.error || 'Failed to restore backup.'
    }
  } catch (err) {
    error.value = err.message || 'An unexpected error occurred.'
  } finally {
    isImporting.value = false
  }
}

async function handleExportJson() {
  error.value = ''
  success.value = ''
  isExportingJson.value = true
  try {
    await Promise.all([categoriesStore.fetchCategories(), budgetsStore.fetchBudgets()])
    const payload = {
      exportedAt: new Date().toISOString(),
      categories: categoriesStore.categories,
      budgets: categoriesStore.categories.map((c) => ({
        categoryId: c.id,
        categoryName: c.name,
        type: c.type,
        amount: budgetsStore.getBudget(c.id)?.amount || 0
      }))
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `budgets-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    success.value = 'Budgets exported as JSON.'
  } catch (err) {
    error.value = err.message || 'Failed to export JSON.'
  } finally {
    isExportingJson.value = false
  }
}

onMounted(() => {
  categoriesStore.fetchCategories()
  budgetsStore.fetchBudgets()
})
</script>
