import { ipcMain } from 'electron'
import {
  importAccount,
  importTransactions,
  fetchTransactions,
  editTransaction,
  removeTransaction
} from './main.js'

export const setupIpcHandlers = () => {
  ipcMain.handle('ofx:importAccount', (_, ofxData) => importAccount(ofxData))
  ipcMain.handle('ofx:importTransactions', (_, ofxData) => importTransactions(ofxData))

  ipcMain.handle('transactions:fetch', (_, filters) => fetchTransactions(filters))
  ipcMain.handle('transactions:edit', (_, fitid, updates) => editTransaction(fitid, updates))
  ipcMain.handle('transactions:remove', (_, fitid) => removeTransaction(fitid))
}
