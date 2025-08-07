<template>
  <div class="activation-page">
    <div class="activation-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">激活码管理</h1>
        <p class="page-subtitle">绑定激活码，享受会员服务</p>
      </div>

      <!-- 激活码绑定卡片 -->
      <el-card class="activation-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">激活码绑定</span>
          </div>
        </template>

        <div class="activation-form">
          <el-form :model="activationForm" label-width="100px">
            <el-form-item label="激活码">
              <el-input
                v-model="activationForm.activationCode"
                placeholder="请输入激活码"
                size="large"
                clearable
                :disabled="loading"
              >
                <template #prefix>
                  <el-icon><Key /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                @click="handleBindActivationCode"
                class="bind-button"
              >
                {{ loading ? '绑定中...' : '绑定激活码' }}
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-card>

      <!-- 会员状态卡片 -->
      <el-card class="membership-card" shadow="hover" v-if="membershipInfo">
        <template #header>
          <div class="card-header">
            <span class="card-title">会员状态</span>
            <el-button
              type="text"
              @click="refreshMembershipStatus"
              :loading="refreshLoading"
            >
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </template>

        <div class="membership-info">
          <div class="status-row">
            <span class="label">会员状态:</span>
            <el-tag
              :type="membershipInfo.membership?.status === 'active' ? 'success' : 'danger'"
              size="large"
            >
              {{ getStatusText(membershipInfo.membership?.status) }}
            </el-tag>
          </div>

          <div class="status-row" v-if="membershipInfo.membership?.total_duration_hours">
            <span class="label">总时长:</span>
            <span class="value">{{ membershipInfo.membership.total_duration_hours }} 小时</span>
          </div>

          <div class="status-row" v-if="membershipInfo.membership?.remaining_duration_hours">
            <span class="label">剩余时长:</span>
            <span class="value">{{ membershipInfo.membership.remaining_duration_hours }} 小时</span>
          </div>

          <div class="status-row" v-if="membershipInfo.membership?.membership_expires_at">
            <span class="label">过期时间:</span>
            <span class="value">{{ formatDate(membershipInfo.membership.membership_expires_at) }}</span>
          </div>
        </div>
      </el-card>

      <!-- 激活记录卡片 -->
      <el-card class="activation-history-card" shadow="hover" v-if="membershipInfo?.activations?.length">
        <template #header>
          <div class="card-header">
            <span class="card-title">激活记录</span>
          </div>
        </template>

        <div class="activation-history">
          <el-table :data="membershipInfo.activations" style="width: 100%">
            <el-table-column prop="code" label="激活码" width="200" />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="duration_hours" label="时长(小时)" width="120" />
            <el-table-column prop="activated_at" label="激活时间" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.activated_at) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Key, Refresh } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const refreshLoading = ref(false)

// 激活码表单
const activationForm = reactive({
  activationCode: ''
})

// 会员信息
const membershipInfo = computed(() => authStore.membershipInfo)

// 绑定激活码
const handleBindActivationCode = async () => {
  if (!activationForm.activationCode.trim()) {
    ElMessage.warning('请输入激活码')
    return
  }

  loading.value = true
  try {
    const result = await authStore.bindActivationCode(activationForm.activationCode.trim())
    if (result.success) {
      activationForm.activationCode = ''
    }
  } finally {
    loading.value = false
  }
}

// 刷新会员状态
const refreshMembershipStatus = async () => {
  refreshLoading.value = true
  try {
    await authStore.fetchMembershipStatus()
    ElMessage.success('刷新成功')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    refreshLoading.value = false
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    active: '有效',
    inactive: '未激活',
    expired: '已过期',
    revoked: '已撤销'
  }
  return statusMap[status] || status
}

// 页面加载时获取会员状态
onMounted(async () => {
  await authStore.fetchMembershipStatus()
})
</script>

<style scoped>
.activation-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.activation-container {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
  color: white;
}

.page-title {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.page-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
}

.activation-card,
.membership-card,
.activation-history-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: between;
  align-items: center;
}

.card-title {
  font-size: 1.2rem;
  font-weight: bold;
}

.activation-form {
  padding: 20px 0;
}

.bind-button {
  width: 100%;
  height: 50px;
  font-size: 1.1rem;
}

.membership-info {
  padding: 20px 0;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.status-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.label {
  font-weight: bold;
  color: #666;
}

.value {
  color: #333;
}

.activation-history {
  padding: 20px 0;
}
</style>
