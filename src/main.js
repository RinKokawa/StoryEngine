import { createApp } from 'vue'
import './style.css'
import './assets/themes.css'
import App from './App.vue'

// 开发环境下导入测试工具
if (import.meta.env.DEV) {
  import('./utils/settingsTest.js')
  import('./utils/settingsValidator.js')
}

const app = createApp(App)
app.mount('#app')