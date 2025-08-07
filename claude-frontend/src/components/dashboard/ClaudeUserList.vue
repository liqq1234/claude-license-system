<template>
    <div class="claude-user-list">
        <!-- 页面标题 -->
        <div class="page-header">
            <h2 class="page-title">
                <el-icon class="title-icon">
                    <User />
                </el-icon>Claude 用户账号
            </h2>
            <p class="page-description">选择一个Claude账号直接跳转到聊天界面</p>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
            <el-skeleton :rows="3" animated />
            <el-skeleton :rows="3" animated />
            <el-skeleton :rows="3" animated />
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error-container">
            <el-empty description="加载失败">
                <template #image>
                    <el-icon size="60" color="#f56c6c">
                        <Warning />
                    </el-icon>
                </template>
                <el-button type="primary" @click="fetchUserList">重新加载</el-button>
            </el-empty>
        </div>

        <!-- 用户列表 -->
        <div v-else class="user-grid">
            <div
                v-for="user in userList"
                :key="user.id || user.email"
                class="user-card"
                @click="handleUserClick(user)"
                :class="{ 'user-card-loading': user.loading }"
            >
                <!-- 用户头像 -->
                <div class="user-avatar">
                    <img
                        :src="user.avatar || defaultAvatar"
                        :alt="user.name || user.email"
                        @error="handleImageError"
                    />
                    <div v-if="user.loading" class="avatar-loading">
                        <el-icon class="is-loading">
                            <Loading />
                        </el-icon>
                    </div>
                </div>

                <!-- 用户信息 -->
                <div class="user-info">
                    <h3 class="user-name">{{ user.name || user.email.split('@')[0] }}</h3>
                    <p class="user-email">{{ user.email }}</p>
                    <div class="user-status">
                        <el-tag
                            :type="user.status === 'active' ? 'success' : 'info'"
                            size="small"
                        >{{ user.status === 'active' ? '可用' : '离线' }}</el-tag>
                    </div>
                </div>

                <!-- 跳转图标 -->
                <div class="jump-icon">
                    <el-icon>
                        <Right />
                    </el-icon>
                </div>
            </div>

            <!-- 空状态 -->
            <div v-if="userList.length === 0" class="empty-state">
                <el-empty description="暂无可用的Claude账号">
                    <template #image>
                        <el-icon size="60" color="#909399">
                            <User />
                        </el-icon>
                    </template>
                </el-empty>
            </div>
        </div>

        <!-- 刷新按钮和状态信息 -->
        <div class="refresh-section">
            <el-button type="primary" :loading="loading" @click="fetchUserList" :icon="Refresh">刷新列表</el-button>

            <!-- 权限状态提示 -->
            <div v-if="membershipInfo" class="membership-status">
                <el-tag
                    :type="membershipInfo.isValid ? 'success' : 'danger'"
                    size="small"
                >{{ membershipInfo.isValid ? '会员有效' : '会员已过期' }}</el-tag>
                <span class="expire-info">
                    {{ membershipInfo.isValid ?
                    `剩余 ${membershipInfo.remainingDays} 天` :
                    '请联系管理员续费'
                    }}
                </span>
            </div>
        </div>

        <!-- 使用说明 -->
        <div class="usage-tips">
            <el-alert title="使用说明" type="info" :closable="false" show-icon>
                <template #default>
                    <ul class="tips-list">
                        <li>点击任意Claude账号卡片即可直接跳转到聊天界面</li>
                        <li>系统会自动验证您的激活码有效性</li>
                        <li>跳转过程中请保持网络连接稳定</li>
                        <li>如遇问题请刷新页面或联系管理员</li>
                    </ul>
                </template>
            </el-alert>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
    User,
    Warning,
    Loading,
    Right,
    Refresh,
} from "@element-plus/icons-vue";
import { claudeUsersService } from "@/api/claude-users";
import { healthCheck } from "@/config/api";

// 响应式数据
const loading = ref(false);
const error = ref(false);
const userList = ref([]);
const membershipInfo = ref(null);

