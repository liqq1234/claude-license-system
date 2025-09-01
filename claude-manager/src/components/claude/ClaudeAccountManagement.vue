<template>
    <div class="account-management">
        <!-- 添加用户区域 -->
        <div class="add-user-section">
            <el-card>
                <template #header>
                    <div class="card-header">
                        <span>➕ 添加新用户</span>
                    </div>
                </template>

                <div class="add-user-form">
                    <el-row :gutter="20">
                        <el-col :span="8">
                            <el-input
                                v-model="newUser.email"
                                placeholder="new-user@example.com"
                                size="large"
                                :disabled="addLoading"
                            >
                                <template #prepend>📧 邮箱</template>
                            </el-input>
                        </el-col>
                        <el-col :span="12">
                            <el-input
                                v-model="newUser.sessionKey"
                                placeholder="sk-ant-session-..."
                                size="large"
                                :disabled="addLoading"
                            >
                                <template #prepend>🔑 Session Key</template>
                            </el-input>
                        </el-col>
                        <el-col :span="4">
                            <el-button
                                type="primary"
                                size="large"
                                :loading="addLoading"
                                @click="addUser"
                                :disabled="!newUser.email || !newUser.sessionKey"
                                class="add-button"
                            >{{ addLoading ? '添加中...' : '添加用户' }}</el-button>
                        </el-col>
                    </el-row>
                </div>
            </el-card>
        </div>

        <!-- 搜索和操作栏 -->
        <div class="search-section">
            <el-card>
                <div class="search-bar">
                    <el-input
                        v-model="searchQuery"
                        placeholder="按邮箱搜索..."
                        size="large"
                        clearable
                        class="search-input"
                    >
                        <template #prefix>🔍</template>
                    </el-input>

                    <div class="view-mode-switch">
                        <el-radio-group v-model="viewMode" size="large">
                            <el-radio-button value="table">📋 表格视图</el-radio-button>
                            <el-radio-button value="cards">🎯 状态卡片</el-radio-button>
                        </el-radio-group>
                    </div>

                    <div class="action-buttons">
                        <el-button @click="selectAll" size="large" v-if="viewMode === 'table'">全选</el-button>
                        <el-button @click="selectNone" size="large" v-if="viewMode === 'table'">反选</el-button>
                        <el-button
                            type="danger"
                            @click="deleteSelected"
                            :disabled="selectedAccounts.length === 0"
                            size="large"
                            v-if="viewMode === 'table'"
                        >删除选中 ({{ selectedAccounts.length }})</el-button>
                        <el-button @click="refreshAccounts" size="large">🔄 刷新</el-button>
                    </div>
                </div>
            </el-card>
        </div>

        <!-- 账户列表 -->
        <div class="account-list-section">
            <el-card>
                <template #header>
                    <div class="card-header">
                        <span>👥 用户账户列表 ({{ filteredAccounts.length }})</span>
                        <span
                            class="view-mode-indicator"
                        >{{ viewMode === 'table' ? '表格视图' : '状态卡片视图' }}</span>
                    </div>
                </template>

                <!-- 加载中提示 -->
                <div v-if="loading" class="loading-message">
                    <el-skeleton :rows="5" animated />
                </div>

                <!-- 状态卡片视图 -->
                <div
                    v-else-if="viewMode === 'cards' && filteredAccounts.length > 0"
                    class="cards-view"
                >
                    <div class="account-cards-grid">
                        <div
                            v-for="account in filteredAccounts"
                            :key="account.email"
                            class="account-card"
                            @click="handleAccountLogin(account)"
                        >
                            <div class="card-header">
                                <h3>{{ account.unique_name || account.email }}</h3>
                                <span class="status-badge status-idle">空闲</span>
                            </div>
                            <div class="card-body">
                                <p>
                                    <strong>邮箱:</strong>
                                    {{ account.email }}
                                </p>
                                <p>
                                    <strong>创建时间:</strong>
                                    {{ formatDate(account.created_at) }}
                                </p>
                                <p>
                                    <strong>使用次数:</strong>
                                    {{ account.usage_count || 0 }}
                                </p>
                            </div>
                            <div class="card-actions">
                                <el-button
                                    type="primary"
                                    size="small"
                                    @click.stop="handleAccountLogin(account)"
                                >登录使用</el-button>
                                <el-button
                                    type="danger"
                                    size="small"
                                    @click.stop="handleDeleteAccount(account)"
                                >删除</el-button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 账户表格 -->
                <div
                    v-else-if="viewMode === 'table' && filteredAccounts.length > 0"
                    class="account-table"
                >
                    <el-table
                        :data="filteredAccounts"
                        style="width: 100%"
                        @selection-change="handleSelectionChange"
                    >
                        <el-table-column type="selection" width="55" />

                        <el-table-column prop="email" label="邮箱地址" min-width="200">
                            <template #default="{ row }">
                                <el-input
                                    v-if="editingAccount === row.email"
                                    v-model="editForm.email"
                                    size="small"
                                />
                                <span v-else class="email-text">{{ row.email }}</span>
                            </template>
                        </el-table-column>

                        <el-table-column prop="sk_preview" label="Session Key" min-width="300">
                            <template #default="{ row }">
                                <el-input
                                    v-if="editingAccount === row.email"
                                    v-model="editForm.sessionKey"
                                    size="small"
                                    type="password"
                                    show-password
                                    placeholder="输入完整的 Session Key (sk-ant-...)"
                                />
                                <span v-else class="sk-preview">{{ row.sk_preview }}</span>
                            </template>
                        </el-table-column>

                        <el-table-column label="操作" width="150">
                            <template #default="{ row }">
                                <div class="action-buttons-cell">
                                    <template v-if="editingAccount === row.email">
                                        <el-button
                                            type="success"
                                            size="small"
                                            @click="saveEdit(row.email)"
                                            :loading="editLoading"
                                        >保存</el-button>
                                        <el-button size="small" @click="cancelEdit">取消</el-button>
                                    </template>
                                    <template v-else>
                                        <el-button
                                            type="primary"
                                            size="small"
                                            @click="startEdit(row)"
                                        >编辑</el-button>
                                        <el-button
                                            type="danger"
                                            size="small"
                                            @click="deleteAccount(row.email)"
                                        >删除</el-button>
                                    </template>
                                </div>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>

                <!-- 空状态 -->
                <div v-else class="empty-state">
                    <el-empty description="暂无账户数据">
                        <el-button type="primary" @click="refreshAccounts">刷新数据</el-button>
                    </el-empty>
                </div>
            </el-card>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { claudePoolApi } from "@/api/claude-pool";

