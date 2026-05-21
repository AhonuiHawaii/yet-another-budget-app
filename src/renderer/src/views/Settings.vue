<template>
  <v-container fluid class="pa-3">
    <v-row>
      <v-col cols="12">
        <v-card rounded elevation="2" class="mb-3">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="primary" size="20" :opacity="0.7">mdi-palette-outline</v-icon>
            </template>
            <div class="d-flex align-center justify-space-between w-100">
              <v-card-title class="text-h6 font-weight-bold pl-2">Appearance</v-card-title>
              <v-switch
                v-model="isDark"
                label="Dark Mode"
                color="primary"
                @update:model-value="updateTheme"
                inset
                hide-details
                density="compact"
                class="flex-grow-0"
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
                  class="cursor-pointer transition-swing h-100 d-flex flex-column"
                  @click="selectTheme(themeOption.value)"
                  hover
                >
                  <v-img
                    :src="getThemeImage(themeOption.value)"
                    height="160"
                    cover
                    class="bg-surface-variant flex-grow-0"
                  >
                    <template v-slot:placeholder>
                      <div class="d-flex align-center justify-center fill-height bg-surface-variant text-medium-emphasis">
                        <v-icon size="40">mdi-image-outline</v-icon>
                      </div>
                    </template>
                  </v-img>
                  
                  <v-card-text class="text-center text-subtitle-1 font-weight-bold d-flex align-center justify-center flex-grow-1">
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

        <v-card rounded elevation="2" class="mb-3">
          <v-card-item class="pa-4 pb-0">
            <template #prepend>
              <v-icon color="primary" size="20" :opacity="0.7">mdi-shield-lock-outline</v-icon>
            </template>
            <v-card-title class="text-h6 font-weight-bold pl-2">Privacy &amp; Data</v-card-title>
          </v-card-item>

          <v-card-text class="pt-3">
            <v-alert
              type="success"
              variant="tonal"
              icon="mdi-lan-disconnect"
              class="mb-3"
              border="start"
            >
              <div class="font-weight-bold mb-1">Your data never leaves this device.</div>
              <div class="text-body-2">
                YABA does not transmit, sync, or upload any of your financial data to any server, website, cloud, or third party. There are no accounts, no telemetry, and no analytics.
              </div>
            </v-alert>

            <v-list density="compact" class="bg-transparent pa-0">
              <v-list-item prepend-icon="mdi-database-lock" class="px-0">
                <v-list-item-title class="font-weight-medium">Encrypted at rest</v-list-item-title>
                <v-list-item-subtitle class="text-wrap">
                  The local database is encrypted with a 256-bit key.
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item prepend-icon="mdi-account-lock" class="px-0">
                <v-list-item-title class="font-weight-medium">Tied to your user account</v-list-item-title>
                <v-list-item-subtitle class="text-wrap">
                  The encryption key is sealed to your operating-system user (DPAPI on Windows). Other users on this computer cannot open your data.
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item prepend-icon="mdi-archive-lock" class="px-0">
                <v-list-item-title class="font-weight-medium">Encrypted backups</v-list-item-title>
                <v-list-item-subtitle class="text-wrap">
                  Backup exports use AES-256-GCM with a passphrase you choose. Backups are stored wherever you save them — never uploaded.
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item prepend-icon="mdi-bank-off-outline" class="px-0">
                <v-list-item-title class="font-weight-medium">No bank login</v-list-item-title>
                <v-list-item-subtitle class="text-wrap">
                  YABA reads only the OFX/QFX files you select manually. It never contacts your bank.
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useTheme } from 'vuetify'

const theme = useTheme()

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
}

const selectTheme = (baseValue) => {
  selectedBaseTheme.value = baseValue
  updateTheme()
}
</script>
