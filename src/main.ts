// src/main.ts
/**
 * 🚀 0xNote 应用入口
 */

import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'

// 导入全局样式
import '@/assets/styles/index.css'

const app = createApp(App)

// 注册 Pinia 状态管理
app.use(createPinia())

// 挂载应用
app.mount('#app')

console.log('[0xNote] 应用启动中...')
