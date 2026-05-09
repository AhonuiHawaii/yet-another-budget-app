import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const SELECTED_MONTH_KEY = 'budget.selectedMonth'

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
}

function isValidMonth(value) {
  return /^\d{6}$/.test(String(value || ''))
}

function readStoredMonth() {
  const stored = localStorage.getItem(SELECTED_MONTH_KEY)
  return isValidMonth(stored) ? stored : null
}

function formatMonth(value) {
  if (!isValidMonth(value)) return 'Select Month'

  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6)) - 1

  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
}

export const useUserSettingsStore = defineStore('userSettings', () => {
  const selectedMonth = ref(readStoredMonth() || getCurrentMonth())

  const selectedMonthLabel = computed(() => formatMonth(selectedMonth.value))

  function setSelectedMonth(month) {
    if (!isValidMonth(month)) return

    selectedMonth.value = month
    localStorage.setItem(SELECTED_MONTH_KEY, month)
  }

  function setSelectedMonthFromDate(date) {
    if (!date) return

    const selectedDate = new Date(date)
    setSelectedMonth(
      `${selectedDate.getFullYear()}${String(selectedDate.getMonth() + 1).padStart(2, '0')}`
    )
  }

  function initializeSelectedMonth(availableMonths = []) {
    if (readStoredMonth()) return

    const latestMonth = availableMonths.at(-1)
    if (isValidMonth(latestMonth)) setSelectedMonth(latestMonth)
  }

  return {
    selectedMonth,
    selectedMonthLabel,
    setSelectedMonth,
    setSelectedMonthFromDate,
    initializeSelectedMonth
  }
})
