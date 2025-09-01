import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import * as parserVue from 'vue-eslint-parser'
import configTypeScript from '@vue/eslint-config-typescript'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  ...configTypeScript(),

  {
    languageOptions: {
      parser: parserVue,
      parserOptions: {
        parser: '@typescript-eslint/parser',
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
      },
    },
    rules: {
      // Vue.js 相关规则
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'error',
      'vue/no-unused-components': 'error', // 更严格：未使用组件报错

      // JavaScript/TypeScript 规则
      'no-unused-vars': 'error', // 更严格：未使用变量报错
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error', // 更严格：应该用const的地方报错
      'no-var': 'error', // 禁用var

      // TypeScript 规则
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',

      // 额外的冗余代码检查
      'no-unreachable': 'error', // 检查不可达代码
      'no-duplicate-imports': 'error', // 检查重复导入
    },
  },
]