// 默认头像
const defaultAvatar =
    "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png";

// 获取用户列表
const fetchUserList = async () => {
    console.log("🚀 ClaudeUserList: 开始获取用户列表...");
    loading.value = true;
    error.value = false;

    try {
        console.log("📞 ClaudeUserList: 调用claudeUsersService.getUserList()");
        const response = await claudeUsersService.getUserList();
        console.log("📨 ClaudeUserList: 收到响应:", response);

        if (response.status === 0 && response.data) {
            console.log("✅ ClaudeUserList: 数据格式正确，开始处理...");
            userList.value = response.data.map((user) => ({
                id: user.id || user.email,
                email: user.email,
                name: user.name || user.email.split("@")[0],
                status: user.status || "active",
                avatar: user.avatar || null,
                loading: false,
            }));
            console.log("🎯 ClaudeUserList: 最终用户列表:", userList.value);
        } else {
            console.error("❌ ClaudeUserList: 响应格式错误:", response);
            throw new Error(response.message || "获取用户列表失败");
        }
    } catch (err) {
        console.error("获取用户列表失败:", err);
        error.value = true;

        // 如果是网络错误或API不可用，使用模拟数据作为后备
        if (
            err.message.includes("Network Error") ||
            err.message.includes("timeout")
        ) {
            ElMessage.warning("连接服务器失败，使用模拟数据");
            userList.value = [
                {
                    id: "1",
                    email: "claude.user1@example.com",
                    name: "Claude User 1",
                    status: "active",
                    avatar: null,
                    loading: false,
                },
                {
                    id: "2",
                    email: "claude.user2@example.com",
                    name: "Claude User 2",
                    status: "active",
                    avatar: null,
                    loading: false,
                },
                {
                    id: "3",
                    email: "claude.user3@example.com",
                    name: "Claude User 3",
                    status: "offline",
                    avatar: null,
                    loading: false,
                },
            ];
            error.value = false;
        } else {
            ElMessage.error(err.message || "获取用户列表失败，请稍后重试");
        }
    } finally {
        loading.value = false;
    }
};

// 处理用户点击
const handleUserClick = async (user) => {
    if (user.loading) return;

    // 设置加载状态
    user.loading = true;

    try {
        ElMessage.info(
            `正在验证权限并跳转到 ${user.email} 的Claude聊天界面...`
        );

        // 请求跳转到Claude聊天界面
        const response = await claudeUsersService.requestClaudeAccess(
            user.id,
            user.email
        );

        if (response.status === 0 && response.data) {
            const { redirectUrl } = response.data;

            if (redirectUrl) {
                // 直接跳转到Claude聊天界面
                window.open(redirectUrl, "_blank");
                ElMessage.success("跳转成功！");
            } else {
                throw new Error("未获取到跳转链接");
            }
        } else {
            throw new Error(response.message || "跳转失败");
        }
    } catch (err) {
        console.error("跳转失败:", err);

        // 处理特定的错误类型
        if (
            err.message.includes("激活码已过期") ||
            err.message.includes("会员已过期")
        ) {
            ElMessageBox.alert(
                "您的激活码已过期，请联系管理员续费或重新激活。",
                "访问被拒绝",
                {
                    confirmButtonText: "确定",
                    type: "warning",
                }
            );
            // 刷新会员信息
            await fetchMembershipInfo();
        } else if (
            err.message.includes("账号信息不完整") ||
            err.message.includes("账号不可用")
        ) {
            ElMessageBox.confirm(
                "所选账号暂时不可用，是否刷新账号列表重试？",
                "账号不可用",
                {
                    confirmButtonText: "刷新重试",
                    cancelButtonText: "取消",
                    type: "warning",
                }
            )
                .then(() => {
                    fetchUserList();
                })
                .catch(() => {
                    // 用户取消，不做任何操作
                });
        } else if (
            err.message.includes("Network Error") ||
            err.message.includes("timeout")
        ) {
            ElMessageBox.confirm(
                "网络连接失败，请检查网络连接后重试。",
                "网络错误",
                {
                    confirmButtonText: "重试",
                    cancelButtonText: "取消",
                    type: "error",
                }
            )
                .then(() => {
                    handleUserClick(user);
                })
                .catch(() => {
                    // 用户取消，不做任何操作
                });
        } else if (err.message.includes("服务器内部错误")) {
            ElMessageBox.alert(
                "服务器暂时不可用，请稍后重试或联系管理员。",
                "服务器错误",
                {
                    confirmButtonText: "确定",
                    type: "error",
                }
            );
        } else {
            ElMessage.error(err.message || "跳转失败，请稍后重试");
        }
    } finally {
        user.loading = false;
    }
};

