<template>
  <div
    class="account-card-desktop"
    @click="handleClick"
    :class="{ 'loading': loading }"
  >
    <!-- Claude 图标装饰 -->
    <div class="card-decoration">
      <svg viewBox="0 0 24 24" class="claude-icon">
        <path
          d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z"
          fill="#D97757"
          fill-rule="nonzero"
        />
      </svg>
    </div>

    <!-- 加载遮罩 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <!-- 卡片内容 -->
    <div class="card-content">
      <!-- 顶部信息 -->
      <div class="card-header">
        <div class="account-name-new">
          {{ displayName }}
        </div>
      </div>

      <!-- 底部状态 -->
      <div class="card-footer">
        <div class="status-indicator">
          <div 
            class="status-dot" 
            :class="statusDotClass"
          ></div>
          <span class="status-text">{{ statusText }}</span>
          <span class="email-text">{{ maskedEmail }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  account: {
    type: Object,
    required: true
  },
  status: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['click'])

// 计算属性
const displayName = computed(() => {
  return props.account.name || props.account.email.split('@')[0]
})

const statusText = computed(() => {
  return props.status.status_text || '空闲'
})

const statusDotClass = computed(() => {
  const color = props.status.color || 'green'
  return `status-dot-${color}`
})

const maskedEmail = computed(() => {
  const email = props.account.email
  if (!email) return ''
  
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return email

  // 如果本地部分长度小于等于3，只显示第一个字符
  if (localPart.length <= 3) {
    return `${localPart[0]}***@${domain}`
  }

  // 显示前2个字符和后1个字符，中间用***代替
  const maskedLocal = `${localPart.slice(0, 2)}***${localPart.slice(-1)}`
  return `${maskedLocal}@${domain}`
})

// 事件处理
const handleClick = () => {
  if (!props.loading) {
    emit('click', props.account)
  }
}
</script>

<style scoped>
/* 桌面端账号卡片 */
.account-card-desktop {
  background: linear-gradient(135deg, #fffbf5 0%, #fef3e2 100%);
  border: 1px solid rgba(251, 146, 60, 0.15);
  border-radius: 16px;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  height: 140px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(251, 146, 60, 0.08);
}

.account-card-desktop:hover {
  border-color: rgba(251, 146, 60, 0.3);
  box-shadow: 0 8px 25px rgba(251, 146, 60, 0.15);
  transform: translateY(-4px);
  background: linear-gradient(135deg, #fefcf9 0%, #fef7ed 100%);
}

.account-card-desktop.loading {
  cursor: not-allowed;
  opacity: 0.7;
}

/* 卡片装饰背景 */
.card-decoration {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  pointer-events: none;
  opacity: 0.6;
}

.claude-icon {
  width: 100%;
  height: 100%;
}

/* 加载遮罩 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #d2691e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 卡片内容容器 */
.card-content {
  position: relative;
  z-index: 1;
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

/* 账号名称样式 */
.account-name-new {
  font-size: 16px;
  font-weight: 600;
  color: #92400e;
  line-height: 1.2;
  max-width: 120px;
  word-break: break-word;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  align-items: center;
}

/* 状态指示器 */
.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 状态圆点 */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot-green {
  background: #16a34a;
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
}

.status-dot-yellow {
  background: #eab308;
  box-shadow: 0 0 0 2px rgba(234, 179, 8, 0.2);
}

.status-dot-red {
  background: #dc2626;
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
}

/* 状态文字 */
.status-text {
  font-size: 14px;
  color: #a16207;
  font-weight: 500;
}

/* 邮箱文字 */
.email-text {
  font-size: 12px;
  color: #92400e;
  font-weight: 400;
  margin-left: 8px;
  opacity: 0.8;
}
</style>
