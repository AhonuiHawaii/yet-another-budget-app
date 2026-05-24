<template>
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12">
        <v-card rounded="sm" elevation="2" class="mb-3">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="primary" size="20" :opacity="0.7">mdi-palette-outline</v-icon>
            </template>
            <div class="d-flex align-center justify-space-between w-100">
              <v-card-title class="text-h6 font-weight-bold pl-2">Appearance</v-card-title>
              <v-switch
                v-model="isDark"
                inset
                label="Dark Mode"
                color="primary"
                density="compact"
                hide-details
                class="flex-grow-0"
                @update:model-value="updateTheme"
              ></v-switch>
            </div>
          </v-card-item>

          <v-card-text class="pt-4">
            <v-row>
              <v-col
                v-for="themeOption in baseThemes"
                :key="themeOption.value"
                cols="12"
                sm="6"
                md="4"
              >
                <v-card
                  :variant="selectedBaseTheme === themeOption.value ? 'outlined' : 'elevated'"
                  :color="selectedBaseTheme === themeOption.value ? 'primary' : undefined"
                  :elevation="selectedBaseTheme === themeOption.value ? 0 : 2"
                  hover
                  class="cursor-pointer transition-swing h-100 d-flex flex-column"
                  @click="selectTheme(themeOption.value)"
                >
                  <v-img
                    :src="getThemeImage(themeOption.value)"
                    height="160"
                    cover
                    class="bg-surface-variant flex-grow-0"
                  >
                    <template #placeholder>
                      <div
                        class="d-flex align-center justify-center fill-height bg-surface-variant text-medium-emphasis"
                      >
                        <v-icon size="40">mdi-image-outline</v-icon>
                      </div>
                    </template>
                  </v-img>

                  <v-card-text
                    class="text-center text-subtitle-1 font-weight-bold d-flex align-center justify-center flex-grow-1"
                  >
                    {{ themeOption.title }}
                    <v-icon
                      v-if="selectedBaseTheme === themeOption.value"
                      color="primary"
                      class="ml-2"
                      size="20"
                    >
                      mdi-check-circle
                    </v-icon>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card rounded="sm" elevation="2" class="mb-3">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="primary" size="20" :opacity="0.7">mdi-cog-outline</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">Settings</v-card-title>
          </v-card-item>

          <v-card-text class="pt-4">
            <v-row align="center">
              <v-col cols="12">
                <div class="d-flex align-center">
                  <span class="text-caption text-medium-emphasis text-no-wrap setting-label"
                    >Currency</span
                  >
                  <v-autocomplete
                    :model-value="selectedCurrency"
                    :items="currencies"
                    item-title="label"
                    item-value="code"
                    variant="solo-filled"
                    density="compact"
                    hide-details
                    @update:model-value="updateCurrency"
                  ></v-autocomplete>
                </div>
              </v-col>

              <v-col cols="12">
                <div class="d-flex align-center">
                  <span class="text-caption text-medium-emphasis text-no-wrap setting-label"
                    >Symbol Position</span
                  >
                  <v-btn-toggle
                    :model-value="selectedCurrencyPosition"
                    mandatory
                    density="compact"
                    color="primary"
                    variant="outlined"
                    @update:model-value="updateCurrencyPosition"
                  >
                    <v-btn value="before" size="small">{{ currencyPreviewSymbol }}100</v-btn>
                    <v-btn value="after" size="small">100{{ currencyPreviewSymbol }}</v-btn>
                  </v-btn-toggle>
                </div>
              </v-col>

              <v-col cols="12">
                <div class="d-flex align-center">
                  <span class="text-caption text-medium-emphasis text-no-wrap setting-label"
                    >Date Format</span
                  >
                  <v-btn-toggle
                    :model-value="selectedDateFormat"
                    mandatory
                    density="compact"
                    color="primary"
                    variant="outlined"
                    @update:model-value="updateDateFormat"
                  >
                    <v-btn
                      v-for="fmt in dateFormats"
                      :key="fmt.value"
                      :value="fmt.value"
                      size="small"
                    >
                      {{ fmt.example }}
                    </v-btn>
                  </v-btn-toggle>
                </div>
              </v-col>

              <v-col cols="12">
                <div class="d-flex align-center">
                  <span class="text-caption text-medium-emphasis text-no-wrap setting-label"
                    >Week Starts</span
                  >
                  <v-btn-toggle
                    :model-value="selectedWeekStart"
                    mandatory
                    density="compact"
                    color="primary"
                    variant="outlined"
                    @update:model-value="updateWeekStart"
                  >
                    <v-btn value="sunday" size="small">Sunday</v-btn>
                    <v-btn value="monday" size="small">Monday</v-btn>
                  </v-btn-toggle>
                </div>
              </v-col>

              <v-col cols="12">
                <div class="d-flex align-center">
                  <span class="text-caption text-medium-emphasis text-no-wrap setting-label"
                    >Decimal Places</span
                  >
                  <v-btn-toggle
                    :model-value="selectedDecimalPlaces"
                    mandatory
                    density="compact"
                    color="primary"
                    variant="outlined"
                    @update:model-value="updateDecimalPlaces"
                  >
                    <v-btn value="0" size="small">0</v-btn>
                    <v-btn value="1" size="small">1</v-btn>
                    <v-btn value="2" size="small">2</v-btn>
                  </v-btn-toggle>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTheme } from 'vuetify'
