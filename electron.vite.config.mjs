import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@assets': resolve('src/renderer/src/assets'),
        '@store': resolve('src/renderer/src/stores'),
        '@views': resolve('src/renderer/src/views'),
        '@components': resolve('src/renderer/src/components')
      }
    },
    plugins: [vue()]
  }
})