// Props
const props = defineProps({
    accountList: {
        type: Array,
        default: () => [],
    },
});

// Emits
const emit = defineEmits(["refresh"]);

// 响应式数据
const loading = ref(false);
const addLoading = ref(false);
const editLoading = ref(false);
const searchQuery = ref("");
const selectedAccounts = ref([]);
const editingAccount = ref(null);
const viewMode = ref("table"); // 'table' 或 'cards'

// 新用户表单
const newUser = ref({
    email: "",
    sessionKey: "",
});

// 编辑表单
const editForm = ref({
    email: "",
    sessionKey: "",
});

// 计算属性
const filteredAccounts = computed(() => {
    if (!props.accountList || props.accountList.length === 0) {
        return [];
    }

    // 处理账户数据，添加 sk_preview 字段
    const processedAccounts = props.accountList.map((account) => ({
        ...account,
        sk_preview: account.sessionKey
            ? `${account.sessionKey.substring(0, 20)}...`
            : account.sk
            ? `${account.sk.substring(0, 20)}...`
            : account.sk_preview || "N/A",
    }));

    if (!searchQuery.value) {
        return processedAccounts;
    }

    return processedAccounts.filter((account) =>
        account.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

const accountsStatus = ref(new Map());

// 带状态的账户列表
const accountsWithStatus = computed(() => {
    return filteredAccounts.value.map((account) => {
        const status = accountsStatus.value.get(account.email) || {
            status: "idle",
            status_text: "空闲",
            color: "green",
            countdown: "",
            remaining_seconds: 0,
        };
        return {
            ...account,
            ...status,
        };
    });
});

// 方法
const toggleSelection = (email) => {
    const index = selectedAccounts.value.indexOf(email);
    if (index > -1) {
        selectedAccounts.value.splice(index, 1);
    } else {
        selectedAccounts.value.push(email);
    }
};

const selectAll = () => {
    selectedAccounts.value = filteredAccounts.value.map(
        (account) => account.email
    );
};

const selectNone = () => {
    selectedAccounts.value = [];
};

const deleteAccount = async (email) => {
    try {
        await ElMessageBox.confirm(`确定要删除账户 ${email} 吗？`, "确认删除", {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
        });

        loading.value = true;
        await claudePoolApi.deleteAccount(email);
        ElMessage.success("账户删除成功");
        emit("refresh");
    } catch (error) {
        if (error !== "cancel") {
            console.error("删除账户失败:", error);
            ElMessage.error("删除账户失败");
        }
    } finally {
        loading.value = false;
    }
};

const deleteSelected = async () => {
    if (selectedAccounts.value.length === 0) return;

    try {
        await ElMessageBox.confirm(
            `确定要删除选中的 ${selectedAccounts.value.length} 个账户吗？`,
            "批量删除确认",
            {
                confirmButtonText: "确定",
                cancelButtonText: "取消",
                type: "warning",
            }
        );

        loading.value = true;
        // 批量删除账户
        for (const email of selectedAccounts.value) {
            await claudePoolApi.deleteAccount(email);
        }
        ElMessage.success(`成功删除 ${selectedAccounts.value.length} 个账户`);
        selectedAccounts.value = [];
        emit("refresh");
    } catch (error) {
        if (error !== "cancel") {
            console.error("批量删除账户失败:", error);
            ElMessage.error("批量删除账户失败");
        }
    } finally {
        loading.value = false;
    }
};

// 添加用户
const addUser = async () => {
    if (!newUser.value.email || !newUser.value.sessionKey) {
        ElMessage.warning("请填写完整的邮箱和Session Key");
        return;
    }

    try {
        addLoading.value = true;
        await claudePoolApi.addAccount(
            newUser.value.email,
            newUser.value.sessionKey
        );
        ElMessage.success("用户添加成功");

        // 清空表单
        newUser.value.email = "";
        newUser.value.sessionKey = "";

        emit("refresh");
    } catch (error) {
        console.error("添加用户失败:", error);
        ElMessage.error("添加用户失败");
    } finally {
        addLoading.value = false;
    }
};

// 刷新账户列表
const refreshAccounts = () => {
    emit("refresh");
};

// 刷新所有账户状态
const refreshAllStatus = async () => {
    statusLoading.value = true;
    try {
        const statusList = await claudePoolApi.getAllAccountsStatus();

        // 更新状态映射
        accountsStatus.value.clear();
        statusList.forEach((status) => {
            accountsStatus.value.set(status.email, status);
        });

        ElMessage.success("状态刷新成功");
    } catch (error) {
        console.error("刷新状态失败:", error);
        ElMessage.error("刷新状态失败");
    } finally {
        statusLoading.value = false;
    }
};

// 处理账户登录
const handleAccountLogin = async (account) => {
    try {
        // 这里可以调用实际的登录逻辑
        // 例如调用快速登录API
        await claudePoolApi.adminSpecificLogin(
            account.email,
            account.unique_name || account.email.split("@")[0]
        );

        ElMessage.success(`正在为您登录 ${account.email}`);
    } catch (error) {
        console.error("登录失败:", error);
        ElMessage.error(
            "登录失败: " + (error.response?.data?.error || error.message)
        );
    }
};

// 处理状态更新
const handleStatusUpdated = (status) => {
    accountsStatus.value.set(status.email, status);
};

// 处理表格选择变化
const handleSelectionChange = (selection) => {
    selectedAccounts.value = selection.map((item) => item.email);
};

// 开始编辑
const startEdit = (account) => {
    editingAccount.value = account.email;
    editForm.value.email = account.email;
    editForm.value.sessionKey = ""; // 清空，让用户输入新的完整SK
};

// 保存编辑
const saveEdit = async (originalEmail) => {
    try {
        editLoading.value = true;
        await claudePoolApi.updateAccount(
            originalEmail,
            editForm.value.email,
            editForm.value.sessionKey
        );
        ElMessage.success("账户更新成功");
        cancelEdit();
        emit("refresh");
    } catch (error) {
        console.error("更新账户失败:", error);
        ElMessage.error("更新账户失败");
    } finally {
        editLoading.value = false;
    }
};

// 取消编辑
const cancelEdit = () => {
    editingAccount.value = null;
    editForm.value.email = "";
    editForm.value.sessionKey = "";
};

// 监听账户列表变化，清空选择并加载状态
watch(
    () => props.accountList,
    (newAccountList) => {
        selectedAccounts.value = [];
        // 当账户列表变化时，自动加载状态（仅在卡片视图模式下）
        if (
            viewMode.value === "cards" &&
            newAccountList &&
            newAccountList.length > 0
        ) {
            refreshAllStatus();
        }
    }
);

// 监听视图模式变化，切换到卡片视图时加载状态
watch(
    () => viewMode.value,
    (newMode) => {
        if (
            newMode === "cards" &&
            props.accountList &&
            props.accountList.length > 0
        ) {
            refreshAllStatus();
        }
    }
);

// 组件挂载时，如果是卡片视图且有账户数据，则加载状态
onMounted(() => {
    if (
        viewMode.value === "cards" &&
        props.accountList &&
        props.accountList.length > 0
    ) {
        refreshAllStatus();
    }
});
</script>

<style scoped>
.account-management {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* 添加用户区域 */
.add-user-section {
    margin-bottom: 20px;
}

.add-user-form {
    padding: 10px 0;
}

.add-button {
    width: 100%;
}

/* 搜索区域 */
.search-section {
    margin-bottom: 20px;
}

.search-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
}

.search-input {
    flex: 1;
    max-width: 400px;
}

.action-buttons {
    display: flex;
    gap: 10px;
}

/* 账户列表区域 */
.account-list-section {
    flex: 1;
}

.account-table {
    margin-top: 10px;
}

.action-buttons-cell {
    display: flex;
    gap: 5px;
}

.email-text {
    font-family: monospace;
    color: #303133;
}

.sk-preview {
    font-family: monospace;
    color: #909399;
    font-size: 12px;
}

.loading-message {
    padding: 40px;
    text-align: center;
}

.empty-state {
    padding: 40px;
    text-align: center;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.view-mode-indicator {
    font-size: 12px;
    color: #909399;
    font-weight: normal;
}

/* 搜索栏样式 */
.search-bar {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
}

.search-input {
    flex: 1;
    min-width: 200px;
}

.view-mode-switch {
    flex-shrink: 0;
}

.action-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

/* 卡片视图样式 */
.cards-view {
    margin-top: 16px;
}

.account-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    padding: 8px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .search-bar {
        flex-direction: column;
        align-items: stretch;
    }

    .view-mode-switch {
        order: -1;
    }

    .account-cards-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 1200px) {
    .account-cards-grid {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }
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

:deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;
}

:deep(.el-table th) {
    background: #fafafa;
    color: #303133;
    font-weight: 600;
}
</style>
