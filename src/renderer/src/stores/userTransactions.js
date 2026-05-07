import { defineStore } from 'pinia'
import { ref } from 'vue'

const ipc = window.electron.ipcRenderer

export const useUserTransactionsStore = defineStore('userTransactions', () => {
  // ── State ─────────────────────────────────────────────────────────────────

  const transactions = ref([])
  const monthsWithData = ref([]) // string[] of 'yyyymm'
  const activeMonth = ref(null) // currently selected 'yyyymm'

  // Report state
  const monthlySummary = ref([]) // [{ transactionType, total }]
  const categoryTotals = ref([]) // [{ category, total }]
  const uncategorized = ref([]) // Transaction[]
  const accountSummary = ref([]) // [{ ACCTID, count, total }]

  const loading = ref(false)
  const error = ref(null)

  // ── Helpers ───────────────────────────────────────────────────────────────

  function setError(err) {
    error.value = err?.message ?? String(err)
  }

  function clearError() {
    error.value = null
  }

  // ── Transactions: reads ───────────────────────────────────────────────────

  /**
   * Fetch transactions from the DB with optional filters.
   * Defaults to the current month when no filters are passed.
   * @param {Object} [filters] - e.g. { ACCTID: '4321' } or { DTPOSTED: '202605' }
   */
  async function fetchTransactions(filters = {}) {
    loading.value = true
    error.value = null
    try {
      const result = await ipc.invoke('transactions:fetch', filters)
      if (!result.success) throw new Error(result.error)
      transactions.value = result.data
    } catch (err) {
      setError(err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Convenience: fetch transactions for a specific month and cache the active month.
   * @param {string} yyyymm - e.g. '202605'
   */
  async function fetchTransactionsByMonth(yyyymm) {
    activeMonth.value = yyyymm
    await fetchTransactions({ DTPOSTED: yyyymm })
  }

  // ── Transactions: writes ──────────────────────────────────────────────────

  /**
   * Import transactions from an OFX file.
   * Also upserts the account automatically (handled by main.js).
   * @param {string} ofxData - Raw OFX file content
   * @returns {{ total: number, inserted: number, skipped: number }|null}
   */
  async function importTransactionsFromOfx(ofxData) {
    loading.value = true
    error.value = null
    try {
      const result = await ipc.invoke('ofx:importTransactions', ofxData)
      if (!result.success) throw new Error(result.error)
      await fetchTransactions({ DTPOSTED: activeMonth.value ?? undefined })
      return result.data
    } catch (err) {
      setError(err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Update writable fields on a transaction (transactionType, category, split fields, etc.).
   * @param {string} fitid
   * @param {Object} updates
   */
  async function editTransaction(fitid, updates) {
    loading.value = true
    error.value = null
    try {
      const result = await ipc.invoke('transactions:edit', fitid, updates)
      if (!result.success) throw new Error(result.error)
      // Patch in-place so the UI doesn't need a full re-fetch
      const idx = transactions.value.findIndex((t) => t.FITID === fitid)
      if (idx !== -1) transactions.value[idx] = { ...transactions.value[idx], ...updates }
    } catch (err) {
      setError(err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a single transaction by FITID.
   * @param {string} fitid
   */
  async function removeTransaction(fitid) {
    loading.value = true
    error.value = null
    try {
      const result = await ipc.invoke('transactions:remove', fitid)
      if (!result.success) throw new Error(result.error)
      transactions.value = transactions.value.filter((t) => t.FITID !== fitid)
    } catch (err) {
      setError(err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete all transactions for a given account.
   * @param {string} acctid
   */
  async function removeAccountTransactions(acctid) {
    loading.value = true
    error.value = null
    try {
      const result = await ipc.invoke('transactions:removeByAccount', acctid)
      if (!result.success) throw new Error(result.error)
      transactions.value = transactions.value.filter((t) => t.ACCTID !== acctid)
    } catch (err) {
      setError(err)
    } finally {
      loading.value = false
    }
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  /**
   * Load all report data for a given month in parallel.
   * @param {string} yyyymm - e.g. '202605'
   */
  async function fetchReports(yyyymm) {
    loading.value = true
    error.value = null
    try {
      const [summary, categories, uncat] = await Promise.all([
        ipc.invoke('reports:monthlySummary', yyyymm),
        ipc.invoke('reports:categoryTotals', yyyymm),
        ipc.invoke('reports:uncategorized', yyyymm)
      ])
      if (!summary.success) throw new Error(summary.error)
      if (!categories.success) throw new Error(categories.error)
      if (!uncat.success) throw new Error(uncat.error)

      monthlySummary.value = summary.data
      categoryTotals.value = categories.data
      uncategorized.value = uncat.data
    } catch (err) {
      setError(err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Load the account-level summary (count + total per account).
   */
  async function fetchAccountSummary() {
    loading.value = true
    error.value = null
    try {
      const result = await ipc.invoke('reports:accountSummary')
      if (!result.success) throw new Error(result.error)
      accountSummary.value = result.data
    } catch (err) {
      setError(err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Load the list of months that have transaction data.
   * Sets activeMonth to the most recent month if not already set.
   */
  async function fetchMonthsWithData() {
    loading.value = true
    error.value = null
    try {
      const result = await ipc.invoke('reports:monthsWithData')
      if (!result.success) throw new Error(result.error)
      monthsWithData.value = result.data
      if (!activeMonth.value && result.data.length) {
        activeMonth.value = result.data[result.data.length - 1]
      }
    } catch (err) {
      setError(err)
    } finally {
      loading.value = false
    }
  }

  // ── Exposed ───────────────────────────────────────────────────────────────

  return {
    // State
    transactions,
    monthsWithData,
    activeMonth,
    monthlySummary,
    categoryTotals,
    uncategorized,
    accountSummary,
    loading,
    error,
    // Transactions
    fetchTransactions,
    fetchTransactionsByMonth,
    importTransactionsFromOfx,
    editTransaction,
    removeTransaction,
    removeAccountTransactions,
    // Reports
    fetchReports,
    fetchAccountSummary,
    fetchMonthsWithData,
    // Util
    clearError
  }
})
