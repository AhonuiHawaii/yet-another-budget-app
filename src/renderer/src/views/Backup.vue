<template>
  <v-container fluid class="pa-6">
    <v-card class="mx-auto" max-width="600" rounded="lg" elevation="2">
      <v-card-title class="text-h5 font-weight-bold pa-6 pb-2"> Backup & Restore </v-card-title>
      <v-card-text class="pa-6">
        <p class="text-body-2 text-medium-emphasis mb-6">
          Securely export your database to an encrypted file, or restore a previous backup. A
          passphrase is required to encrypt and decrypt the backup. Keep it safe, as backups cannot
          be restored without it.
        </p>

        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mb-6"
          closable
          @click:close="error = ''"
        >
          {{ error }}
        </v-alert>

        <v-alert
          v-if="success"
          type="success"
          variant="tonal"
          class="mb-6"
          closable
          @click:close="success = ''"
        >
          {{ success }}
        </v-alert>

        <v-text-field
          v-model="passphrase"
          label="Encryption Passphrase"
          type="password"
          variant="outlined"
          density="comfortable"
          hint="Must be at least 8 characters. Do not lose this passphrase."
          persistent-hint
          class="mb-6"
        />

        <v-row>
          <v-col cols="6">
            <v-btn
              block
              color="primary"
              size="large"
              prepend-icon="mdi-export"
              :disabled="!isValid"
              :loading="isExporting"
              @click="handleExport"
            >
              Export Backup
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn
              block
              color="error"
              variant="tonal"
              size="large"
              prepend-icon="mdi-import"
              :disabled="!isValid"
              :loading="isImporting"
              @click="handleImport"
            >
              Restore Backup
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-dialog v-model="showConfirmDialog" max-width="400" persistent>
      <v-card rounded="sm">
        <v-card-title class="pa-6 pb-4 text-h6 font-weight-bold">
          Confirm Restore
        </v-card-title>
        <v-card-text class="pa-6 pt-0 text-body-1">
          Restoring a backup will overwrite your current database. Are you sure you want to proceed?
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="tonal" rounded="sm" @click="showConfirmDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" rounded="sm" @click="confirmImport" :loading="isImporting">
            Yes, Overwrite
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'

const passphrase = ref('')
const isExporting = ref(false)
const isImporting = ref(false)
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
      // User canceled dialog, do nothing
      showConfirmDialog.value = false
    } else if (res.success) {
      success.value = 'Backup restored successfully. Please restart the application to load your restored data.'
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
</script>
