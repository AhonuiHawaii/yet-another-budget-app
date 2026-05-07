import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const ipc = window.electron.ipcRenderer

export const useUserAccountsStore = defineStore('userAccounts', () => {
  const accounts = ref([])
  const loading = ref(false)
  const error = ref(null)

  const accountCount = computed(() => accounts.value.length)

  // ── Helpers ──────────────────────────────────────────────────────────────

  function setError(err) {
    error.value = err?.message ?? String(err)
  }

  function clearError() {
    error.value = null
  }

  // ── Reads ─────────────────────────────────────────────────────────────────

  /**
   * Load all accounts from the DB into the store.
   * Call this on app startup or after any mutation.
   */
  async function fetchAccounts() {
    loading.value = true
    error.value = null
    try {
      const result = await ipc.invoke('accounts:fetchAll')
      if (!result.success) throw new Error(result.error)
      accounts.value = result.data
    } catch (err) {
      setError(err)
    } finally {
      loading.value = false
    }
  }

  // ── OFX Import ────────────────────────────────────────────────────────────

  /**
   * Parse an OFX file and upsert the account into the DB.
   * @param {string} ofxData - Raw OFX file content
   * @returns {Object|null} The imported account data, or null on failure.
   */
  async function importAccountFromOfx(ofxData) {
    loading.value = true
    error.value = null
    try {
      const result = await ipc.invoke('ofx:importAccount', ofxData)
      if (!result.success) throw new Error(result.error)
      await fetchAccounts()
      return result.data
    } catch (err) {
      setError(err)
      return null
    } finally {
      loading.value = false
    }
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Update writable fields on an account (displayName, ACCTTYPE, ORG, INTU_BID).
   * @param {string} acctid
   * @param {Object} updates
   */
  async function updateAccount(acctid, updates) {
    loading.value = true
    error.value = null
    try {
      const result = await ipc.invoke('accounts:edit', acctid, updates)
      if (!result.success) throw new Error(result.error)
      await fetchAccounts()
    } catch (err) {
      setError(err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete an account and all of its transactions from the DB.
   * @param {string} acctid
   */
  async function removeAccount(acctid) {
    loading.value = true
    error.value = null
    try {
      const result = await ipc.invoke('accounts:remove', acctid)
      if (!result.success) throw new Error(result.error)
      await fetchAccounts()
    } catch (err) {
      setError(err)
    } finally {
      loading.value = false
    }
  }

  return {
    accounts,
    loading,
    error,
    accountCount,
    fetchAccounts,
    importAccountFromOfx,
    updateAccount,
    removeAccount,
    clearError
  }
})
