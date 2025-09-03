<template>
  <div class="activation-page">
    <div class="activation-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">激活码管理</h1>
        <p class="page-subtitle">绑定激活码，享受会员服务</p>
      </div>

      <!-- 激活码绑定和购买区域 -->
      <div class="activation-purchase-section">
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

        <!-- 站内购买卡片 -->
        <el-card class="purchase-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">站内购买</span>
            </div>
          </template>

          <div class="purchase-content">
            <div class="purchase-description">
              <el-icon class="purchase-icon"><ShoppingCart /></el-icon>
              <p>没有激活码？立即购买会员套餐</p>
              <p class="purchase-subtitle">支持支付宝支付，购买后自动发放激活码</p>
            </div>
            
            <el-button
              type="success"
              size="large"
              @click="openPurchaseDialog"
              class="purchase-button"
            >
              <el-icon><ShoppingCart /></el-icon>
              立即购买
            </el-button>
          </div>
        </el-card>
      </div>

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

    <!-- 站内购买弹窗 -->
    <el-dialog
      v-model="purchaseDialogVisible"
      title="站内购买"
      width="800px"
      :close-on-click-modal="false"
      class="purchase-dialog"
    >
      <div class="purchase-flow">
        <!-- 步骤指示器 -->
        <el-steps :active="currentStep" align-center class="purchase-steps">
          <el-step title="选择套餐" />
          <el-step title="支付订单" />
          <el-step title="使用服务" />
        </el-steps>

        <!-- 步骤1: 选择套餐 -->
        <div v-if="currentStep === 0" class="step-content">
          <!-- 订阅类型选择 -->
          <div class="subscription-types">
            <h3>订阅类型</h3>
            <div class="type-options">
              <div 
                class="type-option"
                :class="{ active: selectedSubscriptionType === 'chatgpt' }"
                @click="selectedSubscriptionType = 'chatgpt'"
              >
                <div class="type-header">
                  <h4>ChatGPT</h4>
                </div>
                <p>ChatGPT & Claude</p>
              </div>
              <div 
                class="type-option"
                :class="{ active: selectedSubscriptionType === 'claude' }"
                @click="selectedSubscriptionType = 'claude'"
              >
                <div class="type-header">
                  <h4>Claude</h4>
                </div>
                <p>ChatGPT & Claude</p>
              </div>
            </div>
          </div>

          <!-- 有效天数选择 -->
          <div class="duration-options">
            <h3>有效天数</h3>
            <div class="duration-grid">
              <div 
                v-for="option in durationOptions"
                :key="option.days"
                class="duration-option"
                :class="{ active: selectedDuration === option.days }"
                @click="selectedDuration = option.days"
              >
                <span class="duration-days">{{ option.days }}天</span>
                <span class="duration-label">{{ option.label }}</span>
              </div>
            </div>
          </div>

          <!-- 订阅套餐 -->
          <div class="subscription-packages" v-if="selectedSubscriptionType">
            <h3>订阅套餐</h3>
            <div class="packages-grid">
              <div 
                v-for="pkg in filteredPackages"
                :key="pkg.id"
                class="package-card"
                :class="{ active: selectedPackage?.id === pkg.id }"
                @click="selectedPackage = pkg"
              >
                <div class="package-icon">
                  <el-icon><Star /></el-icon>
                </div>
                <h4>{{ pkg.name }}</h4>
                <div class="package-price">
                  <span class="price">¥{{ pkg.price }}</span>
                  <span class="unit">/ {{ selectedDuration }}天</span>
                </div>
                <div class="package-features">
                  <div v-for="feature in pkg.features" :key="feature" class="feature">
                    <el-icon><Check /></el-icon>
                    <span>{{ feature }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 支付方式选择 -->
          <div class="payment-methods">
            <h3>选择支付方式</h3>
            <div class="payment-options">
              <div 
                class="payment-option"
                :class="{ active: selectedPaymentMethod === 'alipay' }"
                @click="selectedPaymentMethod = 'alipay'"
              >
                <el-icon><CreditCard /></el-icon>
                <span>支付宝支付</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 步骤2: 支付订单 -->
        <div v-if="currentStep === 1" class="step-content">
          <div class="payment-info">
            <div class="order-summary">
              <h3>订单信息</h3>
              <div class="summary-item">
                <span>套餐类型:</span>
                <span>{{ selectedPackage?.name }}</span>
              </div>
              <div class="summary-item">
                <span>有效期:</span>
                <span>{{ selectedDuration }}天</span>
              </div>
              <div class="summary-item">
                <span>支付方式:</span>
                <span>支付宝支付</span>
              </div>
              <div class="summary-item total">
                <span>总金额:</span>
                <span class="amount">¥{{ selectedPackage?.price }}</span>
              </div>
            </div>

            <div class="payment-qrcode" v-if="paymentQRCode">
              <h3>扫码支付</h3>
              <div class="qrcode-container">
                <img :src="paymentQRCode" alt="支付二维码" />
              </div>
              <p class="payment-tip">请使用支付宝扫描二维码完成支付</p>
              <div class="payment-status">
                <el-button @click="checkPaymentStatus" :loading="checkingPayment">
                  检查支付状态
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 步骤3: 使用服务 -->
        <div v-if="currentStep === 2" class="step-content">
          <div class="success-content">
            <el-icon class="success-icon"><CircleCheck /></el-icon>
            <h3>购买成功！</h3>
            <p>您的激活码已自动绑定到您的账户</p>
            <div class="activation-code-info">
              <p><strong>激活码:</strong> {{ purchasedActivationCode }}</p>
              <p><strong>有效期:</strong> {{ selectedDuration }}天</p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="purchaseDialogVisible = false">取消</el-button>
          <el-button 
            v-if="currentStep === 0" 
            type="primary" 
            @click="proceedToPayment"
            :disabled="!canProceedToPayment"
          >
            确认订单
          </el-button>
          <el-button 
            v-if="currentStep === 2" 
            type="primary" 
            @click="completePurchase"
          >
            开始使用
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Key, Refresh, ShoppingCart, Star, Check, CreditCard, CircleCheck } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import paymentApi from '@/api/payment'

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

