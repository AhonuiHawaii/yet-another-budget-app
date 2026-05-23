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
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useTheme } from 'vuetify'
import { useUserSettingsStore } from '../stores/userSettings'

const theme = useTheme()
const userSettings = useUserSettingsStore()

const baseThemes = [
  { title: 'Pastel', value: 'pastel' },
  { title: 'Blue Grey', value: 'blueGrey' },
  { title: 'Black & White', value: 'blackWhite' }
]

const currentThemeName = theme.global.name.value
let initialBase = 'pastel'
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
</script>
