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
                @activate="handleAccountActivate"
                @status-update="handleStatusUpdate"
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

                <div class="debug-section">
                    <h4>后端同步状态:</h4>
                    <p>初始化: {{ isInitialized ? '✅' : '❌' }}</p>
                    <p>定时器: {{ statusSyncInterval ? '🟢 运行中' : '🔴 已停止' }}</p>
                    <p>最后同步: {{ lastSyncTime || '未同步' }}</p>
                    <p>错误数量: {{ syncErrors.length }}</p>
                </div>

                <div v-if="syncErrors.length > 0" class="debug-section">
                    <h4>同步错误记录:</h4>
                    <div class="error-list">
                        <div
                            v-for="(error, index) in syncErrors.slice(-3)"
                            :key="index"
                            class="error-item"
                        >
                            <small>{{ error.time }}</small>
                            <div>{{ error.email || 'N/A' }} - {{ error.action || 'sync' }}</div>
                            <div class="error-msg">{{ error.message }}</div>
                        </div>
                    </div>
                </div>

                <div class="debug-actions">
                    <button @click="testStatusUpdate" class="debug-btn primary">测试状态更新</button>
                    <button @click="forceRefreshStatus++" class="debug-btn secondary">强制刷新UI</button>
                    <button @click="clearAllStatus" class="debug-btn danger">清空所有状态</button>
                    <button @click="fetchAccountsStatusFromBackend" class="debug-btn info">立即同步状态</button>
                    <button @click="syncErrors = []" class="debug-btn warning">清空错误记录</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from "vue";
import AccountCard from "./AccountCard.vue";
import { claudePoolService } from "@/api/claude-pool";
import { ElMessage } from "element-plus";

// Props
const props = defineProps({
    accounts: {
        type: Array,
        default: () => [],
    },
    loading: {
        type: Boolean,
        default: false,
    },
    error: {
        type: Boolean,
        default: false,
    },
});

// Emits
const emit = defineEmits(["account-click", "retry"]);

// 响应式数据
const accountsStatus = reactive({});
const accountsLoading = reactive({});
const forceRefreshStatus = ref(0);
const showDebugPanel = ref(false);

// 后端状态同步相关
const statusSyncInterval = ref(null);
const lastSyncTime = ref(null);
const syncErrors = ref([]);
const isInitialized = ref(false);

// 计算属性
const getAccountStatus = (email) => {
    forceRefreshStatus.value; // 建立响应式依赖
    return accountsStatus[email] || {};
};

const getAccountLoading = (email) => {
    return accountsLoading[email] || false;
};

// 方法
const handleAccountClick = (account) => {
    console.log("🎯 AccountGrid: 账户被点击", account.email);

    // 设置加载状态
    setAccountLoading(account.email, true);

    // 发射事件给父组件
    emit("account-click", account);
};

const updateAccountStatus = (email, newStatus) => {
    console.log(`🎯 AccountGrid: 更新账户状态 ${email}`, newStatus);

    // 记录更新前的状态
    const oldStatus = accountsStatus[email];
    console.log(`📋 更新前状态:`, oldStatus);

    // 更新状态
    accountsStatus[email] = { ...accountsStatus[email], ...newStatus };

    // 记录更新后的状态
    console.log(`📋 更新后状态:`, accountsStatus[email]);

    // 强制触发响应式更新
    const oldForceValue = forceRefreshStatus.value;
    forceRefreshStatus.value++;
    console.log(
        `🔄 强制刷新值: ${oldForceValue} -> ${forceRefreshStatus.value}`
    );

    console.log(`✅ 状态更新完成:`, accountsStatus[email]);
};

const setAccountLoading = (email, loading) => {
    accountsLoading[email] = loading;
};

// 处理账户激活
const handleAccountActivate = (account) => {
    console.log("🚀 AccountGrid: 账户激活", account.email);

    // 立即刷新状态
    setTimeout(() => {
        fetchAccountsStatusFromBackend();
    }, 1000);
};

// 处理状态更新请求
const handleStatusUpdate = (email) => {
    console.log("🔄 AccountGrid: 请求更新状态", email);

    // 立即刷新状态
    fetchAccountsStatusFromBackend();
};

