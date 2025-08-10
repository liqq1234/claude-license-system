<template>
    <div class="claude-manager">
        <!-- 管理界面 -->
        <div class="management-section">
            <!-- 状态栏 -->
            <div class="status-section">
                <el-card class="status-card">
                    <div class="status-content">
                        <div class="status-info">
                            <span class="status-icon">✅</span>
                            <span class="status-text">管理员已登录</span>
                            <span class="url-info">连接到: {{ apiBaseUrl }}</span>
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
const isAuthenticated = ref(true); // 直接设置为已认证状态
const adminPassword = ref("admin123"); // 设置默认密码
const accountList = ref([]);
const activeTab = ref("manage");
const apiBaseUrl = ref(
    import.meta.env.VITE_CLAUDE_POOL_API_URL || "http://localhost:3457"
);

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
onMounted(async () => {
    // 自动加载账户列表
    await loadAccountList();
});
</script>

<style scoped>
.claude-manager {
    padding: 0;
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
