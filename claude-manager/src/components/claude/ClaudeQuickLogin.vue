<template>
    <div class="quick-login">
        <div class="login-header">
            <h3>快速登录</h3>
            <p class="login-description">选择账户快速生成Claude登录链接，支持随机登录和指定账户登录。</p>
        </div>

        <!-- 随机登录 -->
        <el-card class="login-card">
            <template #header>
                <div class="card-header">
                    <span>🎲</span>
                    <span>随机登录</span>
                </div>
            </template>

            <div class="random-login-content">
                <p>系统将随机选择一个可用账户为您生成登录链接。</p>

                <el-form :model="randomForm" label-width="120px">
                    <el-form-item label="令牌有效期">
                        <el-select
                            v-model="randomForm.expiresIn"
                            placeholder="选择有效期"
                            style="width: 200px"
                        >
                            <el-option label="默认设置" :value="null" />
                            <el-option label="1小时" :value="3600" />
                            <el-option label="6小时" :value="21600" />
                            <el-option label="12小时" :value="43200" />
                            <el-option label="1天" :value="86400" />
                            <el-option label="3天" :value="259200" />
                            <el-option label="7天" :value="604800" />
                        </el-select>
                    </el-form-item>

                    <el-form-item>
                        <el-button
                            type="primary"
                            @click="handleDirectLogin()"
                            :loading="randomLoading"
                            :disabled="!directLoginEnabled"
                            size="large"
                        >{{ randomLoading ? '登录中...' : '🚀 随机直登 Claude' }}</el-button>
                    </el-form-item>
                </el-form>
            </div>
        </el-card>

        <!-- 指定账户登录 -->
        <el-card class="login-card">
            <template #header>
                <div class="card-header">
                    <el-icon>
                        <User />
                    </el-icon>
                    <span>指定账户登录</span>
                </div>
            </template>

            <div class="specific-login-content">
                <el-form :model="specificForm" label-width="120px">
                    <el-form-item label="选择账户" required>
                        <el-select
                            v-model="specificForm.email"
                            placeholder="请选择账户"
                            style="width: 100%"
                            filterable
                        >
                            <el-option
                                v-for="account in accountList"
                                :key="account.email"
                                :label="account.email"
                                :value="account.email"
                            >
                                <div class="account-option">
                                    <span class="account-email">{{ account.email }}</span>
                                    <el-tag size="small" type="success">可用</el-tag>
                                </div>
                            </el-option>
                        </el-select>
                    </el-form-item>

                    <el-form-item label="会话标识" required>
                        <el-input
                            v-model="specificForm.uniqueName"
                            placeholder="输入唯一标识或点击生成"
                            style="width: 100%"
                        >
                            <template #append>
                                <el-button @click="generateRandomId">随机生成</el-button>
                            </template>
                        </el-input>
                        <div class="form-hint">用于区分同一账户下的不同会话，请确保其唯一性。</div>
                    </el-form-item>

                    <el-form-item label="令牌有效期">
                        <el-select
                            v-model="specificForm.expiresIn"
                            placeholder="选择有效期"
                            style="width: 200px"
                        >
                            <el-option label="默认设置" :value="null" />
                            <el-option label="1小时" :value="3600" />
                            <el-option label="6小时" :value="21600" />
                            <el-option label="12小时" :value="43200" />
                            <el-option label="1天" :value="86400" />
                            <el-option label="3天" :value="259200" />
                            <el-option label="7天" :value="604800" />
                        </el-select>
                    </el-form-item>

                    <el-form-item>
                        <el-button
                            type="primary"
                            @click="handleDirectLogin(specificForm.email)"
                            :loading="specificLoading"
                            :disabled="!specificForm.email || !directLoginEnabled"
                            size="large"
                        >{{ specificLoading ? '登录中...' : '🚀 直登 Claude' }}</el-button>
                    </el-form-item>
                </el-form>
            </div>
        </el-card>

        <!-- 登录历史 -->
        <el-card v-if="loginHistory.length > 0" class="history-card">
            <template #header>
                <div class="card-header">
                    <el-icon>
                        <Clock />
                    </el-icon>
                    <span>最近登录</span>
                    <el-button text type="primary" @click="clearHistory" size="small">清空历史</el-button>
                </div>
            </template>

            <div class="history-content">
                <div v-for="(item, index) in loginHistory" :key="index" class="history-item">
                    <div class="history-info">
                        <div class="history-email">{{ item.email }}</div>
                        <div class="history-time">{{ item.time }}</div>
                        <div class="history-session">会话: {{ item.uniqueName }}</div>
                    </div>

                    <div class="history-actions">
                        <el-button
                            text
                            type="primary"
                            @click="copyLoginUrl(item.loginUrl)"
                            size="small"
                        >复制链接</el-button>
                        <el-button
                            text
                            type="primary"
                            @click="openLoginUrl(item.loginUrl)"
                            size="small"
                        >重新打开</el-button>
                    </div>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { User } from "@element-plus/icons-vue";
