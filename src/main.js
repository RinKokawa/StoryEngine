import { createApp } from 'vue'
import './style.css'
import './assets/themes.css'
import App from './App.vue'
import router from './router'

// 开发环境下导入测试工具
if (import.meta.env.DEV) {
  import('./utils/settingsTest.js')
  import('./utils/settingsValidator.js')
}

const app = createApp(App)
app.use(router)
app.mount('#app')