import './assets/main.css'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createApp } from 'vue'
import App from './App.vue'

import { createVuetify } from 'vuetify'
import themes from './theme'

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'darkBlue',
    themes
  }
})

createApp(App).use(vuetify).mount('#app')
