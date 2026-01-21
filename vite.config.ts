import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 开发服务器配置
  server: {
    port: 5173,
    open: false, // Electron 模式下不自动打开浏览器
  },
  // 构建配置
  build: {
    outDir: 'dist',
    target: 'esnext',
    sourcemap: true,
  },
  // Electron 生产模式使用 file:// 协议，必须使用相对路径
  base: './',
})
