<template>
  <div class="account-grid-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-text">正在加载账号列表...</div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <div class="error-text">加载失败，请重试</div>
      <button class="retry-btn" @click="$emit('retry')">重新加载</button>
    </div>

    <!-- 账号网格 -->
    <div v-else-if="accounts.length > 0" class="accounts-grid-desktop">
      <AccountCard
        v-for="account in accounts"
        :key="account.id || account.email"
        :account="account"
        :status="getAccountStatus(account.email)"
        :loading="getAccountLoading(account.email)"
        @click="handleAccountClick"
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📝</div>
      <div class="empty-text">暂无可用账号</div>
      <button class="refresh-btn" @click="$emit('retry')">刷新列表</button>
    </div>

    <!-- 调试面板 -->
    <div v-if="showDebugPanel" class="debug-panel">
      <div class="debug-header">
        <h3>🔧 调试面板</h3>
        <button @click="showDebugPanel = false" class="close-debug">×</button>
      </div>
      
      <div class="debug-content">
        <div class="debug-section">
          <h4>账户状态 ({{ Object.keys(accountsStatus).length }}个):</h4>
          <pre>{{ JSON.stringify(accountsStatus, null, 2) }}</pre>
        </div>
        
        <div class="debug-section">
          <h4>强制刷新值:</h4>
          <p>{{ forceRefreshStatus }}</p>
        </div>
        
        <div class="debug-actions">
          <button @click="testStatusUpdate" class="debug-btn primary">
            测试状态更新
          </button>
          <button @click="forceRefreshStatus++" class="debug-btn secondary">
            强制刷新UI
          </button>
          <button @click="clearAllStatus" class="debug-btn danger">
            清空所有状态
          </button>
        </div>
      </div>
    </div>

    <!-- 调试按钮 -->
    <div class="debug-toggle">
      <button @click="showDebugPanel = !showDebugPanel" class="toggle-debug-btn">
        {{ showDebugPanel ? '隐藏' : '显示' }}调试面板
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import AccountCard from './AccountCard.vue'

// Props
const props = defineProps({
  accounts: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['account-click', 'retry'])

// 响应式数据
const accountsStatus = reactive({})
const accountsLoading = reactive({})
const forceRefreshStatus = ref(0)
const showDebugPanel = ref(false)

// 计算属性
const getAccountStatus = (email) => {
  forceRefreshStatus.value // 建立响应式依赖
  return accountsStatus[email] || {}
}

const getAccountLoading = (email) => {
  return accountsLoading[email] || false
}

// 方法
const handleAccountClick = (account) => {
  console.log('🎯 AccountGrid: 账户被点击', account.email)
  
  // 设置加载状态
  setAccountLoading(account.email, true)
  
  // 发射事件给父组件
  emit('account-click', account)
}

const updateAccountStatus = (email, newStatus) => {
  console.log(`🎯 AccountGrid: 更新账户状态 ${email}`, newStatus)
  
  // 记录更新前的状态
  const oldStatus = accountsStatus[email]
  console.log(`📋 更新前状态:`, oldStatus)

  // 更新状态
  accountsStatus[email] = { ...accountsStatus[email], ...newStatus }
  
  // 记录更新后的状态
  console.log(`📋 更新后状态:`, accountsStatus[email])

  // 强制触发响应式更新
  const oldForceValue = forceRefreshStatus.value
  forceRefreshStatus.value++
  console.log(`🔄 强制刷新值: ${oldForceValue} -> ${forceRefreshStatus.value}`)

  console.log(`✅ 状态更新完成:`, accountsStatus[email])
}

const setAccountLoading = (email, loading) => {
  accountsLoading[email] = loading
}

const testStatusUpdate = () => {
  console.log("🧪 测试状态更新")
  
  if (props.accounts.length === 0) {
    console.log("❌ 没有账户可以测试")
    return
  }
  
  const testAccount = props.accounts[0]
  const testEmail = testAccount.email
  
  console.log(`🧪 测试账户: ${testEmail}`)
  
  const newStatus = {
    status: "available",
    status_text: "测试可用",
    color: "yellow",
    countdown: "3:00",
    remaining_seconds: 180,
    last_used: new Date().toISOString(),
  }
  
  updateAccountStatus(testEmail, newStatus)
}

const clearAllStatus = () => {
  console.log("🧹 清空所有状态")
  Object.keys(accountsStatus).forEach(key => delete accountsStatus[key])
  Object.keys(accountsLoading).forEach(key => delete accountsLoading[key])
  forceRefreshStatus.value++
}

// 暴露方法给父组件
defineExpose({
  updateAccountStatus,
  setAccountLoading,
  accountsStatus,
  forceRefreshStatus
})
</script>

<style scoped>
.account-grid-container {
  position: relative;
}

/* 桌面端账号卡片网格 - 固定4列布局 */
.accounts-grid-desktop {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  max-width: none;
}

/* 响应式网格布局 */
@media (min-width: 768px) {
  .accounts-grid-desktop {
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
  }
}

@media (min-width: 1024px) {
  .accounts-grid-desktop {
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
}

@media (min-width: 1200px) {
  .accounts-grid-desktop {
    grid-template-columns: repeat(4, 1fr);
    gap: 22px;
  }
}

@media (min-width: 1600px) {
  .accounts-grid-desktop {
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }
}

/* 加载状态 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.loading-text {
  font-size: 16px;
  color: #8b7d6b;
}

/* 错误状态 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  height: 200px;
  justify-content: center;
}

.error-text {
  font-size: 16px;
  color: #dc2626;
}

.retry-btn {
  padding: 8px 16px;
  background: #d2691e;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #b8621a;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  height: 200px;
  justify-content: center;
}

.empty-icon {
  font-size: 48px;
}

.empty-text {
  font-size: 16px;
  color: #8b7d6b;
}

.refresh-btn {
  padding: 8px 16px;
  background: #d2691e;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #b8621a;
}

/* 调试面板样式 */
.debug-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border: 2px solid #d2691e;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  z-index: 1000;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.debug-header h3 {
  margin: 0;
  color: #333;
}

.close-debug {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.debug-content {
  padding: 20px;
}

.debug-section {
  margin-bottom: 20px;
}

.debug-section h4 {
  margin: 0 0 10px 0;
  color: #d2691e;
  font-size: 14px;
}

.debug-section pre {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
}

.debug-section p {
  margin: 8px 0;
  font-family: monospace;
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.debug-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.debug-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.debug-btn.primary {
  background: #007bff;
  color: white;
}

.debug-btn.secondary {
  background: #6c757d;
  color: white;
}

.debug-btn.danger {
  background: #dc3545;
  color: white;
}

.debug-btn:hover {
  opacity: 0.8;
}

/* 调试切换按钮 */
.debug-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999;
}

.toggle-debug-btn {
  padding: 8px 12px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.toggle-debug-btn:hover {
  background: #4f46e5;
}
</style>
