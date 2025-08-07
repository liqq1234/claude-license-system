<template>
    <div class="claude-user-interface">
        <!-- 随机登录区域 -->
        <div class="random-login-section">
            <el-card class="random-card">
                <template #header>
                    <div class="card-header">
                        <el-icon class="header-icon">
                            <Refresh />
                        </el-icon>
                        <span>快速随机登录</span>
                    </div>
                </template>

                <div class="random-content">
                    <p class="random-description">点击下方按钮，系统将随机选择一个可用的Claude账户为您生成登录链接。</p>

                    <el-button
                        type="primary"
                        size="large"
                        @click="handleRandomLogin"
                        :loading="randomLoading"
                        :disabled="!hasAvailableAccounts"
                        class="random-button"
                    >
                        <el-icon>
                            <Rocket />
                        </el-icon>
                        {{ randomLoading ? '获取中...' : '🚀 随机登录' }}
                    </el-button>

                    <p
                        class="random-hint"
                    >{{ hasAvailableAccounts ? '点击随机选择一个可用账户进行登录。' : '当前没有可用的账户，请联系管理员添加。' }}</p>
                </div>
            </el-card>
        </div>

        <!-- 特定账户登录区域 -->
        <div class="specific-login-section">
            <h3 class="section-title">或选择特定账户登录:</h3>

            <!-- 加载状态 -->
            <div v-if="emailsLoading" class="loading-section">
                <el-skeleton :rows="3" animated />
                <div class="loading-text">正在加载可用账户...</div>
            </div>

            <!-- 错误状态 -->
            <div v-else-if="emailsError" class="error-section">
                <el-empty image="/images/error.svg" description="加载失败">
                    <div class="error-message">{{ emailsError }}</div>
                    <el-button type="primary" @click="loadEmails">重试</el-button>
                </el-empty>
            </div>

            <!-- 空状态 -->
            <div v-else-if="emails.length === 0" class="empty-section">
                <el-empty image="/images/empty.svg" description="暂无可用账户">
                    <div class="empty-message">当前没有可用的Claude账户，请联系管理员添加账户。</div>
                </el-empty>
            </div>

            <!-- 账户列表 -->
            <div v-else class="email-list">
                <ClaudeEmailCard
                    v-for="email in emails"
                    :key="email"
                    :email="email"
                    @click="openUniqueNameModal"
                />
            </div>
        </div>

        <!-- 会话配置对话框 -->
        <el-dialog
            v-model="showUniqueNameModal"
            title="配置Claude会话"
            width="500px"
            :before-close="handleModalClose"
            class="session-dialog"
        >
            <div class="dialog-content">
                <!-- 选中的邮箱 -->
                <div class="selected-email">
                    <el-icon class="email-icon">
                        <Message />
                    </el-icon>
                    <span class="email-text">{{ selectedEmailForLogin }}</span>
                </div>

                <!-- 会话配置表单 -->
                <el-form :model="sessionForm" label-width="120px" class="session-form">
                    <el-form-item label="会话标识" required>
                        <el-input
                            v-model="sessionForm.uniqueName"
                            placeholder="输入唯一标识"
                            maxlength="50"
                            show-word-limit
                        >
                            <template #append>
                                <el-button @click="generateRandomId">随机生成</el-button>
                            </template>
                        </el-input>
                        <div class="form-hint">用于区分同一账户下的不同会话，请确保其唯一性。</div>
                    </el-form-item>

                    <el-form-item label="令牌有效期">
                        <el-select
                            v-model="sessionForm.expiresIn"
                            placeholder="选择有效期"
                            style="width: 100%"
                        >
                            <el-option label="默认设置" :value="''" />
                            <el-option label="1小时" :value="3600" />
                            <el-option label="6小时" :value="21600" />
                            <el-option label="12小时" :value="43200" />
                            <el-option label="1天" :value="86400" />
                            <el-option label="3天" :value="259200" />
                            <el-option label="7天" :value="604800" />
                        </el-select>
                        <div class="form-hint">设置登录令牌的有效时间，留空使用默认设置。</div>
                    </el-form-item>

                    <!-- 快速设置 -->
                    <el-form-item label="快速设置">
                        <div class="quick-buttons">
                            <el-button size="small" @click="setQuickExpiry(3600)">1小时</el-button>
                            <el-button size="small" @click="setQuickExpiry(86400)">1天</el-button>
                            <el-button size="small" @click="setQuickExpiry(604800)">7天</el-button>
                            <el-button size="small" @click="setQuickExpiry('')">默认</el-button>
                        </div>
                    </el-form-item>
                </el-form>
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="handleModalClose">取消</el-button>
                    <el-button
                        type="primary"
                        @click="handleSpecificLogin"
                        :loading="specificLoading"
                        :disabled="!sessionForm.uniqueName.trim()"
                    >{{ specificLoading ? '获取中...' : '获取登录链接' }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Refresh, Rocket, Message } from "@element-plus/icons-vue";
import { claudePoolApi } from "@/api/claude-pool";
import ClaudeEmailCard from "./ClaudeEmailCard.vue";