import { ClaudeLoginManager } from "@/utils/claude-login-core.js";

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

// 响应式数据
const randomLoading = ref(false);
const specificLoading = ref(false);
const loginHistory = ref([]);

const randomForm = reactive({
    expiresIn: null,
});

const specificForm = reactive({
    email: "",
    uniqueName: "",
    expiresIn: null,
});

// 直登功能相关
const directLoginEnabled = ref(false);
const loginManager = ref(null);

// 生成随机ID
const generateRandomId = () => {
    // 使用 ClaudeLoginManager 的 generateUniqueId 方法
    const tempManager = new ClaudeLoginManager();
    specificForm.uniqueName = tempManager.generateUniqueId();
};

// 初始化直登管理器
const initDirectLogin = async () => {
    try {
        console.log("开始初始化直登功能...");
        console.log("管理员密码:", props.adminPassword ? "已提供" : "未提供");

        // 从后端获取账户列表和对应的完整 Session Key
        const poolApiUrl =
            import.meta.env.VITE_CLAUDE_POOL_API_URL || "http://localhost:8787";
        console.log("API地址:", poolApiUrl);

        const response = await fetch(
            `${poolApiUrl}/api/admin/accounts-with-sk`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    admin_password: props.adminPassword,
                }),
            }
        );

        console.log("API响应状态:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("API错误响应:", errorText);
            throw new Error(
                `HTTP ${response.status}: ${response.statusText} - ${errorText}`
            );
        }

        const accounts = await response.json();
        console.log("获取到的账户数量:", accounts.length);

        // 构建 Session Key 映射
        const sessionKeys = {};
        accounts.forEach((account) => {
            if (account.email && account.session_key) {
                sessionKeys[account.email] = account.session_key;
            }
        });

        console.log("有效的Session Key数量:", Object.keys(sessionKeys).length);

        // 初始化登录管理器
        loginManager.value = new ClaudeLoginManager({
            baseUrl: poolApiUrl, // 使用后端API地址
            sessionKeys: sessionKeys,
            defaultExpiresIn: 0,
            maxExpiresIn: 0,
            adminPassword: props.adminPassword, // 传入管理员密码
        });

        directLoginEnabled.value = Object.keys(sessionKeys).length > 0;

        if (directLoginEnabled.value) {
            ElMessage.success(
                `直登功能已启用，支持 ${Object.keys(sessionKeys).length} 个账户`
            );
        } else {
            ElMessage.warning("没有可用的账户，直登功能已禁用");
        }
    } catch (error) {
        console.error("初始化直登功能失败:", error);
        ElMessage.error(`初始化直登功能失败: ${error.message}`);
        directLoginEnabled.value = false;
    }
};

