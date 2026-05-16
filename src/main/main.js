import { randomUUID } from 'node:crypto'
import { extractAccountData, extractTransactionData } from './ofx.js'
import {
  createTransactions,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  upsertAccount,
  createManualAccount,
  getAccounts,
  getAccount,
  updateAccount,
  deleteAccount,
  getMonthlySummary,
  getCategoryTotals,
  getUncategorized,
  getAccountSummary,
  getMonthsWithData,
  getMonthlyTotals,
  getRules,
  createRule as dbCreateRule,
  updateRule as dbUpdateRule,
  deleteRule as dbDeleteRule,
  applyRules
} from './db.js'

/*
  main.js — Service layer between ofx.js (parsing) and db.js (persistence).
  All operations called by ipcHandler go through here.
  Returns a consistent { success, data, error } envelope.
*/

const ok = (data) => ({ success: true, data })
const fail = (error) => ({ success: false, error: error?.message ?? String(error) })

const maskAcctid = (id) => String(id || '').slice(-4)

// Accepts either the real ACCTID or a masked (last-4) value and returns the real stored ACCTID.
// Needed because the renderer only holds the masked value.
function resolveAcctid(maskedOrReal) {
  const all = getAccounts()
  return (
    all.find((a) => a.ACCTID === maskedOrReal || maskAcctid(a.ACCTID) === maskedOrReal)?.ACCTID ??
    null
  )
}

// ─── OFX Import ─────────────────────────────────────────────────────────────

export const importAccount = async (ofxData) => {
  try {
    const data = await extractAccountData(ofxData)
    if (!data) return fail(new Error('No account data found in the file.'))
    upsertAccount(data)
    return ok({ ...data, ACCTID: maskAcctid(data.ACCTID) })
  } catch (e) {
    return fail(e)
  }
}

export const importTransactions = async (ofxData) => {
  try {
    const transactions = await extractTransactionData(ofxData)
    if (!transactions.length) return fail(new Error('No transactions found in the file.'))

    const [firstTransaction] = transactions
    if (firstTransaction?.ACCTID) {
      upsertAccount({
        ACCTID: firstTransaction.ACCTID,
        ACCTTYPE: firstTransaction.ACCTTYPE,
        ORG: firstTransaction.ORG,
        INTU_BID: firstTransaction.INTU_BID
      })
    }

    const result = createTransactions(transactions)

    // Auto-categorize newly inserted transactions using saved rules
    const patches = applyRules(transactions)
    for (const patch of patches) {
      const updates = { category: patch.category }
      if (patch.transactionType) updates.transactionType = patch.transactionType
      updateTransaction(patch.FITID, updates)
    }

    return ok(result)
  } catch (e) {
    return fail(e)
  }
}

// ─── Transactions ────────────────────────────────────────────────────────────

export const fetchTransactions = (filters) => {
  try {
    return ok(getTransactions(filters).map((t) => ({ ...t, ACCTID: maskAcctid(t.ACCTID) })))
  } catch (e) {
    return fail(e)
  }
}

export const editTransaction = (fitid, updates) => {
  try {
    const changes = updateTransaction(fitid, updates)
    if (!changes) return fail(new Error(`No transaction found with FITID: ${fitid}`))
    return ok({ fitid, changes })
  } catch (e) {
    return fail(e)
  }
}

export const removeTransaction = (fitid) => {
  try {
    const changes = deleteTransaction(fitid)
    if (!changes) return fail(new Error(`No transaction found with FITID: ${fitid}`))
    return ok({ fitid, changes })
  } catch (e) {
    return fail(e)
  }
}

export const removeAccountTransactions = (acctid) => {
  try {
    const changes = deleteTransaction(acctid, 'ACCTID')
    return ok({ acctid, changes })
  } catch (e) {
    return fail(e)
  }
}

// Accounts

export const fetchAccounts = () => {
  try {
    return ok(getAccounts().map((a) => ({ ...a, ACCTID: maskAcctid(a.ACCTID) })))
  } catch (e) {
    return fail(e)
  }
}

