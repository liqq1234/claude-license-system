<template>
  <div class="claude-manager">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon class="title-icon"><ChatDotRound /></el-icon>
            Claude 池管理
          </h1>
          <p class="page-subtitle">Claude账户池管理和快速登录</p>
        </div>
        
        <div class="header-actions">
          <el-button 
            type="info" 
            @click="currentView = currentView === 'user' ? 'admin' : 'user'"
            :icon="currentView === 'user' ? 'Setting' : 'User'"
          >
            {{ currentView === 'user' ? '管理员模式' : '用户模式' }}
          </el-button>
          
          <el-button 
            v-if="currentView === 'admin' && isAuthenticated"
            type="warning" 
            @click="handleLogout"
            icon="SwitchButton"
          >
            退出登录
          </el-button>
        </div>
      </div>
    </div>

    <!-- 用户界面 -->
    <div v-if="currentView === 'user'" class="user-section">
      <ClaudeUserInterface />
    </div>

    <!-- 管理员界面 -->
    <div v-else class="admin-section">
      <!-- 管理员登录 -->
      <div v-if="!isAuthenticated" class="login-section">
        <el-card class="login-card">
          <template #header>
            <div class="login-header">
              <el-icon class="login-icon"><Lock /></el-icon>
              <span>管理员认证</span>
            </div>
          </template>
          
          <el-form 
            @submit.prevent="handleLogin"
            :model="loginForm"
            label-width="100px"
            class="login-form"
          >
            <el-form-item label="管理员密码" required>
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入管理员密码"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="primary" 
                @click="handleLogin"
                :loading="loginLoading"
                style="width: 100%"
              >
                {{ loginLoading ? '登录中...' : '登录' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- 管理界面 -->
      <div v-else class="management-section">
        <!-- 统计卡片 -->
        <div class="stats-section">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-icon total">
                    <el-icon><User /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-number">{{ accountList.length }}</div>
                    <div class="stat-label">总账户数</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-icon active">
                    <el-icon><CircleCheck /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-number">{{ availableCount }}</div>
                    <div class="stat-label">可用账户</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-icon warning">
                    <el-icon><Warning /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-number">{{ recentlyUsedCount }}</div>
                    <div class="stat-label">最近使用</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            
            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-item">
                  <div class="stat-icon info">
                    <el-icon><Clock /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-number">{{ lastUpdateTime }}</div>
                    <div class="stat-label">最后更新</div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 标签页 -->
        <el-card class="main-card">
          <el-tabs v-model="activeTab" type="border-card">
            <!-- 账户管理 -->
            <el-tab-pane label="账户管理" name="manage">
              <ClaudeAccountManagement 
                :admin-password="adminPassword"
                :account-list="accountList"
                @refresh="loadAccountList"
              />
            </el-tab-pane>
            
            <!-- 批量操作 -->
            <el-tab-pane label="批量操作" name="batch">
              <ClaudeBatchOperations 
                :admin-password="adminPassword"
                @success="loadAccountList"
              />
            </el-tab-pane>
            
            <!-- 快速登录 -->
            <el-tab-pane label="快速登录" name="login">
              <ClaudeQuickLogin 
                :admin-password="adminPassword"
                :account-list="accountList"
              />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  ChatDotRound, 
  Lock, 
  User, 
  CircleCheck, 
  Warning, 
  Clock,
  Setting,
  SwitchButton
} from '@element-plus/icons-vue'
import { claudePoolApi } from '@/api/claude-pool'
import ClaudeUserInterface from '@/components/claude/ClaudeUserInterface.vue'
import ClaudeAccountManagement from '@/components/claude/ClaudeAccountManagement.vue'
import ClaudeBatchOperations from '@/components/claude/ClaudeBatchOperations.vue'
import ClaudeQuickLogin from '@/components/claude/ClaudeQuickLogin.vue'

// 响应式数据
const currentView = ref('user') // 'user' 或 'admin'
const isAuthenticated = ref(false)
const loginLoading = ref(false)
const adminPassword = ref('')
const accountList = ref([])
const activeTab = ref('manage')

const loginForm = reactive({
  password: ''
})

// 计算属性
const availableCount = computed(() => accountList.value.length)
const recentlyUsedCount = computed(() => 0)
const lastUpdateTime = computed(() => {
  const now = new Date()
  return now.toLocaleTimeString()
})

// 管理员登录
const handleLogin = async () => {
  if (!loginForm.password.trim()) {
    ElMessage.warning('请输入管理员密码')
    return
  }

  loginLoading.value = true
  try {
    await claudePoolApi.adminLogin(loginForm.password)
    
    adminPassword.value = loginForm.password
    isAuthenticated.value = true
    
    ElMessage.success('登录成功！')
    
    // 加载账户列表
    await loadAccountList()
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error(error.response?.data?.error || '登录失败，请检查密码')
  } finally {
    loginLoading.value = false
  }
}

// 退出登录
const handleLogout = () => {
  isAuthenticated.value = false
  adminPassword.value = ''
  loginForm.password = ''
  accountList.value = []
  ElMessage.info('已退出登录')
}

// 加载账户列表
const loadAccountList = async () => {
  if (!adminPassword.value) return

  try {
    const response = await claudePoolApi.getAccountList(adminPassword.value)
    accountList.value = response.accounts || []
  } catch (error) {
    console.error('加载账户列表失败:', error)
    ElMessage.error('加载账户列表失败')
  }
}

// 组件挂载
onMounted(() => {
  // 可以在这里检查是否有保存的登录状态
})
</script>

<style scoped>
.claude-manager {
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px 20px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.title-icon {
  margin-right: 12px;
  font-size: 32px;
}

.page-subtitle {
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.user-section,
.admin-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.login-section {
  max-width: 500px;
  margin: 50px auto;
  padding: 0 20px;
}

.login-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.login-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
}

.login-icon {
  font-size: 20px;
  color: #667eea;
}

.management-section {
  padding: 0;
}

.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  transition: all 0.3s;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.active {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.stat-icon.warning {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
}

.stat-icon.info {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.main-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-tabs__header) {
  margin: 0;
  background: #fafafa;
}

:deep(.el-tabs__nav-wrap) {
  padding: 0 20px;
}

:deep(.el-tabs__content) {
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .stats-section :deep(.el-col) {
    margin-bottom: 16px;
  }
  
  .user-section,
  .admin-section {
    padding: 16px;
  }
}
</style>