// 响应式数据
const emails = ref([]);
const emailsLoading = ref(false);
const emailsError = ref("");
const randomLoading = ref(false);
const specificLoading = ref(false);
const showUniqueNameModal = ref(false);
const selectedEmailForLogin = ref("");

const sessionForm = reactive({
    uniqueName: "",
    expiresIn: "",
});

// 计算属性
const hasAvailableAccounts = computed(() => emails.value.length > 0);

// 生成随机ID
const generateRandomId = () => {
    sessionForm.uniqueName = claudePoolApi.generateRandomId();
};

// 设置快速有效期
const setQuickExpiry = (seconds) => {
    sessionForm.expiresIn = seconds;
};

// 加载可用邮箱
const loadEmails = async () => {
    emailsLoading.value = true;
    emailsError.value = "";

    try {
        const response = await claudePoolApi.getAvailableEmails();
        emails.value = response.emails || [];
    } catch (error) {
        console.error("加载邮箱列表失败:", error);
        emailsError.value = error.response?.data?.error || "获取账户列表失败";
    } finally {
        emailsLoading.value = false;
    }
};

// 随机登录
const handleRandomLogin = async () => {
    if (!hasAvailableAccounts.value) {
        ElMessage.warning("没有可用的账户");
        return;
    }

    randomLoading.value = true;
    try {
        const response = await claudePoolApi.randomLogin();

        if (response.login_url) {
            ElMessage.success("正在为您随机分配Claude账户...");

            // 在当前窗口直接跳转到 Claude（与fuclaude-pool-manager-ui-main一致）
            window.location.href = response.login_url;

            if (response.warning) {
                ElMessage.warning(response.warning);
            }
        } else {
            ElMessage.error("获取登录链接失败");
        }
    } catch (error) {
        console.error("随机登录失败:", error);
        ElMessage.error(error.response?.data?.error || "随机登录失败");
    } finally {
        randomLoading.value = false;
    }
};

// 打开会话配置对话框
const openUniqueNameModal = (email) => {
    selectedEmailForLogin.value = email;
    if (!sessionForm.uniqueName.trim()) {
        generateRandomId();
    }
    showUniqueNameModal.value = true;
};

// 特定账户登录
const handleSpecificLogin = async () => {
    if (!sessionForm.uniqueName.trim()) {
        ElMessage.warning("请输入会话标识");
        return;
    }

    specificLoading.value = true;
    try {
        const expiresIn =
            sessionForm.expiresIn === "" ? null : sessionForm.expiresIn;
        const response = await claudePoolApi.specificLogin(
            selectedEmailForLogin.value,
            sessionForm.uniqueName,
            expiresIn
        );

        if (response.login_url) {
            ElMessage.success(
                `正在为您打开 ${selectedEmailForLogin.value} 的Claude界面...`
            );

            // 在当前窗口直接跳转到 Claude（与fuclaude-pool-manager-ui-main一致）
            window.location.href = response.login_url;

            // 关闭对话框并重置表单
            handleModalClose();

            if (response.warning) {
                ElMessage.warning(response.warning);
            }
        } else {
            ElMessage.error("获取登录链接失败");
        }
    } catch (error) {
        console.error("特定账户登录失败:", error);
        ElMessage.error(error.response?.data?.error || "登录失败");
    } finally {
        specificLoading.value = false;
    }
};

// 关闭对话框
const handleModalClose = () => {
    showUniqueNameModal.value = false;
    sessionForm.uniqueName = "";
    sessionForm.expiresIn = "";
    selectedEmailForLogin.value = "";
};

// 组件挂载时加载邮箱列表
onMounted(() => {
    loadEmails();
});
</script>

<style scoped>
.claude-user-interface {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
}

.random-login-section {
    margin-bottom: 40px;
}

.random-card {
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
}

.header-icon {
    font-size: 20px;
    color: #667eea;
}

.random-content {
    text-align: center;
    padding: 20px 0;
}

.random-description {
    margin: 0 0 24px 0;
    color: #606266;
    font-size: 16px;
    line-height: 1.6;
}

.random-button {
    width: 300px;
    height: 50px;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
}

.random-hint {
    margin: 0;
    color: #909399;
    font-size: 14px;
}

.specific-login-section {
    margin-bottom: 40px;
}

.section-title {
    margin: 0 0 20px 0;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
}

.loading-section,
.error-section,
.empty-section {
    padding: 40px 20px;
    text-align: center;
}

.loading-text {
    margin-top: 16px;
    color: #909399;
    font-size: 14px;
}

.error-message,
.empty-message {
    margin: 16px 0;
    color: #606266;
    font-size: 14px;
    line-height: 1.6;
}

.email-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.session-dialog {
    border-radius: 12px;
}

.dialog-content {
    padding: 0;
}

.selected-email {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    margin-bottom: 24px;
}

.email-icon {
    font-size: 20px;
    color: #409eff;
}

.email-text {
    font-size: 16px;
    font-weight: 500;
    color: #303133;
}

.session-form {
    padding: 0;
}

.form-hint {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
    line-height: 1.4;
}

.quick-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .claude-user-interface {
        padding: 16px;
    }

    .random-button {
        width: 100%;
    }

    .email-list {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .quick-buttons {
        justify-content: center;
    }
}
</style>
