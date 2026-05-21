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
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'

const passphrase = ref('')
const isExporting = ref(false)
const isImporting = ref(false)
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

async function handleImport() {
  if (
    !confirm(
      'Restoring a backup will overwrite your current database. Are you sure you want to proceed?'
    )
  ) {
    return
  }
  error.value = ''
  success.value = ''
  isImporting.value = true
  try {
    const res = await window.electron.ipcRenderer.invoke('backup:import', passphrase.value)
    if (res.canceled) {
      // User canceled dialog, do nothing
    } else if (res.success) {
      success.value = 'Backup restored successfully. Restarting application...'
      passphrase.value = ''
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
