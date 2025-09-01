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
                v-for="account in sortedAccounts"
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

// 后端状态同步相关
const statusSyncInterval = ref(null);
const lastSyncTime = ref(null);
const syncErrors = ref([]);
const isInitialized = ref(false);

// 排序后的账户列表
const sortedAccounts = computed(() => {
    if (!props.accounts || props.accounts.length === 0) {
        return [];
    }

    // 创建账户副本并添加状态信息
    const accountsWithStatus = props.accounts.map((account) => ({
        ...account,
        currentStatus: getAccountStatus(account.email),
    }));

    // 定义状态优先级 (数字越小优先级越高)
    const statusPriority = {
        idle: 1, // 空闲状态优先级最高
        available: 2, // 可用状态次之
        busy: 3, // 繁忙状态最后
    };

    // 按状态优先级排序
    return accountsWithStatus.sort((a, b) => {
        const statusA = a.currentStatus?.status || "available";
        const statusB = b.currentStatus?.status || "available";

        const priorityA = statusPriority[statusA] || 999;
        const priorityB = statusPriority[statusB] || 999;

        // 如果状态优先级相同，按邮箱字母顺序排序
        if (priorityA === priorityB) {
            return a.email.localeCompare(b.email);
        }

        return priorityA - priorityB;
    });
});

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

        // 静默处理错误，不显示消息给用户
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

        // 静默处理记录失败，不显示消息给用户
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
</style>
