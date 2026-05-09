import { extractAccountData, extractTransactionData } from './ofx.js'
import {
  createTransactions,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  upsertAccount,
  getAccounts,
  getAccount,
  updateAccount,
  deleteAccount,
  getMonthlySummary,
  getCategoryTotals,
  getUncategorized,
  getAccountSummary,
  getMonthsWithData
} from './db.js'

/*
  main.js — Service layer between ofx.js (parsing) and db.js (persistence).
  All operations called by ipcHandler go through here.
  Returns a consistent { success, data, error } envelope.
*/

const ok = (data) => ({ success: true, data })
const fail = (error) => ({ success: false, error: error?.message ?? String(error) })

const maskAcctid = (id) => String(id || '').slice(-4)

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

    return ok(createTransactions(transactions))
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
    const account = getAccount(acctid)
    if (!account) return fail(new Error(`No account found with ACCTID: ${acctid}`))
    return ok({ ...account, ACCTID: maskAcctid(account.ACCTID) })
  } catch (e) {
    return fail(e)
  }
}

export const editAccount = (acctid, updates) => {
  try {
    const changes = updateAccount(acctid, updates)
    if (!changes) return fail(new Error(`No account found with ACCTID: ${acctid}`))
    return ok({ acctid, changes })
  } catch (e) {
    return fail(e)
  }
}

export const removeAccount = (acctid) => {
  try {
    const changes = deleteAccount(acctid)
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
