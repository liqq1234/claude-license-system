<template>
    <div class="auth-layout">
        <!-- 背景装饰 -->
        <div class="background-decoration">
            <div class="decoration-circle"></div>
            <div class="decoration-circle"></div>
            <div class="decoration-circle"></div>
        </div>

        <!-- 主要内容 -->
        <div class="auth-container">
            <el-card class="auth-card" shadow="always">
                <slot />
            </el-card>
        </div>
    </div>
</template>

<script setup>
// 这个组件作为认证页面的布局容器
</script>

<style scoped>
.auth-layout {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-container {
    width: 560px;
    padding: 20px;
    z-index: 1;
}

.auth-card {
    border-radius: 24px;
    padding: 56px 48px;
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.2);
    animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 背景装饰 */
.background-decoration {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
}

.decoration-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    animation: float 6s ease-in-out infinite;
}

.decoration-circle:nth-child(1) {
    width: 80px;
    height: 80px;
    top: 20%;
    left: 10%;
    animation-delay: 0s;
}

.decoration-circle:nth-child(2) {
    width: 120px;
    height: 120px;
    top: 60%;
    right: 15%;
    animation-delay: 2s;
}

.decoration-circle:nth-child(3) {
    width: 60px;
    height: 60px;
    bottom: 20%;
    left: 20%;
    animation-delay: 4s;
}

@keyframes float {
    0%,
    100% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(-20px);
    }
}

/* 桌面端专用设计 */
</style>
