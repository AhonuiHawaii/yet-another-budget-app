import { extractAccountData, extractTransactionData } from './ofx.js'
import { createTransaction, getTransactions, updateTransaction, deleteTransaction } from './db.js'

/*
  main.js — Service layer between ofx.js (parsing) and db.js (persistence).
  All operations called by ipcHandler go through here.
  Returns a consistent { success, data, error } envelope.
*/

const ok = (data) => ({ success: true, data })
const fail = (error) => ({ success: false, error: error?.message ?? String(error) })

// ─── OFX Import ─────────────────────────────────────────────────────────────

export const importAccount = async (ofxData) => {
  try {
    const data = await extractAccountData(ofxData)
    if (!data) return fail(new Error('No account data found in the file.'))
    return ok(data)
  } catch (e) {
    return fail(e)
  }
}

export const importTransactions = async (ofxData) => {
  try {
    const transactions = await extractTransactionData(ofxData)
    if (!transactions.length) return fail(new Error('No transactions found in the file.'))
    const results = transactions.map((txn) => createTransaction(txn))
    const inserted = results.reduce((sum, n) => sum + n, 0)
    return ok({ total: transactions.length, inserted, skipped: transactions.length - inserted })
  } catch (e) {
    return fail(e)
  }
}

// ─── Transactions ────────────────────────────────────────────────────────────

export const fetchTransactions = (filters) => {
  try {
    return ok(getTransactions(filters))
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
