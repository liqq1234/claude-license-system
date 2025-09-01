<template>
  <div 
    class="email-card"
    @click="handleClick"
    role="button"
    tabindex="0"
    @keypress="handleKeyPress"
    :aria-label="`Login with ${email}`"
  >
    <div class="card-content">
      <!-- 邮箱图标 -->
      <div class="email-icon">
        <el-icon><Message /></el-icon>
      </div>
      
      <!-- 邮箱地址 -->
      <div class="email-address">
        {{ email }}
      </div>
      
      <!-- 状态指示器 -->
      <div class="status-indicator">
        <el-icon class="status-icon"><CircleCheck /></el-icon>
        <span class="status-text">可用</span>
      </div>
      
      <!-- 悬停提示 -->
      <div class="hover-hint">
        <el-icon><Mouse /></el-icon>
        <span>点击登录</span>
      </div>
    </div>
    
    <!-- 装饰性背景 -->
    <div class="card-decoration">
      <div class="decoration-circle circle-1"></div>
      <div class="decoration-circle circle-2"></div>
      <div class="decoration-circle circle-3"></div>
    </div>
  </div>
</template>

<script setup>
import { Message, CircleCheck, Mouse } from '@element-plus/icons-vue'

const props = defineProps({
  email: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['click'])

const handleClick = () => {
  emit('click', props.email)
}

const handleKeyPress = (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    handleClick()
  }
}
</script>

<style scoped>
.email-card {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  min-height: 140px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.email-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
}

.email-card:active {
  transform: translateY(-4px) scale(1.01);
}

.email-card:focus {
  outline: none;
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4), 0 0 0 3px rgba(102, 126, 234, 0.3);
}

.card-content {
  position: relative;
  z-index: 2;
  width: 100%;
  color: white;
}

.email-icon {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.9;
}

.email-address {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  word-break: break-all;
  line-height: 1.4;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.status-icon {
  font-size: 16px;
}

.hover-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: rgba(255, 255, 255, 0.8);
}

.email-card:hover .hover-hint {
  opacity: 1;
}

.card-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 60px;
  height: 60px;
  top: -30px;
  right: -30px;
  animation-delay: 0s;
}

.circle-2 {
  width: 40px;
  height: 40px;
  bottom: -20px;
  left: -20px;
  animation-delay: 2s;
}

.circle-3 {
  width: 80px;
  height: 80px;
  top: 50%;
  right: -40px;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.1;
  }
  50% {
    transform: translateY(-10px) rotate(180deg);
    opacity: 0.2;
  }
}

/* 不同的渐变色变体 */
.email-card:nth-child(2n) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 4px 20px rgba(240, 147, 251, 0.3);
}

.email-card:nth-child(2n):hover {
  box-shadow: 0 12px 40px rgba(240, 147, 251, 0.4);
}

.email-card:nth-child(3n) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  box-shadow: 0 4px 20px rgba(79, 172, 254, 0.3);
}

.email-card:nth-child(3n):hover {
  box-shadow: 0 12px 40px rgba(79, 172, 254, 0.4);
}

.email-card:nth-child(4n) {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  box-shadow: 0 4px 20px rgba(67, 233, 123, 0.3);
}

.email-card:nth-child(4n):hover {
  box-shadow: 0 12px 40px rgba(67, 233, 123, 0.4);
}

.email-card:nth-child(5n) {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  box-shadow: 0 4px 20px rgba(250, 112, 154, 0.3);
}

.email-card:nth-child(5n):hover {
  box-shadow: 0 12px 40px rgba(250, 112, 154, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .email-card {
    padding: 20px;
    min-height: 120px;
  }
  
  .email-icon {
    font-size: 28px;
    margin-bottom: 10px;
  }
  
  .email-address {
    font-size: 14px;
    margin-bottom: 10px;
  }
  
  .status-indicator {
    font-size: 12px;
    margin-bottom: 6px;
  }
  
  .hover-hint {
    font-size: 11px;
  }
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  .email-card {
    transition: none;
  }
  
  .email-card:hover {
    transform: none;
  }
  
  .decoration-circle {
    animation: none;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .email-card {
    border: 2px solid white;
  }
  
  .card-content {
    color: white;
  }
}
</style>
