import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './style.css'
import './styles/claude-colors.css'

const app = createApp(App)
const pinia = createPinia()

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(ElementPlus)
app.use(router)

// 初始化认证状态
const authStore = useAuthStore()

// 异步初始化认证状态
authStore.initAuth().then(() => {
  app.mount('#app')
}).catch((error) => {
  console.error('Auth initialization failed:', error)
  app.mount('#app')
})
