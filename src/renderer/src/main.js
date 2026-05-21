import './assets/main.css'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import 'material-symbols'

import { createPinia } from 'pinia'

import { createApp } from 'vue'
import App from './App.vue'

import { createVuetify } from 'vuetify'
import themes from './theme'

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'pastelLight',
    themes
  }
})

createApp(App).use(vuetify).use(createPinia()).mount('#app')
