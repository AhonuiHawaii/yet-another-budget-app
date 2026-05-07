import { ipcMain } from 'electron'
import {
  importAccount,
  importTransactions,
  fetchTransactions,
  editTransaction,
  removeTransaction,
  fetchAccounts,
  fetchAccount,
  editAccount,
  removeAccount,
  fetchMonthlySummary,
  fetchCategoryTotals,
  fetchUncategorized,
  fetchAccountSummary,
  fetchMonthsWithData
} from './main.js'

export const setupIpcHandlers = () => {
  ipcMain.handle('ofx:importAccount', (_, ofxData) => importAccount(ofxData))
  ipcMain.handle('ofx:importTransactions', (_, ofxData) => importTransactions(ofxData))

  ipcMain.handle('transactions:fetch', (_, filters) => fetchTransactions(filters))
  ipcMain.handle('transactions:edit', (_, fitid, updates) => editTransaction(fitid, updates))
  ipcMain.handle('transactions:remove', (_, fitid) => removeTransaction(fitid))

  ipcMain.handle('accounts:fetchAll', () => fetchAccounts())
  ipcMain.handle('accounts:fetchOne', (_, acctid) => fetchAccount(acctid))
  ipcMain.handle('accounts:edit', (_, acctid, updates) => editAccount(acctid, updates))
  ipcMain.handle('accounts:remove', (_, acctid) => removeAccount(acctid))

  ipcMain.handle('reports:monthlySummary', (_, yyyymm) => fetchMonthlySummary(yyyymm))
  ipcMain.handle('reports:categoryTotals', (_, yyyymm) => fetchCategoryTotals(yyyymm))
  ipcMain.handle('reports:uncategorized', (_, yyyymm) => fetchUncategorized(yyyymm))
  ipcMain.handle('reports:accountSummary', () => fetchAccountSummary())
  ipcMain.handle('reports:monthsWithData', () => fetchMonthsWithData())
}