export const fetchAccount = (acctid) => {
  try {
    const realAcctid = resolveAcctid(acctid)
    if (!realAcctid) return fail(new Error(`No account found with ACCTID: ${acctid}`))
    const account = getAccount(realAcctid)
    if (!account) return fail(new Error(`No account found with ACCTID: ${acctid}`))
    return ok({ ...account, ACCTID: maskAcctid(account.ACCTID) })
  } catch (e) {
    return fail(e)
  }
}

export const addManualAccount = (data) => {
  try {
    const ACCTID = `manual-${randomUUID()}`
    createManualAccount({ ...data, ACCTID })
    const created = getAccount(ACCTID)
    return ok({ ...created, ACCTID: maskAcctid(ACCTID) })
  } catch (e) {
    return fail(e)
  }
}

export const editAccount = (acctid, updates) => {
  try {
    const realAcctid = resolveAcctid(acctid)
    if (!realAcctid) return fail(new Error(`No account found with ACCTID: ${acctid}`))
    const changes = updateAccount(realAcctid, updates)
    if (!changes) return fail(new Error(`No account found with ACCTID: ${acctid}`))
    return ok({ acctid, changes })
  } catch (e) {
    return fail(e)
  }
}

export const removeAccount = (acctid) => {
  try {
    const realAcctid = resolveAcctid(acctid)
    if (!realAcctid) return fail(new Error(`No account found with ACCTID: ${acctid}`))
    const changes = deleteAccount(realAcctid)
    if (!changes) return fail(new Error(`No account found with ACCTID: ${acctid}`))
    return ok({ acctid, changes })
  } catch (e) {
    return fail(e)
  }
}

// Reporting

export const fetchMonthlySummary = (yyyymm) => {
  try {
    return ok(getMonthlySummary(yyyymm))
  } catch (e) {
    return fail(e)
  }
}

export const fetchCategoryTotals = (yyyymm) => {
  try {
    return ok(getCategoryTotals(yyyymm))
  } catch (e) {
    return fail(e)
  }
}

export const fetchUncategorized = (yyyymm) => {
  try {
    return ok(getUncategorized(yyyymm))
  } catch (e) {
    return fail(e)
  }
}

export const fetchAccountSummary = () => {
  try {
    return ok(getAccountSummary().map((s) => ({ ...s, ACCTID: maskAcctid(s.ACCTID) })))
  } catch (e) {
    return fail(e)
  }
}

export const fetchMonthsWithData = () => {
  try {
    return ok(getMonthsWithData())
  } catch (e) {
    return fail(e)
  }
}

export const fetchMonthlyTotals = () => {
  try {
    return ok(getMonthlyTotals())
  } catch (e) {
    return fail(e)
  }
}

// Rules

export const fetchRules = () => {
  try {
    return ok(getRules())
  } catch (e) {
    return fail(e)
  }
}

export const addRule = (rule) => {
  try {
    return ok(dbCreateRule(rule))
  } catch (e) {
    return fail(e)
  }
}

export const editRule = (id, updates) => {
  try {
    const changes = dbUpdateRule(id, updates)
    if (!changes) return fail(new Error(`No rule found with id: ${id}`))
    return ok({ id, changes })
  } catch (e) {
    return fail(e)
  }
}

export const removeRule = (id) => {
  try {
    const changes = dbDeleteRule(id)
    if (!changes) return fail(new Error(`No rule found with id: ${id}`))
    return ok({ id, changes })
  } catch (e) {
    return fail(e)
  }
}

export const applyRulesToMonth = (yyyymm) => {
  try {
    const transactions = getUncategorized(yyyymm)
    const patches = applyRules(transactions)
    for (const patch of patches) {
      const updates = { category: patch.category }
      if (patch.transactionType) updates.transactionType = patch.transactionType
      updateTransaction(patch.FITID, updates)
    }
    return ok({ applied: patches.length })
  } catch (e) {
    return fail(e)
  }
}
