import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 8080,
    host: '0.0.0.0',  // 允许外部访问
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'ai.lqqmail.icu',
      'admin.lqqmail.icu'
    ]
    // 移除代理配置，直接请求后端
  }
})