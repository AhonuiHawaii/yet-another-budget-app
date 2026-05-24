import { defineStore } from 'pinia'
import { ref } from 'vue'

const THEME_KEY = 'budget.theme'
const DEFAULT_THEME = 'pastelLight'

const CURRENCY_KEY = 'budget.currency'
const CURRENCY_POSITION_KEY = 'budget.currencyPosition'
const DEFAULT_CURRENCY = 'USD'
const DEFAULT_CURRENCY_POSITION = 'before'

const WEEK_START_KEY = 'budget.weekStart'
const DEFAULT_WEEK_START = 'monday'

const DECIMAL_PLACES_KEY = 'budget.decimalPlaces'
const DEFAULT_DECIMAL_PLACES = '2'

const DATE_FORMAT_KEY = 'budget.dateFormat'
const DEFAULT_DATE_FORMAT = 'MM/DD/YYYY'

export const useUserSettingsStore = defineStore('userSettings', () => {
  const theme = ref(localStorage.getItem(THEME_KEY) || DEFAULT_THEME)
  const currency = ref(localStorage.getItem(CURRENCY_KEY) || DEFAULT_CURRENCY)
  const currencyPosition = ref(localStorage.getItem(CURRENCY_POSITION_KEY) || DEFAULT_CURRENCY_POSITION)
  const weekStart = ref(localStorage.getItem(WEEK_START_KEY) || DEFAULT_WEEK_START)
  const decimalPlaces = ref(localStorage.getItem(DECIMAL_PLACES_KEY) || DEFAULT_DECIMAL_PLACES)
  const dateFormat = ref(localStorage.getItem(DATE_FORMAT_KEY) || DEFAULT_DATE_FORMAT)

  function setTheme(newTheme) {
    if (!newTheme) return
    theme.value = newTheme
    localStorage.setItem(THEME_KEY, newTheme)
  }

  function setCurrency(newCurrency) {
    if (!newCurrency) return
    currency.value = newCurrency
    localStorage.setItem(CURRENCY_KEY, newCurrency)
  }

  function setCurrencyPosition(newPosition) {
    if (!newPosition) return
    currencyPosition.value = newPosition
    localStorage.setItem(CURRENCY_POSITION_KEY, newPosition)
  }

  function setWeekStart(day) {
    if (!day) return
    weekStart.value = day
    localStorage.setItem(WEEK_START_KEY, day)
  }

  function setDecimalPlaces(places) {
    if (places == null) return
    decimalPlaces.value = String(places)
    localStorage.setItem(DECIMAL_PLACES_KEY, String(places))
  }

  function setDateFormat(format) {
    if (!format) return
    dateFormat.value = format
    localStorage.setItem(DATE_FORMAT_KEY, format)
  }

  return {
    theme, setTheme,
    currency, setCurrency,
    currencyPosition, setCurrencyPosition,
    weekStart, setWeekStart,
    decimalPlaces, setDecimalPlaces,
    dateFormat, setDateFormat
  }
})
