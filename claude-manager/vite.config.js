import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 8081,
    host: '0.0.0.0',  // 允许外部访问
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'ai.lqqmail.icu',
      'admin.lqqmail.icu',
      'claude.lqqmail.icu',
      'admin.lqqmail.xyz'
    ]
  },
  define: {
    __DEV__: mode === 'development'
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : []
  }
}))
