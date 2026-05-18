import { ipcMain, BrowserWindow } from 'electron'
import {
  importAccount,
  importTransactions,
  fetchTransactions,
  editTransaction,
  removeTransaction,
  removeAccountTransactions,
  fetchAccounts,
  fetchAccount,
  editAccount,
  addManualAccount,
  removeAccount,
  fetchMonthlySummary,
  fetchCategoryTotals,
  fetchUncategorized,
  fetchAccountSummary,
  fetchMonthsWithData,
  fetchMonthlyTotals,
  fetchNetWorthHistory,
  fetchRules,
  addRule,
  editRule,
  removeRule,
  applyRulesToMonth,
  rescanRecurringTransactions,
  fetchCustomRecurring,
  addCustomRecurring,
  editCustomRecurring,
  removeCustomRecurring
} from './main.js'

export const setupIpcHandlers = () => {
  ipcMain.on('window-minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.on('window-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })

  ipcMain.on('window-close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })

  ipcMain.handle('window-is-maximized', (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
  })

  ipcMain.handle('ofx:importAccount', (_, ofxData) => importAccount(ofxData))
  ipcMain.handle('ofx:importTransactions', (_, ofxData) => importTransactions(ofxData))

  ipcMain.handle('transactions:fetch', (_, filters) => fetchTransactions(filters))
  ipcMain.handle('transactions:edit', (_, fitid, updates) => editTransaction(fitid, updates))
  ipcMain.handle('transactions:remove', (_, fitid) => removeTransaction(fitid))
  ipcMain.handle('transactions:removeByAccount', (_, acctid) => removeAccountTransactions(acctid))

  ipcMain.handle('accounts:fetchAll', () => fetchAccounts())
  ipcMain.handle('accounts:fetchOne', (_, acctid) => fetchAccount(acctid))
  ipcMain.handle('accounts:edit', (_, acctid, updates) => editAccount(acctid, updates))
  ipcMain.handle('accounts:createManual', (_, data) => addManualAccount(data))
  ipcMain.handle('accounts:remove', (_, acctid) => removeAccount(acctid))

  ipcMain.handle('reports:monthlySummary', (_, yyyymm) => fetchMonthlySummary(yyyymm))
  ipcMain.handle('reports:categoryTotals', (_, yyyymm) => fetchCategoryTotals(yyyymm))
  ipcMain.handle('reports:uncategorized', (_, yyyymm) => fetchUncategorized(yyyymm))
  ipcMain.handle('reports:accountSummary', () => fetchAccountSummary())
  ipcMain.handle('reports:monthsWithData', () => fetchMonthsWithData())
  ipcMain.handle('reports:monthlyTotals', () => fetchMonthlyTotals())
  ipcMain.handle('reports:netWorthHistory', () => fetchNetWorthHistory())

  ipcMain.handle('rules:fetch', () => fetchRules())
  ipcMain.handle('rules:create', (_, rule) => addRule(rule))
  ipcMain.handle('rules:update', (_, id, updates) => editRule(id, updates))
  ipcMain.handle('rules:delete', (_, id) => removeRule(id))
  ipcMain.handle('rules:applyToMonth', (_, yyyymm) => applyRulesToMonth(yyyymm))
  ipcMain.handle('transactions:rescanRecurring', () => rescanRecurringTransactions())

  ipcMain.handle('customRecurring:fetch', () => fetchCustomRecurring())
  ipcMain.handle('customRecurring:create', (_, entry) => addCustomRecurring(entry))
  ipcMain.handle('customRecurring:update', (_, id, updates) => editCustomRecurring(id, updates))
  ipcMain.handle('customRecurring:delete', (_, id) => removeCustomRecurring(id))
}