// 直接登录到 Claude 官网
const handleDirectLogin = async (email = null) => {
    if (!loginManager.value) {
        ElMessage.error("直登功能未初始化");
        return;
    }

    try {
        let result;

        if (email) {
            // 指定账户直登
            specificLoading.value = true;
            result = await loginManager.value.loginWithEmail(email, {
                uniqueName: specificForm.uniqueName || undefined,
                expiresIn: specificForm.expiresIn || undefined,
            });
        } else {
            // 随机账户直登
            randomLoading.value = true;
            result = await loginManager.value.quickLogin({
                expiresIn: randomForm.expiresIn || undefined,
            });
        }

        if (result.success) {
            ElMessage.success(`直登成功！使用账户: ${result.selectedEmail}`);

            // 记录登录历史
            const loginRecord = {
                id: Date.now(),
                email: result.selectedEmail,
                uniqueName: result.uniqueName,
                loginUrl: result.loginUrl,
                timestamp: new Date().toLocaleString(),
                method: email ? "指定账户直登" : "随机账户直登",
                warning: result.warning,
            };
            loginHistory.value.unshift(loginRecord);

            // 只保留最近10条记录
            if (loginHistory.value.length > 10) {
                loginHistory.value = loginHistory.value.slice(0, 10);
            }

            // 保存到本地存储
            localStorage.setItem(
                "claude_login_history",
                JSON.stringify(loginHistory.value)
            );

            // 在当前窗口直接跳转到 Claude（与fuclaude-pool-manager-ui-main一致）
            window.location.href = result.loginUrl;

            if (result.warning) {
                ElMessage.warning(result.warning);
            }
        } else {
            ElMessage.error(`直登失败: ${result.error}`);
        }
    } catch (error) {
        console.error("直登出错:", error);
        ElMessage.error(`直登出错: ${error.message}`);
    } finally {
        randomLoading.value = false;
        specificLoading.value = false;
    }
};

// 复制登录链接
const copyLoginUrl = async (url) => {
    try {
        await navigator.clipboard.writeText(url);
        ElMessage.success("登录链接已复制到剪贴板");
    } catch (error) {
        ElMessage.error("复制失败");
    }
};

// 重新打开登录链接
const openLoginUrl = (url) => {
    const newWindow = window.open(
        url,
        "_blank",
        "width=1200,height=800,scrollbars=yes,resizable=yes"
    );

    if (!newWindow) {
        ElMessage.error("无法打开新窗口，请检查浏览器弹窗设置");
    }
};

// 清空历史记录
const clearHistory = () => {
    loginHistory.value = [];
    localStorage.removeItem("claude_login_history");
    ElMessage.success("历史记录已清空");
};

// 组件挂载时加载历史记录和初始化直登功能
onMounted(async () => {
    const saved = localStorage.getItem("claude_login_history");
    if (saved) {
        try {
            loginHistory.value = JSON.parse(saved);
        } catch (error) {
            console.error("加载历史记录失败:", error);
        }
    }

    // 自动生成会话标识
    if (!specificForm.uniqueName) {
        generateRandomId();
    }

    // 初始化直登功能
    if (props.adminPassword) {
        await initDirectLogin();
    }
});
</script>

<style scoped>
.quick-login {
    padding: 0;
}

.login-header {
    margin-bottom: 20px;
}

.login-header h3 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
}

.login-description {
    margin: 0;
    color: #606266;
    font-size: 14px;
}

.login-card,
.history-card {
    margin-bottom: 20px;
    border-radius: 8px;
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
}

.card-header > div {
    display: flex;
    align-items: center;
    gap: 8px;
}

.random-login-content,
.specific-login-content {
    padding: 0;
}

.random-login-content p {
    margin: 0 0 20px 0;
    color: #606266;
}

.account-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.account-email {
    flex: 1;
}

.form-hint {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
    line-height: 1.4;
}

.history-content {
    padding: 0;
}

.history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
}

.history-item:last-child {
    border-bottom: none;
}

.history-info {
    flex: 1;
}

.history-email {
    font-weight: 500;
    color: #303133;
    margin-bottom: 4px;
}

.history-time,
.history-session {
    font-size: 12px;
    color: #909399;
    margin-bottom: 2px;
}

.history-actions {
    display: flex;
    gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .history-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .history-actions {
        width: 100%;
        justify-content: flex-end;
    }
}
</style>
