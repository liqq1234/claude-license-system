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
    port: 8080,
    open: true
  },
  define: {
    // 在生产环境中禁用 console
    __DEV__: mode === 'development'
  },
  esbuild: {
    // 在生产环境中移除 console 和 debugger
    drop: mode === 'production' ? ['console', 'debugger'] : []
  }
}))
