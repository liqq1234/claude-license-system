// vite.config.js
import { defineConfig } from 'vite'      // 必须导入 defineConfig
import vue from '@vitejs/plugin-vue'     // vue 插件
import { resolve } from 'path'           // resolve 用于路径别名

export default defineConfig(({ mode }) => ({
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
      'ai.lqqmail.icu',   // 前端访问域名
      'admin.lqqmail.icu', // 管理后台域名
      'claude.lqqmail.icu'
    ]
  },
  define: {
    __DEV__: mode === 'development'
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : []
  }
}))
