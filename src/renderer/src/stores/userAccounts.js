import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const ipc = window.electron.ipcRenderer

export const useUserAccountsStore = defineStore('userAccounts', () => {
  const accounts = ref([])
  const loadingCount = ref(0)
  const loading = computed(() => loadingCount.value > 0)
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
    loadingCount.value++
    error.value = null
    try {
      const result = await ipc.invoke('accounts:fetchAll')
      if (!result.success) throw new Error(result.error)
      accounts.value = result.data
    } catch (err) {
      setError(err)
    } finally {
      loadingCount.value--
    }
  }

  // ── OFX Import ────────────────────────────────────────────────────────────

  /**
   * Parse an OFX file and upsert the account into the DB.
   * @param {string} ofxData - Raw OFX file content
   * @returns {Object|null} The imported account data, or null on failure.
   */
  async function importAccountFromOfx(ofxData) {
    loadingCount.value++
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
      loadingCount.value--
    }
  }

  /**
   * Create a manual (non-OFX) account such as a personal loan or Affirm.
   * @param {{ displayName?: string, ORG?: string, ACCTTYPE?: string,
   *           interestRate?: number, dueDate?: number|null }} data
   * @returns {Object|null} The created account row, or null on failure.
   */
  async function createManualAccount(data) {
    loadingCount.value++
    error.value = null
    try {
      const result = await ipc.invoke('accounts:createManual', data)
      if (!result.success) throw new Error(result.error)
      await fetchAccounts()
      return result.data
    } catch (err) {
      setError(err)
      return null
    } finally {
      loadingCount.value--
    }
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Update writable fields on an account (displayName, ACCTTYPE, ORG, INTU_BID).
   * @param {string} acctid
   * @param {Object} updates
   */
  async function updateAccount(acctid, updates) {
    loadingCount.value++
    error.value = null
    try {
      const result = await ipc.invoke('accounts:edit', acctid, updates)
      if (!result.success) throw new Error(result.error)
      await fetchAccounts()
      return true
    } catch (err) {
      setError(err)
      return false
    } finally {
      loadingCount.value--
    }
  }

  /**
   * Rename the ORG field on every account that currently belongs to a bank.
   * @param {string} oldName - Current ORG value
   * @param {string} newName - Replacement ORG value
   */
  async function updateBankName(oldName, newName) {
    loadingCount.value++
    error.value = null
    try {
      const affected = accounts.value.filter((a) => a.ORG === oldName)
      for (const acct of affected) {
        const result = await ipc.invoke('accounts:edit', acct.ACCTID, { ORG: newName })
        if (!result.success) throw new Error(result.error)
      }
      await fetchAccounts()
    } catch (err) {
      setError(err)
    } finally {
      loadingCount.value--
    }
  }

  /**
   * Delete an account and all of its transactions from the DB.
   * @param {string} acctid
   */
  async function removeAccount(acctid) {
    loadingCount.value++
    error.value = null
    try {
      const result = await ipc.invoke('accounts:remove', acctid)
      if (!result.success) throw new Error(result.error)
      await fetchAccounts()
    } catch (err) {
      setError(err)
    } finally {
      loadingCount.value--
    }
  }

  return {
    accounts,
    loading,
    error,
    accountCount,
    fetchAccounts,
    importAccountFromOfx,
    createManualAccount,
    updateAccount,
    updateBankName,
    removeAccount,
    clearError
  }
})