// 处理图片加载错误
const handleImageError = (event) => {
    event.target.src = defaultAvatar;
};

// 获取会员信息
const fetchMembershipInfo = async () => {
    try {
        const response = await claudeUsersService.validateUserAccess();

        if (response.status === 0 && response.data) {
            membershipInfo.value = {
                isValid: response.data.hasAccess,
                remainingDays: response.data.remainingDays,
                expiresAt: response.data.expiresAt,
            };
        }
    } catch (err) {
        console.error("获取会员信息失败:", err);
        // 不显示错误信息，静默失败
    }
};

// 重试机制
const retryWithDelay = async (fn, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise((resolve) =>
                setTimeout(resolve, delay * (i + 1))
            );
        }
    }
};

// 组件挂载时获取用户列表和会员信息
onMounted(async () => {
    console.log("🎯 ClaudeUserList组件已挂载，开始初始化...");

    // 先进行健康检查
    console.log("🏥 开始健康检查...");
    const health = await healthCheck();
    console.log("🏥 健康检查结果:", health);

    if (!health.licenseServer) {
        ElMessage.warning("激活码服务连接失败，部分功能可能不可用");
    }
    if (!health.claudePool) {
        ElMessage.warning("Claude Pool服务连接失败，无法获取账号列表");
    }

    console.log("📋 开始获取用户列表和会员信息...");
    await fetchUserList();
    await fetchMembershipInfo();
    console.log("✅ ClaudeUserList组件初始化完成");
});
</script>

<style scoped>
.claude-user-list {
    padding: 24px;
    background: #f8f9fa;
    min-height: 100%;
}

.page-header {
    margin-bottom: 32px;
    text-align: center;
}

.page-title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 28px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0 0 8px 0;
}

.title-icon {
    color: #8b55fc;
}

.page-description {
    color: #6c757d;
    font-size: 16px;
    margin: 0;
}

.loading-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
}

.error-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
}

.user-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
}

.user-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    display: flex;
    align-items: center;
    gap: 16px;
    border: 2px solid transparent;
}

.user-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    border-color: #8b55fc;
}

.user-card-loading {
    pointer-events: none;
    opacity: 0.7;
}

.user-avatar {
    position: relative;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
}

.user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.user-info {
    flex: 1;
    min-width: 0;
}

.user-name {
    font-size: 18px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0 0 4px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.user-email {
    font-size: 14px;
    color: #6c757d;
    margin: 0 0 8px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.user-status {
    display: flex;
    align-items: center;
}

.jump-icon {
    color: #8b55fc;
    font-size: 20px;
    opacity: 0.7;
    transition: opacity 0.3s ease;
}

.user-card:hover .jump-icon {
    opacity: 1;
}

.empty-state {
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
}

.refresh-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    margin-top: 24px;
}

.membership-status {
    display: flex;
    align-items: center;
    gap: 8px;
}

.expire-info {
    font-size: 14px;
    color: #6c757d;
}

.usage-tips {
    margin-top: 24px;
}

.tips-list {
    margin: 0;
    padding-left: 20px;
}

.tips-list li {
    margin-bottom: 8px;
    color: #6c757d;
    font-size: 14px;
    line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .claude-user-list {
        padding: 16px;
    }

    .user-grid {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .user-card {
        padding: 20px;
    }

    .page-title {
        font-size: 24px;
    }
}
</style>
