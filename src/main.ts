import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { recuperarAposDeploy, registrarPWA } from './app/pwa'
import { router } from './app/router'
import 'vue-sonner/style.css'
import './shared/styles/main.css'

recuperarAposDeploy(router)
createApp(App).use(createPinia()).use(router).mount('#app')
registrarPWA()
