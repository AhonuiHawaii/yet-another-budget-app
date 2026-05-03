import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'budget:accounts'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(accounts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
}

export const useUserAccountsStore = defineStore('userAccounts', () => {
  const accounts = ref(loadFromStorage())
  const loading = ref(false)
  const error = ref(null)

  const accountCount = computed(() => accounts.value.length)

  /**
   * Import an account from OFX file data string.
   * Calls the main-process IPC handler `ofx:importAccount`.
   * Returns the imported account object, or null on failure.
   * @param {string} ofxData - Raw OFX file content
   */
  async function importAccountFromOfx(ofxData) {
    loading.value = true
    error.value = null

    try {
      const result = await window.electron.ipcRenderer.invoke('ofx:importAccount', ofxData)

      if (!result) {
        throw new Error('No account data found in the selected file.')
      }

      // Avoid duplicates by ACCTID
      const exists = accounts.value.some((a) => a.ACCTID === result.ACCTID)
      if (!exists) {
        accounts.value.push(result)
        saveToStorage(accounts.value)
      }

      return result
    } catch (err) {
      error.value = err.message || 'Failed to import account.'
      return null
    } finally {
      loading.value = false
    }
  }

  function removeAccount(acctId) {
    accounts.value = accounts.value.filter((a) => a.ACCTID !== acctId)
    saveToStorage(accounts.value)
  }

  function clearError() {
    error.value = null
  }

  return {
    accounts,
    loading,
    error,
    accountCount,
    importAccountFromOfx,
    removeAccount,
    clearError
  }
})
