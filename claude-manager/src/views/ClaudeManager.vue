<template>
    <div class="claude-manager">
        <!-- 管理员登录 -->
        <div v-if="!isAuthenticated" class="login-section">
            <el-card class="login-card">
                <template #header>
                    <div class="card-header">
                        <span>🤖 Claude Pool Manager</span>
                    </div>
                </template>

                <div class="login-content">
                    <div class="login-description">
                        <p>请输入管理员密码以访问 Claude 账户管理功能</p>
                        <div class="current-url">
                            <span class="url-label">后端地址:</span>
                            <span class="url-value">http://127.0.0.1:8787</span>
                        </div>
                    </div>

                    <form @submit.prevent="handleLogin" class="login-form">
                        <el-input
                            v-model="loginForm.password"
                            type="password"
                            placeholder="输入管理员密码"
                            size="large"
                            show-password
                            :disabled="loginLoading"
                        />

                        <div v-if="authError" class="error-message">
                            <el-alert :title="authError" type="error" :closable="false" />
                        </div>

                        <el-button
                            type="primary"
                            size="large"
                            :loading="loginLoading"
                            @click="handleLogin"
                            class="login-button"
                        >{{ loginLoading ? '登录中...' : '登录' }}</el-button>
                    </form>
                </div>
            </el-card>
        </div>

        <!-- 管理界面 -->
        <div v-else class="management-section">
            <!-- 状态栏 -->
            <div class="status-section">
                <el-card class="status-card">
                    <div class="status-content">
                        <div class="status-info">
                            <span class="status-icon">✅</span>
                            <span class="status-text">管理员已登录</span>
                            <span class="url-info">连接到: http://127.0.0.1:8787</span>
                        </div>
                        <el-button type="danger" size="small" @click="handleLogout">退出登录</el-button>
                    </div>
                </el-card>
            </div>

            <!-- 功能标签页 -->
            <div class="tabs-section">
                <el-card>
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
                        <el-tab-pane label="批量操作" name="batch_add">
                            <ClaudeBatchOperations
                                :admin-password="adminPassword"
                                @success="() => { loadAccountList(); activeTab = 'manage'; }"
                            />
                        </el-tab-pane>

                        <!-- 快速登录 -->
                        <el-tab-pane label="快速登录" name="quick_login">
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
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { claudePoolApi } from "@/api/claude-pool";
import ClaudeAccountManagement from "@/components/claude/ClaudeAccountManagement.vue";
import ClaudeBatchOperations from "@/components/claude/ClaudeBatchOperations.vue";
import ClaudeQuickLogin from "@/components/claude/ClaudeQuickLogin.vue";

// 响应式数据
const isAuthenticated = ref(false);
const loginLoading = ref(false);
const adminPassword = ref("");
const accountList = ref([]);
const activeTab = ref("manage");
const authError = ref("");

const loginForm = reactive({
    password: "",
});

// 管理员登录
const handleLogin = async () => {
    if (!loginForm.password.trim()) {
        ElMessage.warning("请输入管理员密码");
        return;
    }

    loginLoading.value = true;
    try {
        await claudePoolApi.adminLogin(loginForm.password);

        adminPassword.value = loginForm.password;
        isAuthenticated.value = true;

        ElMessage.success("登录成功！");

        // 加载账户列表
        await loadAccountList();
    } catch (error) {
        console.error("登录失败:", error);
        ElMessage.error(error.response?.data?.error || "登录失败，请检查密码");
    } finally {
        loginLoading.value = false;
    }
};

// 退出登录
const handleLogout = () => {
    isAuthenticated.value = false;
    adminPassword.value = "";
    loginForm.password = "";
    accountList.value = [];
    ElMessage.info("已退出登录");
};

// 加载账户列表
const loadAccountList = async () => {
    if (!adminPassword.value) return;

    try {
        const response = await claudePoolApi.getAccountList(
            adminPassword.value
        );

        // 后端直接返回数组，不是包含accounts字段的对象
        if (Array.isArray(response)) {
            accountList.value = response.map((item) => ({
                email: item.email,
                sessionKey: "", // 我们不存储完整的SK，只在编辑时获取
                sk_preview: item.sk_preview,
                index: item.index,
            }));
        } else {
            accountList.value = [];
        }

        console.log("加载的账户列表:", accountList.value);
    } catch (error) {
        console.error("加载账户列表失败:", error);
        ElMessage.error("加载账户列表失败");
        accountList.value = [];
    }
};

// 删除了未使用的refreshData函数

// 组件挂载
onMounted(() => {
    // 可以在这里检查是否有保存的登录状态
});
</script>

<style scoped>
.claude-manager {
    padding: 0;
}

/* 登录部分 */
.login-section {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
}

.login-card {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
}

.login-content {
    padding: 20px 0;
}

.login-description {
    text-align: center;
    margin-bottom: 30px;
}

.login-description p {
    margin: 0 0 15px 0;
    color: #606266;
    font-size: 14px;
    line-height: 1.5;
}

.current-url {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #f5f7fa;
    border-radius: 6px;
    font-size: 12px;
}

.url-label {
    color: #909399;
    font-weight: 500;
}

.url-value {
    color: #409eff;
    font-family: monospace;
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.login-button {
    width: 100%;
}

.error-message {
    margin-top: 10px;
}

/* 管理界面 */
.management-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.status-section {
    margin-bottom: 20px;
}

.status-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.status-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.status-icon {
    font-size: 18px;
}

.status-text {
    font-weight: 600;
    color: #303133;
}

.url-info {
    color: #909399;
    font-size: 12px;
    font-family: monospace;
}

.tabs-section {
    flex: 1;
}

.card-header {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

/* 全局样式 - 与仪表板保持一致 */
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

:deep(.el-tabs--border-card) {
    border: none;
    box-shadow: none;
}

:deep(.el-tabs--border-card > .el-tabs__header) {
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
    margin: 0;
}

:deep(.el-tabs--border-card > .el-tabs__content) {
    padding: 20px;
}
</style>
