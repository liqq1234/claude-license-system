<template>
    <div id="app">
        <el-container class="layout-container">
            <!-- 头部导航 -->
            <el-header class="header">
                <div class="header-content">
                    <div class="nav-brand">
                        <h1>🔑 激活码管理系统</h1>
                        <span>License Server Management</span>
                    </div>

                    <div class="nav-menu">
                        <el-button
                            type="primary"
                            @click="$router.push('/dashboard')"
                            :class="['nav-button', { active: $route.path === '/dashboard' || $route.path === '/' }]"
                        >
                            <span class="nav-icon">🏠</span>
                            <span class="nav-text">仪表板</span>
                        </el-button>

                        <el-button
                            type="info"
                            @click="$router.push('/claude-manager')"
                            :class="['nav-button', { active: $route.path === '/claude-manager' }]"
                        >
                            <span class="nav-icon">🤖</span>
                            <span class="nav-text">Claude管理</span>
                        </el-button>
                    </div>
                </div>
            </el-header>

            <!-- 主体内容 - 使用路由视图 -->
            <el-main class="main-content">
                <router-view />
            </el-main>
        </el-container>
    </div>
</template>

<script setup>
// App.vue 现在只负责布局和导航，具体内容由路由组件处理
</script>

<style scoped>
.layout-container {
    min-height: 100vh;
}

.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 0;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    padding: 0 20px;
}

.nav-brand h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
}

.nav-brand span {
    font-size: 12px;
    opacity: 0.8;
    display: block;
    margin-top: 2px;
}

.nav-menu {
    display: flex;
    gap: 15px;
}

.nav-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.1);
    color: white;
    transition: all 0.3s;
}

.nav-button:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-1px);
}

.nav-button.active {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.7);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.nav-icon {
    font-size: 16px;
}

.nav-text {
    font-size: 14px;
    font-weight: 500;
}

.main-content {
    background: #f5f7fa;
    padding: 20px;
}

/* 统计卡片区域 */
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
    font-size: 32px;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
}

.stat-icon.total {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.stat-icon.active {
    background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
    color: white;
}

.stat-icon.pending {
    background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
    color: white;
}

.stat-icon.expired {
    background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
    color: white;
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

/* 图表区域 */
.chart-section {
    margin-bottom: 20px;
}

.chart-container {
    height: 400px;
    width: 100%;
}

.card-header {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

/* 列表区域 */
.list-section {
    margin-bottom: 20px;
}

/* 全局样式 */
:deep(.el-main) {
    padding: 20px;
}

:deep(.el-card) {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: none;
}

:deep(.el-card__header) {
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
    padding: 15px 20px;
}

:deep(.el-card__body) {
    padding: 20px;
}
</style>