const testStatusUpdate = () => {
    console.log("🧪 测试状态更新");

    if (props.accounts.length === 0) {
        console.log("❌ 没有账户可以测试");
        return;
    }

    const testAccount = props.accounts[0];
    const testEmail = testAccount.email;

    console.log(`🧪 测试账户: ${testEmail}`);

    const newStatus = {
        status: "available",
        status_text: "测试可用",
        color: "yellow",
        countdown: "3:00",
        remaining_seconds: 180,
        last_used: new Date().toISOString(),
    };

    updateAccountStatus(testEmail, newStatus);
};

const clearAllStatus = () => {
    console.log("🧹 清空所有状态");
    Object.keys(accountsStatus).forEach((key) => delete accountsStatus[key]);
    Object.keys(accountsLoading).forEach((key) => delete accountsLoading[key]);
    forceRefreshStatus.value++;
};

// ========== 后端状态同步功能 ==========

// 从后端获取所有账户状态
const fetchAccountsStatusFromBackend = async () => {
    console.log("🔄 开始从后端获取账户状态...");

    try {
        const startTime = Date.now();
        const response = await claudePoolService.getAllAccountsStatus();
        const endTime = Date.now();

        console.log(`✅ 后端状态获取成功，耗时: ${endTime - startTime}ms`);
        console.log(`📊 获取到响应:`, response);

        // 检查响应格式
        if (response && response.success && Array.isArray(response.data)) {
            const statusList = response.data;
            console.log(
                `📊 获取到 ${statusList.length} 个账户状态:`,
                statusList
            );

            // 清空旧状态
            Object.keys(accountsStatus).forEach(
                (key) => delete accountsStatus[key]
            );

            // 更新状态映射
            statusList.forEach((accountStatus) => {
                if (accountStatus.email) {
                    // 计算状态显示信息
                    const statusInfo = getStatusDisplayInfo(accountStatus);

                    accountsStatus[accountStatus.email] = {
                        // 基础状态信息
                        status: accountStatus.status || "idle",
                        status_text: statusInfo.statusText,
                        color: statusInfo.color,

                        // 倒计时相关
                        countdown: statusInfo.countdown,
                        remaining_seconds: accountStatus.recoverySeconds || 0,

                        // 其他信息
                        last_used: accountStatus.lastUsedAt || null,
                        account_id: accountStatus.id || null,
                    };

                    console.log(
                        `📝 更新账户状态: ${accountStatus.email} -> ${
                            statusInfo.statusText
                        } ${
                            statusInfo.countdown
                                ? `(${statusInfo.countdown})`
                                : ""
                        }`
                    );
                }
            });

            // 强制刷新UI
            forceRefreshStatus.value++;
            lastSyncTime.value = new Date().toISOString();

            console.log(`🎉 状态同步完成，共更新 ${statusList.length} 个账户`);

            // 清除错误记录
            if (syncErrors.value.length > 0) {
                console.log("🧹 清除之前的同步错误记录");
                syncErrors.value = [];
            }

            return true;
        } else {
            throw new Error(
                "返回的数据格式不正确: " + JSON.stringify(response)
            );
        }
    } catch (error) {
        console.error("❌ 获取后端状态失败:", error);
        console.error("❌ 错误详情:", error.response?.data || error.message);

        // 记录错误
        const errorInfo = {
            time: new Date().toISOString(),
            message: error.message,
            details: error.response?.data || null,
        };
        syncErrors.value.push(errorInfo);

        // 只保留最近10个错误
        if (syncErrors.value.length > 10) {
            syncErrors.value = syncErrors.value.slice(-10);
        }

        ElMessage.error(`获取账户状态失败: ${error.message}`);
        return false;
    }
};

// 根据账户状态计算显示信息
const getStatusDisplayInfo = (accountStatus) => {
    const status = accountStatus.status || "idle";
    let statusText = "空闲";
    let color = "green";
    let countdown = "";

    switch (status) {
        case "idle":
            statusText = "空闲";
            color = "green";
            break;
        case "available":
            statusText = "可用";
            color = "yellow";
            break;
        case "busy":
            statusText = "繁忙";
            color = "red";
            // 计算倒计时
            if (
                accountStatus.recoverySeconds &&
                accountStatus.recoverySeconds > 0
            ) {
                countdown = formatTime(accountStatus.recoverySeconds);
                statusText = `繁忙 (${countdown})`;
            }
            break;
        default:
            statusText = "未知";
            color = "gray";
    }

    return {
        statusText,
        color,
        countdown,
    };
};

