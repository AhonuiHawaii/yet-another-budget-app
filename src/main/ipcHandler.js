import { ipcMain } from 'electron'
import { importAccount, importTransactions } from './main.js'

export function setupIpcHandlers() {
  ipcMain.handle('ofx:importAccount', async (event, ofxData) => {
    return await importAccount(ofxData)
  })

  ipcMain.handle('ofx:importTransactions', async (event, ofxData) => {
    return await importTransactions(ofxData)
  })
}
