import { contextBridge, ipcRenderer } from 'electron'
import { name, version, productName } from '../../package.json'

const electronAPI = {
  ipcRenderer: {
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    sendSync: (channel, ...args) => ipcRenderer.sendSync(channel, ...args),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    postMessage: (channel, message, transfer) =>
      ipcRenderer.postMessage(channel, message, transfer),
    on: (channel, listener) => {
      ipcRenderer.on(channel, listener)
      return () => ipcRenderer.off(channel, listener)
    },
    once: (channel, listener) => ipcRenderer.once(channel, listener),
    removeListener: (channel, listener) => ipcRenderer.removeListener(channel, listener),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
    off: (channel, listener) => ipcRenderer.off(channel, listener)
  }
}

const api = {
  name,
  version,
  productName,
  platform: process.platform,
  window: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
    onMaximizedChange: (cb) => {
      const listener = (_, isMax) => cb(isMax)
      ipcRenderer.on('window-maximized-changed', listener)
      return () => ipcRenderer.off('window-maximized-changed', listener)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