// 站内购买相关数据
const purchaseDialogVisible = ref(false)
const currentStep = ref(0)
const selectedSubscriptionType = ref('claude')
const selectedDuration = ref(1)
const selectedPackage = ref(null)
const selectedPaymentMethod = ref('alipay')
const paymentQRCode = ref('')
const checkingPayment = ref(false)
const purchasedActivationCode = ref('')

// 有效天数选项
const durationOptions = [
  { days: 1, label: '体验' },
  { days: 7, label: '周卡' },
  { days: 30, label: '月卡' },
  { days: 90, label: '季卡' },
  { days: 365, label: '年卡' }
]

// 套餐配置
const packageConfigs = {
  claude: {
    1: [
      {
        id: 'claude-pro-1d',
        name: 'Claude pro/max 1天',
        price: 3.8,
        features: [
          '高级功能',
          'Claude: 50次/3小时',
          '国内直连使用',
          '官网无需注册',
          '客服快速响应'
        ]
      }
    ],
    7: [
      {
        id: 'gpt5-week',
        name: 'GPT 5.0 周卡',
        price: 25,
        features: [
          '无限制访问基础模型',
          '高级功能',
          'ChatGPT: 100次/天',
          '国内直连使用',
          '官网无需注册',
          '客服快速响应'
        ]
      }
    ],
    30: [
      {
        id: 'gpt5-month',
        name: 'GPT 5.0 月卡',
        price: 88,
        features: [
          '无限制访问基础模型',
          '高级功能',
          'ChatGPT: 100次/天',
          '国内直连使用',
          '官网无需注册',
          '客服快速响应'
        ]
      },
      {
        id: 'gpt5-plus-month',
        name: 'GPT 5.0 Plus 月卡',
        price: 98,
        features: [
          '无限制访问基础模型',
          '高级功能',
          'ChatGPT: 100次/天',
          '国内直连使用',
          '官网无需注册',
          '客服快速响应'
        ]
      }
    ]
  },
  chatgpt: {
    1: [
      {
        id: 'chatgpt-daily',
        name: 'ChatGPT 日卡',
        price: 5,
        features: [
          'ChatGPT访问',
          'GPT-4模型',
          '基础功能'
        ]
      }
    ],
    7: [
      {
        id: 'chatgpt-week',
        name: 'ChatGPT 周卡',
        price: 30,
        features: [
          'ChatGPT访问',
          'GPT-4模型',
          '高级功能'
        ]
      }
    ],
    30: [
      {
        id: 'chatgpt-month',
        name: 'ChatGPT 月卡',
        price: 100,
        features: [
          'ChatGPT访问',
          'GPT-4模型',
          '所有功能'
        ]
      }
    ]
  }
}

