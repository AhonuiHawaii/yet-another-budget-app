import { ipcMain, dialog, app } from 'electron'
import db from './db.js'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import dpapi from 'node-dpapi-prebuilt'

export function setupBackupHandlers() {
  ipcMain.handle('backup:export', async (event, passphrase) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Export Backup',
        defaultPath: path.join(app.getPath('documents'), 'budget_backup.enc'),
        filters: [{ name: 'Encrypted Backup', extensions: ['enc'] }]
      })

      if (canceled || !filePath) return { success: false, canceled: true }

      const DB_DIR = path.join(app.getPath('userData'), 'data')
      const KEY_PATH = path.join(DB_DIR, 'budget.key')

      // 1. Read and unprotect the current DPAPI key
      let rawKey
      try {
        const protectedKey = fs.readFileSync(KEY_PATH)
        rawKey = dpapi.unprotectData(protectedKey, null, 'CurrentUser').toString('utf8')
      } catch (err) {
        throw new Error('Failed to unprotect DPAPI key: ' + err.message)
      }

      // 2. Perform a safe backup of the active SQLite database
      const tempDbPath = path.join(DB_DIR, `budget_temp_${Date.now()}.db`)
      const DB_PATH = path.join(DB_DIR, 'budget.db')

      // Force all WAL data into the main database file safely
      db.pragma('wal_checkpoint(TRUNCATE)')

      // Since fs.copyFileSync is synchronous, no other JS code can write
      // to the DB during the copy, making this a safe snapshot of the main file.
      fs.copyFileSync(DB_PATH, tempDbPath)

      // 3. Setup encryption (AES-256-GCM)
      const salt = crypto.randomBytes(16)
      const iv = crypto.randomBytes(12)
      const key = crypto.scryptSync(passphrase, salt, 32)
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

      const out = fs.createWriteStream(filePath)

      await new Promise((resolve, reject) => {
        out.on('error', reject)

        // Write salt and IV first
        out.write(salt)
        out.write(iv)

        cipher.on('data', (chunk) => out.write(chunk))
        cipher.on('end', () => {
          // GCM auth tag must be appended at the end
          out.write(cipher.getAuthTag())
          out.end()
          resolve()
        })
        cipher.on('error', reject)

        // Write the raw DPAPI key length and value into the encrypted stream
        const lenBuf = Buffer.alloc(2)
        lenBuf.writeUInt16LE(rawKey.length, 0)
        cipher.write(lenBuf)
        cipher.write(Buffer.from(rawKey, 'utf8'))

        // Pipe the safely backed up database into the cipher
        const rs = fs.createReadStream(tempDbPath)
        rs.on('data', (chunk) => cipher.write(chunk))
        rs.on('end', () => cipher.end())
        rs.on('error', reject)
      })

      // Clean up temporary DB copy
      if (fs.existsSync(tempDbPath)) {
        fs.unlinkSync(tempDbPath)
      }

      return { success: true }
    } catch (err) {
      console.error('Export Backup Error:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('backup:import', async (event, passphrase) => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Import Backup',
        properties: ['openFile'],
        filters: [{ name: 'Encrypted Backup', extensions: ['enc'] }]
      })

      if (canceled || filePaths.length === 0) return { success: false, canceled: true }
      const sourcePath = filePaths[0]

      const stat = fs.statSync(sourcePath)
      if (stat.size < 44) throw new Error('Invalid backup file (too small)')

      // 1. Read header (16 bytes salt, 12 bytes IV) and footer (16 bytes AuthTag)
      const fd = fs.openSync(sourcePath, 'r')
      const salt = Buffer.alloc(16)
      fs.readSync(fd, salt, 0, 16, 0)

      const iv = Buffer.alloc(12)
      fs.readSync(fd, iv, 0, 12, 16)

      const authTag = Buffer.alloc(16)
      fs.readSync(fd, authTag, 0, 16, stat.size - 16)
      fs.closeSync(fd)

      // 2. Setup decryption
      const derivedKey = crypto.scryptSync(passphrase, salt, 32)
      const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv)
      decipher.setAuthTag(authTag)

      const DB_DIR = path.join(app.getPath('userData'), 'data')
      const tempDbPath = path.join(DB_DIR, `budget_import_${Date.now()}.db`)

      let isHeaderParsed = false
      let keyLen = 0
      let rawKey = ''
      let buffer = Buffer.alloc(0)
      let dbOut

      await new Promise((resolve, reject) => {
        // Read only the ciphertext portion (skip 28 byte header and 16 byte footer)
        const rs = fs.createReadStream(sourcePath, { start: 28, end: stat.size - 16 - 1 })

        decipher.on('data', (chunk) => {
          if (!isHeaderParsed) {
            buffer = Buffer.concat([buffer, chunk])
            if (buffer.length >= 2 && keyLen === 0) {
              keyLen = buffer.readUInt16LE(0)
            }
            if (keyLen > 0 && buffer.length >= 2 + keyLen) {
              rawKey = buffer.toString('utf8', 2, 2 + keyLen)
              isHeaderParsed = true

              dbOut = fs.createWriteStream(tempDbPath)
              dbOut.on('error', reject)

              const remaining = buffer.subarray(2 + keyLen)
              if (remaining.length > 0) dbOut.write(remaining)
            }
          } else {
            dbOut.write(chunk)
          }
        })

        decipher.on('end', () => {
          if (dbOut) {
            dbOut.end(() => resolve())
          } else {
            reject(new Error('Backup file is empty or corrupted'))
          }
        })

        decipher.on('error', () => {
          reject(new Error('Incorrect passphrase or corrupted file'))
        })

        rs.on('error', reject)
        rs.pipe(decipher)
      })

      // 3. Overwrite current DB and Key
      db.close() // Close the current db connection so we can overwrite

      const DB_PATH = path.join(DB_DIR, 'budget.db')
      const KEY_PATH = path.join(DB_DIR, 'budget.key')

      fs.copyFileSync(tempDbPath, DB_PATH)
      fs.unlinkSync(tempDbPath)

      // Reprotect the key using DPAPI for this specific computer
      const protectedKey = dpapi.protectData(Buffer.from(rawKey), null, 'CurrentUser')
      fs.writeFileSync(KEY_PATH, protectedKey)

      // 4. Relaunch — db.close() cannot be undone on the same process; a fresh
      //    process is the only way to reinitialize the SQLite connection.
      //    Delay long enough for the IPC response to reach the renderer first.
      setTimeout(() => {
        app.relaunch()
        app.exit(0)
      }, 500)

      return { success: true }
    } catch (err) {
      console.error('Import Backup Error:', err)
      // Clean up any partially-written temp file left by a failed decryption
      const DB_DIR = path.join(app.getPath('userData'), 'data')
      try {
        fs.readdirSync(DB_DIR)
          .filter((f) => f.startsWith('budget_import_') && f.endsWith('.db'))
          .forEach((f) => fs.unlinkSync(path.join(DB_DIR, f)))
      } catch {}
      return { success: false, error: err.message }
    }
  })
}
