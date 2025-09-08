import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/variables.scss'
import './styles/themes/light.scss'
import './styles/themes/dark.scss'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')