// 计算属性：过滤的套餐
const filteredPackages = computed(() => {
  return packageConfigs[selectedSubscriptionType.value]?.[selectedDuration.value] || []
})

// 计算属性：是否可以进行支付
const canProceedToPayment = computed(() => {
  return selectedSubscriptionType.value && 
         selectedDuration.value && 
         selectedPackage.value && 
         selectedPaymentMethod.value
})

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

// 购买相关方法
const openPurchaseDialog = () => {
  purchaseDialogVisible.value = true
  currentStep.value = 0
  // 默认选择Claude和1天
  selectedSubscriptionType.value = 'claude'
  selectedDuration.value = 1
  selectedPackage.value = null
  selectedPaymentMethod.value = 'alipay'
}

const proceedToPayment = async () => {
  if (!canProceedToPayment.value) {
    ElMessage.warning('请完成所有选项')
    return
  }

  try {
    // 创建支付订单
    const orderData = {
      subscriptionType: selectedSubscriptionType.value,
      durationDays: selectedDuration.value,
      packageId: selectedPackage.value.id,
      amount: selectedPackage.value.price,
      paymentMethod: selectedPaymentMethod.value
    }

    // 调用支付API
    const result = await paymentApi.createPayment(orderData)
    
    if (result.success) {
      paymentQRCode.value = result.data.qr_code
      currentStep.value = 1
      
      // 开始轮询支付状态
      startPaymentStatusPolling(result.data.order_id)
    } else {
      ElMessage.error(result.message || '创建订单失败')
    }
  } catch (error) {
    console.error('创建支付订单失败:', error)
    ElMessage.error('创建订单失败，请重试')
  }
}

const checkPaymentStatus = async () => {
  checkingPayment.value = true
  try {
    // 这里应该检查具体的订单状态
    // 模拟支付成功
    setTimeout(() => {
      checkingPayment.value = false
      currentStep.value = 2
      purchasedActivationCode.value = 'ABCD-EFGH-IJKL-MNOP'
      ElMessage.success('支付成功！')
    }, 2000)
  } catch (error) {
    checkingPayment.value = false
    ElMessage.error('检查支付状态失败')
  }
}

const startPaymentStatusPolling = (orderId) => {
  const pollInterval = setInterval(async () => {
    try {
      const result = await paymentApi.getPaymentStatus(orderId)
      
      if (result.data.status === 'paid') {
        clearInterval(pollInterval)
        currentStep.value = 2
        purchasedActivationCode.value = result.data.activation_code
        ElMessage.success('支付成功！激活码已自动绑定')
        // 刷新会员状态
        await authStore.fetchMembershipStatus()
      }
    } catch (error) {
      console.error('轮询支付状态失败:', error)
    }
  }, 3000) // 每3秒轮询一次

  // 5分钟后停止轮询
  setTimeout(() => {
    clearInterval(pollInterval)
  }, 300000)
}

