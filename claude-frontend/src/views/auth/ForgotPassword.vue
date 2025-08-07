<template>
    <div class="forgot-password-container">
        <div class="forgot-password-card">
            <div class="header">
                <h2>重置密码</h2>
                <p class="subtitle">请输入您的邮箱和新密码</p>
            </div>

            <!-- 单页面表单 -->
            <div class="form-content">
                <el-form
                    :model="resetForm"
                    :rules="resetRules"
                    ref="resetFormRef"
                    @submit.prevent="handleResetPassword"
                >
                    <!-- 邮箱 -->
                    <div class="form-group">
                        <label class="form-label">邮箱</label>
                        <el-input
                            v-model="resetForm.email"
                            type="email"
                            placeholder="请输入邮箱"
                            size="large"
                            :disabled="loading"
                        />
                    </div>

                    <!-- 验证码 -->
                    <div class="form-group">
                        <label class="form-label">验证码</label>
                        <div class="verification-input">
                            <el-input
                                v-model="resetForm.verificationCode"
                                placeholder="请输入验证码"
                                size="large"
                                maxlength="6"
                                :disabled="loading"
                            />
                            <el-button
                                type="text"
                                class="get-code-btn"
                                :disabled="countdown > 0 || loading || !resetForm.email"
                                @click="sendVerificationCode"
                            >{{ countdown > 0 ? `${countdown}秒后重发` : '获取' }}</el-button>
                        </div>
                    </div>

                    <!-- 新密码 -->
                    <div class="form-group">
                        <label class="form-label">新密码</label>
                        <el-input
                            v-model="resetForm.newPassword"
                            type="password"
                            placeholder="请输入新密码"
                            size="large"
                            :disabled="loading"
                            show-password
                        />
                    </div>

                    <!-- 确认新密码 -->
                    <div class="form-group">
                        <label class="form-label">确认新密码</label>
                        <el-input
                            v-model="resetForm.confirmPassword"
                            type="password"
                            placeholder="请再次输入新密码"
                            size="large"
                            :disabled="loading"
                            show-password
                        />
                    </div>

                    <!-- 重置按钮 -->
                    <el-button
                        type="primary"
                        size="large"
                        :loading="loading"
                        @click="handleResetPassword"
                        class="submit-btn"
                    >{{ loading ? '重置中...' : '重置密码' }}</el-button>
                </el-form>
            </div>

            <!-- 返回登录 -->
            <div class="back-to-login">
                <span>已有账户？</span>
                <router-link to="/login" class="back-link">立即登录</router-link>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { authApi } from "@/api/auth";

const router = useRouter();

// 响应式数据
const loading = ref(false);
const countdown = ref(0);
let countdownTimer = null;

// 表单数据
const resetForm = reactive({
    email: "",
    verificationCode: "",
    newPassword: "",
    confirmPassword: "",
});

// 表单引用
const resetFormRef = ref();

// 表单验证规则
const resetRules = {
    email: [
        { required: true, message: "请输入邮箱地址", trigger: "blur" },
        { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
    ],
    verificationCode: [
        { required: true, message: "请输入验证码", trigger: "blur" },
        { len: 6, message: "验证码为6位数字", trigger: "blur" },
    ],
    newPassword: [
        { required: true, message: "请输入新密码", trigger: "blur" },
        { min: 6, message: "密码长度不能少于6位", trigger: "blur" },
    ],
    confirmPassword: [
        { required: true, message: "请确认新密码", trigger: "blur" },
        {
            validator: (rule, value, callback) => {
                if (value !== resetForm.newPassword) {
                    callback(new Error("两次输入的密码不一致"));
                } else {
                    callback();
                }
            },
            trigger: "blur",
        },
    ],
};

// 发送验证码
const sendVerificationCode = async () => {
    if (!resetForm.email) {
        ElMessage.warning("请先输入邮箱地址");
        return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetForm.email)) {
        ElMessage.error("请输入正确的邮箱格式");
        return;
    }

    try {
        loading.value = true;

        const response = await authApi.forgotPassword(resetForm.email);

        if (response.status === 0) {
            ElMessage.success("验证码已发送到您的邮箱");
            startCountdown();
        } else {
            ElMessage.error(response.message || "发送验证码失败");
        }
    } catch (error) {
        ElMessage.error(error.message || "发送验证码失败");
    } finally {
        loading.value = false;
    }
};