import { useUserSettingsStore } from '../stores/userSettings'

const theme = useTheme()
const userSettings = useUserSettingsStore()

const baseThemes = [
  { title: 'Pastel Pink', value: 'pastelPink' },
  { title: 'Pastel Blue', value: 'pastelBlue' },
  { title: 'Pastel Green', value: 'pastelGreen' },
  { title: 'Pastel Yellow', value: 'pastelYellow' },
  { title: 'Blue Grey', value: 'blueGrey' },
  { title: 'Black & White', value: 'blackWhite' }
]

const currentThemeName = theme.global.name.value
let initialBase = 'pastelPink'
let initialDark = false

if (currentThemeName.includes('Dark')) {
  initialDark = true
  initialBase = currentThemeName.replace('Dark', '')
} else if (currentThemeName.includes('Light')) {
  initialDark = false
  initialBase = currentThemeName.replace('Light', '')
}

const selectedBaseTheme = ref(initialBase)
const isDark = ref(initialDark)

const getThemeImage = (baseThemeName) => {
  // Construct a dynamic URL for the theme image.
  // Make sure you place images like "pastelLight.png" or "pastelDark.png" in src/assets/themes/
  const mode = isDark.value ? 'Dark' : 'Light'
  const fileName = `${baseThemeName}${mode}.png`
  return new URL(`../assets/themes/${fileName}`, import.meta.url).href
}

const updateTheme = () => {
  const mode = isDark.value ? 'Dark' : 'Light'
  const newTheme = `${selectedBaseTheme.value}${mode}`
  if (typeof theme.change === 'function') {
    theme.change(newTheme)
  } else {
    theme.global.name.value = newTheme
  }
  userSettings.setTheme(newTheme)
}

const selectTheme = (baseValue) => {
  selectedBaseTheme.value = baseValue
  updateTheme()
}

const currencies = [
  { code: 'USD', symbol: '$', label: 'USD - US Dollar ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR - Euro (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP - British Pound (£)' },
  { code: 'JPY', symbol: '¥', label: 'JPY - Japanese Yen (¥)' },
  { code: 'CAD', symbol: '$', label: 'CAD - Canadian Dollar ($)' },
  { code: 'AUD', symbol: '$', label: 'AUD - Australian Dollar ($)' },
  { code: 'CHF', symbol: 'Fr', label: 'CHF - Swiss Franc (Fr)' },
  { code: 'CNY', symbol: '¥', label: 'CNY - Chinese Yuan (¥)' },
  { code: 'INR', symbol: '₹', label: 'INR - Indian Rupee (₹)' },
  { code: 'BRL', symbol: 'R$', label: 'BRL - Brazilian Real (R$)' },
  { code: 'MXN', symbol: '$', label: 'MXN - Mexican Peso ($)' },
  { code: 'SGD', symbol: '$', label: 'SGD - Singapore Dollar ($)' },
  { code: 'HKD', symbol: '$', label: 'HKD - Hong Kong Dollar ($)' },
  { code: 'NOK', symbol: 'kr', label: 'NOK - Norwegian Krone (kr)' },
  { code: 'SEK', symbol: 'kr', label: 'SEK - Swedish Krona (kr)' },
  { code: 'DKK', symbol: 'kr', label: 'DKK - Danish Krone (kr)' },
  { code: 'NZD', symbol: '$', label: 'NZD - New Zealand Dollar ($)' },
  { code: 'ZAR', symbol: 'R', label: 'ZAR - South African Rand (R)' },
  { code: 'KRW', symbol: '₩', label: 'KRW - South Korean Won (₩)' },
  { code: 'TRY', symbol: '₺', label: 'TRY - Turkish Lira (₺)' },
  { code: 'RUB', symbol: '₽', label: 'RUB - Russian Ruble (₽)' },
  { code: 'PLN', symbol: 'zł', label: 'PLN - Polish Złoty (zł)' },
  { code: 'PHP', symbol: '₱', label: 'PHP - Philippine Peso (₱)' },
  { code: 'IDR', symbol: 'Rp', label: 'IDR - Indonesian Rupiah (Rp)' },
  { code: 'MYR', symbol: 'RM', label: 'MYR - Malaysian Ringgit (RM)' },
  { code: 'THB', symbol: '฿', label: 'THB - Thai Baht (฿)' },
  { code: 'AED', symbol: 'د.إ', label: 'AED - UAE Dirham (د.إ)' },
  { code: 'SAR', symbol: '﷼', label: 'SAR - Saudi Riyal (﷼)' }
]