// 格式化时间显示
const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return "";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    }
};

// 记录账户使用到后端
const recordAccountUsageToBackend = async (email) => {
    console.log(`🔄 开始记录账户使用到后端: ${email}`);

    try {
        // 优先从已同步的状态中取 snowflake_id
        const snowflakeId = accountsStatus[email]?.snowflake_id || null;
        console.log("🆔 用于记录的 snowflake_id:", snowflakeId);

        if (!snowflakeId) {
            console.warn(
                "⚠️ 未获取到 snowflake_id，将尝试兼容旧接口: 使用邮箱调用"
            );
        }

        const startTime = Date.now();
        const response = await claudePoolService.recordAccountUsage(
            snowflakeId || email,
            {
                ip: "unknown",
                userAgent: navigator.userAgent,
            }
        );
        const endTime = Date.now();

        console.log(`✅ 账户使用记录成功，耗时: ${endTime - startTime}ms`);
        console.log(`📊 后端响应:`, response);

        // 检查响应状态
        if (response && (response.success || response.status === 0)) {
            console.log(`🎉 ${email} 使用记录成功`);
            return true;
        } else {
            console.warn(`⚠️ ${email} 使用记录响应异常:`, response);
            return false;
        }
    } catch (error) {
        console.error(`❌ 记录账户使用失败: ${email}`, error);
        console.error("❌ 错误详情:", error.response?.data || error.message);

        // 记录错误但不阻断流程
        const errorInfo = {
            time: new Date().toISOString(),
            email: email,
            action: "recordUsage",
            message: error.message,
            details: error.response?.data || null,
        };
        syncErrors.value.push(errorInfo);

        ElMessage.warning(`记录 ${email} 使用失败: ${error.message}`);
        return false;
    }
};

// 启动状态同步定时器
const startStatusSync = () => {
    console.log("🚀 启动状态同步定时器");

    // 立即执行一次
    fetchAccountsStatusFromBackend();

    // 设置定时器，每30秒同步一次
    statusSyncInterval.value = setInterval(() => {
        console.log("⏰ 定时同步账户状态");
        fetchAccountsStatusFromBackend();
    }, 30000);

    console.log("✅ 状态同步定时器已启动，间隔30秒");
};

// 停止状态同步定时器
const stopStatusSync = () => {
    if (statusSyncInterval.value) {
        console.log("🛑 停止状态同步定时器");
        clearInterval(statusSyncInterval.value);
        statusSyncInterval.value = null;
    }
};

// 组件挂载时启动同步
onMounted(() => {
    console.log("🎯 AccountGrid 组件已挂载");
    isInitialized.value = true;
    startStatusSync();
});

// 组件卸载时清理
onUnmounted(() => {
    console.log("🔚 AccountGrid 组件即将卸载");
    stopStatusSync();
});

// 暴露方法给父组件
defineExpose({
    updateAccountStatus,
    setAccountLoading,
    accountsStatus,
    forceRefreshStatus,
    fetchAccountsStatusFromBackend,
    recordAccountUsageToBackend,
    startStatusSync,
    stopStatusSync,
    syncErrors,
    lastSyncTime,
    isInitialized,
});
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
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
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

.debug-btn.info {
    background: #17a2b8;
    color: white;
}

.debug-btn.warning {
    background: #ffc107;
    color: #212529;
}

.debug-btn:hover {
    opacity: 0.8;
}

/* 错误列表样式 */
.error-list {
    max-height: 150px;
    overflow-y: auto;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    background: #fff5f5;
}

.error-item {
    padding: 8px;
    border-bottom: 1px solid #fed7d7;
    font-size: 11px;
}

.error-item:last-child {
    border-bottom: none;
}

.error-item small {
    color: #999;
    display: block;
    margin-bottom: 2px;
}

.error-msg {
    color: #e53e3e;
    font-weight: 500;
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