// 重置密码
const handleResetPassword = async () => {
    if (!resetFormRef.value) return;

    try {
        await resetFormRef.value.validate();
        loading.value = true;

        const response = await authApi.resetPassword({
            email: resetForm.email,
            verificationCode: resetForm.verificationCode,
            newPassword: resetForm.newPassword,
        });

        if (response.status === 0) {
            ElMessage.success("密码重置成功！");
            // 延迟跳转到登录页
            setTimeout(() => {
                router.push("/login");
            }, 1500);
        } else {
            ElMessage.error(response.message || "密码重置失败");
        }
    } catch (error) {
        ElMessage.error(error.message || "密码重置失败");
    } finally {
        loading.value = false;
    }
};

// 开始倒计时
const startCountdown = () => {
    countdown.value = 60;
    countdownTimer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
            clearInterval(countdownTimer);
        }
    }, 1000);
};

// 清理定时器
onUnmounted(() => {
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }
});
</script>

<style scoped>
.forgot-password-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(250, 249, 245);
    padding: 20px;
}

.forgot-password-card {
    background: white;
    border-radius: 12px;
    padding: 40px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 4px 20px rgba(139, 125, 107, 0.15);
    border: 1px solid rgb(235, 230, 220);
}

.header {
    text-align: center;
    margin-bottom: 30px;
}

.header h2 {
    color: #333;
    margin-bottom: 8px;
    font-weight: 600;
}

.subtitle {
    color: #666;
    font-size: 14px;
    line-height: 1.5;
}

.form-content {
    margin-bottom: 20px;
}

.form-group {
    margin-bottom: 20px;
}

.form-label {
    display: block;
    margin-bottom: 8px;
    color: #333;
    font-weight: 500;
    font-size: 14px;
}

.verification-input {
    display: flex;
    gap: 8px;
    align-items: center;
}

.verification-input .el-input {
    flex: 1;
}

.get-code-btn {
    color: #d2691e;
    font-weight: 500;
    padding: 0 12px;
    white-space: nowrap;
}

.get-code-btn:hover:not(.is-disabled) {
    color: #b8621a;
}

.get-code-btn.is-disabled {
    color: #ccc;
}

.submit-btn {
    width: 100%;
    height: 44px;
    font-size: 16px;
    font-weight: 500;
    margin-top: 10px;
}

.back-to-login {
    text-align: center;
    margin-top: 24px;
    font-size: 14px;
    color: #666;
}

.back-link {
    color: #d2691e;
    text-decoration: none;
    font-weight: 500;
    margin-left: 4px;
}

.back-link:hover {
    color: #b8621a;
    text-decoration: underline;
}

/* 自定义按钮样式 - 与登录页面保持一致 */
:deep(.el-button--primary) {
    background: #d2691e;
    border-color: #d2691e;
    color: #ffffff;
}

:deep(.el-button--primary:hover) {
    background: #b8621a;
    border-color: #b8621a;
}

:deep(.el-button--primary:active) {
    background: #a0551a;
    border-color: #a0551a;
}

:deep(.el-button--primary.is-disabled) {
    background: #d2691e;
    border-color: #d2691e;
    opacity: 0.6;
}

:deep(.el-button--text) {
    color: #d2691e;
}

:deep(.el-button--text:hover) {
    color: #b8621a;
}

:deep(.el-button--text.is-disabled) {
    color: #ccc;
}

:deep(.el-form-item) {
    margin-bottom: 0;
}

:deep(.el-input__inner) {
    height: 44px;
    font-size: 14px;
}
</style>