const CURRENCY_REGIONAL_DEFAULTS = {
  USD: {
    currencyPosition: 'before',
    dateFormat: 'MM/DD/YYYY',
    weekStart: 'sunday',
    decimalPlaces: '2'
  },
  EUR: {
    currencyPosition: 'after',
    dateFormat: 'DD/MM/YYYY',
    weekStart: 'monday',
    decimalPlaces: '2'
  },
  GBP: {
    currencyPosition: 'before',
    dateFormat: 'DD/MM/YYYY',
    weekStart: 'monday',
    decimalPlaces: '2'
  },
  JPY: {
    currencyPosition: 'before',
    dateFormat: 'YYYY-MM-DD',
    weekStart: 'sunday',
    decimalPlaces: '0'
  },
  CAD: {
    currencyPosition: 'before',
    dateFormat: 'MM/DD/YYYY',
    weekStart: 'sunday',
    decimalPlaces: '2'
  },
  AUD: {
    currencyPosition: 'before',
    dateFormat: 'DD/MM/YYYY',
    weekStart: 'monday',
    decimalPlaces: '2'
  },
  CHF: {
    currencyPosition: 'before',
    dateFormat: 'DD.MM.YYYY',
    weekStart: 'monday',
    decimalPlaces: '2'
  },
  CNY: {
    currencyPosition: 'before',
    dateFormat: 'YYYY-MM-DD',
    weekStart: 'monday',
    decimalPlaces: '2'
  },
  INR: {
    currencyPosition: 'before',
    dateFormat: 'DD/MM/YYYY',
    weekStart: 'sunday',
    decimalPlaces: '2'
  },
  BRL: {
    currencyPosition: 'before',
    dateFormat: 'DD/MM/YYYY',
    weekStart: 'sunday',
    decimalPlaces: '2'
  },
  MXN: {
    currencyPosition: 'before',
    dateFormat: 'DD/MM/YYYY',
    weekStart: 'sunday',
    decimalPlaces: '2'
  },
  SGD: {
    currencyPosition: 'before',
    dateFormat: 'DD/MM/YYYY',
    weekStart: 'sunday',
    decimalPlaces: '2'
  },
  HKD: {
    currencyPosition: 'before',
    dateFormat: 'DD/MM/YYYY',
    weekStart: 'sunday',
    decimalPlaces: '2'
  },
  NOK: {
    currencyPosition: 'after',
    dateFormat: 'DD.MM.YYYY',
    weekStart: 'monday',
    decimalPlaces: '2'
  },
  SEK: {
    currencyPosition: 'after',
    dateFormat: 'YYYY-MM-DD',
    weekStart: 'monday',
    decimalPlaces: '2'
  },
  DKK: {
    currencyPosition: 'after',
    dateFormat: 'DD.MM.YYYY',
    weekStart: 'monday',
    decimalPlaces: '2'
  },
  NZD: {
    currencyPosition: 'before',
    dateFormat: 'DD/MM/YYYY',
    weekStart: 'monday',
    decimalPlaces: '2'
  },
  ZAR: {
    currencyPosition: 'before',
    dateFormat: 'YYYY-MM-DD',
    weekStart: 'sunday',
    decimalPlaces: '2'
  },
  KRW: {
    currencyPosition: 'before',
    dateFormat: 'YYYY-MM-DD',
    weekStart: 'sunday',
    decimalPlaces: '0'
  },
  TRY: {
    currencyPosition: 'after',
    dateFormat: 'DD.MM.YYYY',
    weekStart: 'monday',
    decimalPlaces: '2'
  },
  RUB: {
    currencyPosition: 'after',
    dateFormat: 'DD.MM.YYYY',
    weekStart: 'monday',
    decimalPlaces: '2'
  },
  PLN: {
    currencyPosition: 'after',
    dateFormat: 'DD.MM.YYYY',
    weekStart: 'monday',
    decimalPlaces: '2'
  },
  PHP: {
    currencyPosition: 'before',
    dateFormat: 'MM/DD/YYYY',
    weekStart: 'sunday',
    decimalPlaces: '2'
  },
  IDR: {
    currencyPosition: 'before',
    dateFormat: 'DD/MM/YYYY',
    weekStart: 'monday',
    decimalPlaces: '0'
  },
  MYR: {
    currencyPosition: 'before',
    dateFormat: 'DD/MM/YYYY',
    weekStart: 'monday',
    decimalPlaces: '2'
  },
  THB: {
    currencyPosition: 'before',
    dateFormat: 'DD/MM/YYYY',
    weekStart: 'sunday',
    decimalPlaces: '2'
  },
  AED: {
    currencyPosition: 'before',
    dateFormat: 'DD/MM/YYYY',
    weekStart: 'monday',
    decimalPlaces: '2'
  },
  SAR: {
    currencyPosition: 'before',
    dateFormat: 'DD/MM/YYYY',
    weekStart: 'sunday',
    decimalPlaces: '2'
  }
}

