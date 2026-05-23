import { defineStore } from 'pinia'
import { ref } from 'vue'

const THEME_KEY = 'budget.theme'
const DEFAULT_THEME = 'pastelLight'

export const useUserSettingsStore = defineStore('userSettings', () => {
  const theme = ref(localStorage.getItem(THEME_KEY) || DEFAULT_THEME)

  function setTheme(newTheme) {
    if (!newTheme) return
    theme.value = newTheme
    localStorage.setItem(THEME_KEY, newTheme)
  }

  return { theme, setTheme }
})
