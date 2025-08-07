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

                    <div class="action-buttons">
                        <el-button @click="selectAll" size="large">全选</el-button>
                        <el-button @click="selectNone" size="large">反选</el-button>
                        <el-button
                            type="danger"
                            @click="deleteSelected"
                            :disabled="selectedAccounts.length === 0"
                            size="large"
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
                    </div>
                </template>

                <!-- 加载中提示 -->
                <div v-if="loading" class="loading-message">
                    <el-skeleton :rows="5" animated />
                </div>

                <!-- 账户表格 -->
                <div v-else-if="filteredAccounts.length > 0" class="account-table">
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
import { ref, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { claudePoolApi } from "@/api/claude-pool";

// Props
const props = defineProps({
    adminPassword: {
        type: String,
        required: true,
    },
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
            : "N/A",
    }));

    if (!searchQuery.value) {
        return processedAccounts;
    }

    return processedAccounts.filter((account) =>
        account.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
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
        await claudePoolApi.deleteAccount(props.adminPassword, email);
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
            await claudePoolApi.deleteAccount(props.adminPassword, email);
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
            props.adminPassword,
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
            props.adminPassword,
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

// 监听账户列表变化，清空选择
watch(
    () => props.accountList,
    () => {
        selectedAccounts.value = [];
    }
);
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