const selectedCurrency = ref(userSettings.currency)
const selectedCurrencyPosition = ref(userSettings.currencyPosition)

const currencyPreviewSymbol = computed(
  () => currencies.find((c) => c.code === selectedCurrency.value)?.symbol ?? selectedCurrency.value
)

const updateCurrency = (code) => {
  selectedCurrency.value = code
  userSettings.setCurrency(code)
  const defaults = CURRENCY_REGIONAL_DEFAULTS[code]
  if (defaults) {
    selectedCurrencyPosition.value = defaults.currencyPosition
    selectedDateFormat.value = defaults.dateFormat
    selectedWeekStart.value = defaults.weekStart
    selectedDecimalPlaces.value = defaults.decimalPlaces
    userSettings.setCurrencyPosition(defaults.currencyPosition)
    userSettings.setDateFormat(defaults.dateFormat)
    userSettings.setWeekStart(defaults.weekStart)
    userSettings.setDecimalPlaces(defaults.decimalPlaces)
  }
}

const updateCurrencyPosition = (position) => {
  selectedCurrencyPosition.value = position
  userSettings.setCurrencyPosition(position)
}

const _now = new Date()
const _d = String(_now.getDate()).padStart(2, '0')
const _m = String(_now.getMonth() + 1).padStart(2, '0')
const _y = _now.getFullYear()
const _mmm = _now.toLocaleString('en', { month: 'short' })

const dateFormats = [
  { value: 'MM/DD/YYYY', example: `${_m}/${_d}/${_y}` },
  { value: 'DD/MM/YYYY', example: `${_d}/${_m}/${_y}` },
  { value: 'YYYY-MM-DD', example: `${_y}-${_m}-${_d}` },
  { value: 'DD.MM.YYYY', example: `${_d}.${_m}.${_y}` },
  { value: 'MMM DD, YYYY', example: `${_mmm} ${_d}, ${_y}` }
]

const selectedDateFormat = ref(userSettings.dateFormat)
const selectedWeekStart = ref(userSettings.weekStart)
const selectedDecimalPlaces = ref(userSettings.decimalPlaces)

const updateDateFormat = (format) => {
  selectedDateFormat.value = format
  userSettings.setDateFormat(format)
}

const updateWeekStart = (day) => {
  selectedWeekStart.value = day
  userSettings.setWeekStart(day)
}

const updateDecimalPlaces = (places) => {
  selectedDecimalPlaces.value = places
  userSettings.setDecimalPlaces(places)
}
</script>

<style scoped>
.setting-label {
  width: 130px;
  flex-shrink: 0;
}
</style>
