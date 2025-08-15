<template>
  <div class="account-status-test">
    <div class="header">
      <h1>🔄 账户状态管理</h1>
    </div>

    <div class="stats" v-if="stats">
      <div class="stat-item">
        <div class="stat-number">{{ stats.idle }}</div>
        <div class="stat-label">空闲</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.available }}</div>
        <div class="stat-label">可用</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.busy }}</div>
        <div class="stat-label">繁忙</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.total }}</div>
        <div class="stat-label">总计</div>
      </div>
    </div>

    <div class="accounts-container">
      <div v-if="loading" class="loading">正在加载账户状态...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else class="accounts-grid">
        <div 
          v-for="account in accounts" 
          :key="account.id"
          class="account-card"
          :class="account.status"
          @click="handleCardClick(account)"
        >
          <div class="account-header">
            <div class="account-email">{{ account.email }}</div>
            <div class="status-badge" :class="`status-${account.status}`">
              {{ getStatusText(account.status) }}
            </div>
          </div>
          
          <div class="account-info">
            <div class="info-row">
              <span>账户ID:</span>
              <span>#{{ account.id }}</span>
            </div>
            <div class="info-row" v-if="account.lastUsedAt">
              <span>最后使用:</span>
              <span>{{ formatDate(account.lastUsedAt) }}</span>
            </div>
          </div>

          <div v-if="account.status === 'busy' && account.recoverySeconds" class="recovery-timer">
            恢复倒计时: {{ formatTime(account.recoverySeconds) }}
          </div>

          <div class="account-actions">
            <div v-if="account.status === 'idle'" class="idle-hint">💡 点击卡片激活账户</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { claudePoolService } from '@/api/claude-pool'
import { ElMessage } from 'element-plus'

// 响应式数据
const accounts = ref([])
const loading = ref(false)
const error = ref('')

// 统计信息
const stats = computed(() => {
  if (!accounts.value.length) return null
  
  const stats = accounts.value.reduce((acc, account) => {
    acc[account.status] = (acc[account.status] || 0) + 1
    acc.total++
    return acc
  }, { idle: 0, available: 0, busy: 0, total: 0 })
  
  return stats
})

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'idle': '空闲',
    'available': '可用',
    'busy': '繁忙'
  }
  return statusMap[status] || '未知'
}

// 格式化时间
const formatTime = (seconds) => {
  if (!seconds || seconds <= 0) return '0:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '从未使用'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 刷新状态
const refreshStatus = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await claudePoolService.getAllAccountsStatus()
    
    if (response.success) {
      accounts.value = response.data
      console.log('✅ 状态刷新成功:', response.data)
    } else {
      throw new Error(response.message || '获取状态失败')
    }
  } catch (err) {
    console.error('❌ 刷新状态失败:', err)
    error.value = err.message
    ElMessage.error('刷新状态失败: ' + err.message)
  } finally {
    loading.value = false
  }
}

// 处理卡片点击
const handleCardClick = (account) => {
  // 如果是空闲状态，点击激活
  if (account.status === 'idle') {
    activateAccount(account.id)
  }
}

// 激活账户
const activateAccount = async (accountId) => {
  try {
    const response = await claudePoolService.activateAccount(accountId)
    
    if (response.success) {
      ElMessage.success('账户激活成功')
      // 延迟刷新状态
      setTimeout(refreshStatus, 1000)
    } else {
      throw new Error(response.message || '激活失败')
    }
  } catch (err) {
    console.error('❌ 激活账户失败:', err)
    ElMessage.error('激活失败: ' + err.message)
  }
}

// 生命周期
onMounted(() => {
  refreshStatus()
})
</script>

<style scoped>
.account-status-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h1 {
  margin: 0;
  color: #333;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.accounts-container {
  min-height: 200px;
}

.loading, .error {
  text-align: center;
  padding: 50px;
  font-size: 16px;
}

.error {
  color: #dc3545;
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.account-card {
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s;
  cursor: pointer;
}

.account-card.idle {
  border-color: #28a745;
  background-color: #d4edda;
}

.account-card.available {
  border-color: #ffc107;
  background-color: #fff3cd;
}

.account-card.busy {
  border-color: #dc3545;
  background-color: #f8d7da;
}

.account-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.account-email {
  font-weight: bold;
  font-size: 16px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.status-idle {
  background-color: #28a745;
  color: white;
}

.status-available {
  background-color: #ffc107;
  color: #212529;
}

.status-busy {
  background-color: #dc3545;
  color: white;
}

.account-info {
  margin-bottom: 15px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.recovery-timer {
  font-size: 18px;
  font-weight: bold;
  color: #dc3545;
  text-align: center;
  margin: 10px 0;
}

.account-actions {
  display: flex;
  gap: 10px;
}

.idle-hint {
  font-size: 12px;
  color: #28a745;
  font-weight: 500;
  text-align: center;
  padding: 8px;
  background-color: rgba(40, 167, 69, 0.1);
  border-radius: 4px;
  margin-bottom: 8px;
}
</style>