const completePurchase = () => {
  purchaseDialogVisible.value = false
  currentStep.value = 0
  // 重置选择
  selectedPackage.value = null
  paymentQRCode.value = ''
  purchasedActivationCode.value = ''
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

/* 购买相关样式 */
.activation-purchase-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .activation-purchase-section {
    grid-template-columns: 1fr;
  }
}

.purchase-card {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
}

.purchase-card .card-title {
  color: white;
}

.purchase-content {
  padding: 20px 0;
  text-align: center;
}

.purchase-description {
  margin-bottom: 20px;
}

.purchase-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.purchase-description p {
  margin: 5px 0;
  line-height: 1.5;
}

.purchase-subtitle {
  font-size: 0.9rem;
  opacity: 0.8;
}

.purchase-button {
  width: 100%;
  height: 50px;
  font-size: 1.1rem;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid white;
  color: white;
}

.purchase-button:hover {
  background: white;
  color: #11998e;
}

/* 购买弹窗样式 */
.purchase-dialog .el-dialog__body {
  padding: 20px;
}

.purchase-steps {
  margin-bottom: 30px;
}

.step-content {
  min-height: 400px;
}

.step-content h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 1.2rem;
}

/* 订阅类型选择 */
.subscription-types {
  margin-bottom: 30px;
}

.type-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.type-option {
  padding: 20px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.type-option:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.type-option.active {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

.type-option h4 {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
}

.type-option p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.8;
}

/* 有效天数选择 */
.duration-options {
  margin-bottom: 30px;
}

.duration-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
}

.duration-option {
  padding: 15px 10px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.duration-option:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.duration-option.active {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

.duration-days {
  display: block;
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.duration-label {
  font-size: 0.8rem;
  opacity: 0.8;
}

/* 套餐选择 */
.subscription-packages {
  margin-bottom: 30px;
}

.packages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.package-card {
  padding: 20px;
  border: 2px solid #e1e8ed;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.package-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.package-card.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.package-icon {
  text-align: center;
  margin-bottom: 15px;
}

.package-icon .el-icon {
  font-size: 2rem;
  color: #667eea;
}

.package-card.active .package-icon .el-icon {
  color: white;
}

.package-card h4 {
  text-align: center;
  margin: 0 0 15px 0;
  font-size: 1.2rem;
}

.package-price {
  text-align: center;
  margin-bottom: 20px;
}

.price {
  font-size: 1.8rem;
  font-weight: bold;
  color: #e74c3c;
}

.package-card.active .price {
  color: white;
}

.unit {
  font-size: 0.9rem;
  opacity: 0.7;
  margin-left: 5px;
}

.feature {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.feature .el-icon {
  margin-right: 8px;
  color: #27ae60;
  font-size: 0.9rem;
}

.package-card.active .feature .el-icon {
  color: white;
}

.feature span {
  font-size: 0.9rem;
}

/* 支付方式选择 */
.payment-methods {
  margin-bottom: 20px;
}

.payment-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.payment-option {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.payment-option:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.payment-option.active {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

.payment-option .el-icon {
  margin-right: 10px;
  font-size: 1.2rem;
}

/* 支付信息页面 */
.payment-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

@media (max-width: 768px) {
  .payment-info {
    grid-template-columns: 1fr;
  }
}

.order-summary {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #e9ecef;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-item.total {
  font-weight: bold;
  font-size: 1.1rem;
  color: #e74c3c;
}

.amount {
  font-size: 1.3rem;
}

.payment-qrcode {
  text-align: center;
}

.qrcode-container {
  margin: 20px 0;
}

.qrcode-container img {
  max-width: 200px;
  height: auto;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.payment-tip {
  color: #666;
  margin: 20px 0;
}

.payment-status {
  margin-top: 20px;
}

/* 成功页面 */
.success-content {
  text-align: center;
  padding: 40px 20px;
}

.success-icon {
  font-size: 4rem;
  color: #27ae60;
  margin-bottom: 20px;
}

.success-content h3 {
  color: #27ae60;
  margin-bottom: 15px;
}

.activation-code-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  text-align: left;
}

.activation-code-info p {
  margin: 10px 0;
}
</style>
