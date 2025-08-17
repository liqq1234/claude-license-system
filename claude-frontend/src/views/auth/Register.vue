<template>
    <div class="claude-register">
        <div class="register-container">
            <!-- 左侧注册表单 -->
            <div class="register-section">
                <div class="register-content">
                    <!-- Logo section removed -->

                    <!-- 标题 -->
                    <div class="title-section">
                        <h2 class="main-title">
                            开始您的
                            <br />创作之旅
                        </h2>
                    </div>

                    <!-- 注册表单 -->
                    <div class="form-container">
                        <div class="form-content">
                            <!-- 邮箱注册表单 -->
                            <form class="email-form" @submit.prevent="handleRegister">
                                <div class="form-group">
                                    <label for="username" class="form-label">用户名</label>
                                    <input
                                        id="username"
                                        v-model="registerForm.username"
                                        type="text"
                                        class="form-input"
                                        placeholder="输入您的用户名"
                                        required
                                    />
                                </div>

                                <div class="form-group">
                                    <label for="email" class="form-label">邮箱</label>
                                    <input
                                        id="email"
                                        v-model="registerForm.email"
                                        type="email"
                                        class="form-input"
                                        :class="{ 'error': emailError }"
                                        placeholder="输入您的邮箱地址"
                                        required
                                        @blur="validateEmail"
                                    />
                                </div>

                                <div class="form-group">
                                    <label for="password" class="form-label">密码</label>
                                    <input
                                        id="password"
                                        v-model="registerForm.password"
                                        type="password"
                                        class="form-input"
                                        placeholder="创建安全密码"
                                        required
                                    />
                                </div>

                                <div class="form-group">
                                    <label for="confirmPassword" class="form-label">确认密码</label>
                                    <input
                                        id="confirmPassword"
                                        v-model="registerForm.confirmPassword"
                                        type="password"
                                        class="form-input"
                                        placeholder="再次输入密码"
                                        required
                                    />
                                </div>

                                <div class="form-group">
                                    <label for="verificationCode" class="form-label">邮箱验证码</label>
                                    <div class="verification-input-group">
                                        <input
                                            id="verificationCode"
                                            v-model="registerForm.verificationCode"
                                            type="text"
                                            class="form-input verification-input"
                                            placeholder="输入6位验证码"
                                            maxlength="6"
                                            required
                                        />
                                        <button
                                            type="button"
                                            class="send-code-btn"
                                            :disabled="!canSendCode || sendingCode"
                                            @click="sendVerificationCode"
                                        >{{ sendCodeButtonText }}</button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    class="continue-btn"
                                    :disabled="loading"
                                >{{ loading ? '注册中...' : '创建账户' }}</button>
                            </form>
                        </div>

                        <!-- 法律条款 -->
                        <div class="legal-text">
                            创建账户即表示您同意我们的
                            <a href="#" class="legal-link">服务条款</a>
                            和
                            <a href="#" class="legal-link">使用政策</a>
                            ，并确认我们的
                            <a href="#" class="legal-link">隐私政策</a>
                            。
                        </div>

                        <!-- 登录链接 -->
                        <div class="login-section-inside">
                            <router-link to="/login" class="login-link-inside">已有账户？立即登录</router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useAuthStore } from "@/stores/auth";
import { authApi } from "@/api/auth";

const router = useRouter();
const authStore = useAuthStore();

// 加载状态
const loading = ref(false);

// 表单数据
const registerForm = reactive({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    verificationCode: "",
});

// 验证码相关状态
const sendingCode = ref(false);
const countdown = ref(0);
const countdownTimer = ref(null);

// 邮箱验证状态
const emailError = ref("");

// 计算属性
const canSendCode = computed(() => {
    return (
        registerForm.email &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email) &&
        !emailError.value &&
        countdown.value === 0
    );
});

// 邮箱验证函数
const validateEmail = () => {
    emailError.value = "";

    if (!registerForm.email) {
        return;
    }

    // 基本格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email)) {
        emailError.value = "邮箱格式不正确";
        ElMessage.warning("邮箱格式不正确");
        return;
    }

    // 邮箱后缀验证
    const allowedDomains = [
        "@qq.com",
        "@gmail.com",
        "@163.com",
        "@126.com",
        "@outlook.com",
        "@foxmail.com",
    ];
    const emailDomain = "@" + registerForm.email.split("@")[1].toLowerCase();
    if (!allowedDomains.includes(emailDomain)) {
        emailError.value = "不支持的邮箱后缀";
        ElMessage.warning(
            `本站仅允许以下邮箱后缀：${allowedDomains.join(", ")}`
        );
        return;
    }
};

const sendCodeButtonText = computed(() => {
    if (sendingCode.value) return "发送中...";
    if (countdown.value > 0) return `${countdown.value}s后重试`;
    return "发送验证码";
});

// 发送验证码
const sendVerificationCode = async () => {
    // 先验证邮箱
    validateEmail();
    if (emailError.value) {
        return;
    }

    if (!canSendCode.value) return;

    sendingCode.value = true;
    try {
        const response = await authApi.sendVerificationCode({
            email: registerForm.email,
            type: "register",
        });

        if (response.status === 0) {
            ElMessage.success("验证码已发送到您的邮箱");
            startCountdown();
        } else {
            ElMessage.error(response.message || "验证码发送失败");
        }
    } catch (error) {
        ElMessage.error("验证码发送失败，请稍后重试");
        console.error("发送验证码失败:", error);
    } finally {
        sendingCode.value = false;
    }
};

// 开始倒计时
const startCountdown = () => {
    countdown.value = 60;
    countdownTimer.value = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
            clearInterval(countdownTimer.value);
            countdownTimer.value = null;
        }
    }, 1000);
};

// 注册处理
const handleRegister = async () => {
    // 验证邮箱
    validateEmail();
    if (emailError.value) {
        return;
    }

    // 简单验证
    if (
        !registerForm.username ||
        !registerForm.email ||
        !registerForm.password ||
        !registerForm.confirmPassword ||
        !registerForm.verificationCode
    ) {
        ElMessage.warning("请填写完整的注册信息");
        return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
        ElMessage.warning("两次输入的密码不一致");
        return;
    }

    if (registerForm.password.length < 6) {
        ElMessage.warning("密码长度至少6位");
        return;
    }

    if (registerForm.verificationCode.length !== 6) {
        ElMessage.warning("请输入6位验证码");
        return;
    }

    loading.value = true;
    try {
        const result = await authStore.register({
            username: registerForm.username,
            email: registerForm.email,
            password: registerForm.password,
            verificationCode: registerForm.verificationCode,
        });

        if (result.success) {
            ElMessage.success("注册成功！请登录");
            router.push("/login");
        }
    } catch (error) {
        console.log("注册失败:", error);
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
/* 温暖色调系统 */
:root {
    /* 背景色 RGB 值 */
    --bg-000: 255, 254, 250; /* 温暖白色 */
    --bg-100: 250, 249, 245; /* 主背景 */
    --bg-200: 245, 242, 235; /* 次要背景 */
    --bg-300: 235, 230, 220; /* 第三级背景 */
    --bg-400: 240, 237, 230; /* 悬停背景 */

    /* 文字色 RGB 值 */
    --text-000: 45, 42, 38; /* 深棕色 */
    --text-100: 93, 78, 55; /* 主文字 */
    --text-200: 107, 95, 75; /* 次要文字 */
    --text-300: 139, 125, 107; /* 第三级文字 */
    --text-400: 156, 143, 125; /* 第四级文字 */
    --text-500: 180, 170, 155; /* 占位符文字 */

    /* 边框色 RGB 值 */
    --border-100: 93, 78, 55; /* 深边框 */
    --border-200: 139, 125, 107; /* 中等边框 */
    --border-300: 220, 210, 195; /* 浅边框 */

    /* 特殊色 */
    --warm-orange: 210, 105, 30; /* 温暖橙色 */

    /* 按钮色 */
    --accent-100: 210, 105, 30; /* 主按钮色 */
    --accent-200: 184, 92, 26; /* 按钮悬停色 */
}

/* 温暖色调的注册页面 */
.claude-register {
    min-height: 100vh;
    width: 100%;
    background: linear-gradient(
        135deg,
        #f8f6f0 0%,
        #f0ede5 100%
    ); /* 温暖渐变背景 */
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        sans-serif;
    color: rgb(var(--text-100)); /* 深棕色 */
    position: relative;
    overflow-y: auto; /* 确保可以滚动 */
}

.register-container {
    display: flex;
    justify-content: center;
    align-items: flex-start; /* 改为顶部对齐 */
    min-height: 100vh;
    padding: 40px 24px 24px 24px; /* 增加顶部内边距 */
    width: 100%;
    box-sizing: border-box;
}

/* 注册区域 */
.register-section {
    width: 100%;
    max-width: 500px; /* 调整为合适的宽度 */
    margin: 0 auto; /* 确保居中 */
}

.register-content {
    width: 100%;
}

/* Logo styles removed */

/* 标题区域 */
.title-section {
    text-align: center;
    margin-bottom: 24px; /* 减少底部边距 */
}

.main-title {
    font-size: 2.8rem; /* 减小字体大小 */
    font-weight: 400;
    line-height: 1.1em; /* 调整行高 */
    color: rgb(var(--text-100)); /* 深棕色 */
    margin: 0 0 16px 0;
    font-family: "Times New Roman", serif;
    letter-spacing: -0.03em;
}

.subtitle {
    font-size: 18px;
    color: rgb(var(--text-100)); /* 深棕色 */
    margin: 0;
    font-weight: 400;
    line-height: 1.4;
    letter-spacing: -0.01em;
}

/* 表单容器 */
.form-container {
    margin: 24px auto; /* 减少边距 */
    padding: 32px; /* 减少内边距 */
    width: 100%; /* 占满父容器 */
    background: #ffffff; /* 纯白背景 */
    border-radius: 24px;
    border: 1px solid rgba(210, 105, 30, 0.1); /* 温暖橙色边框 */
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04),
        0 2px 8px rgba(210, 105, 30, 0.1); /* 添加温暖色调阴影 */
}

.form-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* 表单 */
.email-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-label {
    color: rgb(var(--text-300)); /* #6b7280 */
    margin-bottom: 4px;
    font-size: 14px;
    font-weight: 500;
}

.form-input {
    height: 48px;
    padding: 0 16px;
    background: #f8f9fa;
    border: 1.5px solid #e9ecef;
    border-radius: 12px;
    font-size: 16px;
    color: #2d3748;
    transition: all 0.2s ease;
}

.form-input:hover {
    border-color: #d2691e;
}

.form-input:focus {
    outline: none;
    border-color: #d2691e;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(210, 105, 30, 0.1);
}

.form-input::placeholder {
    color: rgb(var(--text-400)); /* #9ca3af */
}

.form-input.error {
    border-color: #ef4444;
    background: #fef2f2;
}

.form-input.error:focus {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* 继续按钮 */
.continue-btn {
    height: 48px;
    background: linear-gradient(135deg, #d2691e 0%, #b8621a 100%);
    color: #ffffff;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 20px;
    box-shadow: 0 4px 12px rgba(210, 105, 30, 0.3);
    width: 100%;
}

.continue-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #b8621a 0%, #a0551a 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(210, 105, 30, 0.4);
}

.continue-btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(210, 105, 30, 0.3);
}

.continue-btn:disabled {
    background: #9ca3af !important;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

/* 法律条款 */
.legal-text {
    font-size: 12px;
    color: rgb(var(--text-400)); /* #9ca3af */
    line-height: 1.5;
    letter-spacing: -0.01em;
    text-align: center;
    margin-top: 16px;
}

.legal-link {
    color: rgb(var(--text-100)); /* #1a1a1a */
    text-decoration: underline;
    transition: color 0.2s;
}

.legal-link:hover {
    color: rgb(var(--text-200)); /* #374151 */
}

/* 表单内登录链接 */
.login-section-inside {
    text-align: center;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid rgb(var(--border-300));
}

.login-link-inside {
    color: rgb(var(--warm-orange)); /* 温暖橙色 */
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
}

.login-link-inside:hover {
    color: rgb(var(--text-100)); /* 深棕色 */
    text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .register-section {
        max-width: 500px; /* 中等屏幕稍微缩小 */
    }

    .main-title {
        font-size: 2.5rem;
    }

    .form-container {
        padding: 32px;
    }
}

@media (max-width: 500px) {
    .register-section {
        max-width: 100%; /* 小屏幕占满 */
        padding: 16px;
    }

    .form-container {
        margin: 16px 0;
        padding: 24px;
    }

    .main-title {
        font-size: 1.75rem;
    }

    .subtitle {
        font-size: 16px;
    }
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
    .register-section {
        max-width: 700px; /* 大屏幕更宽 */
    }

    .form-container {
        padding: 48px; /* 大屏幕更大内边距 */
    }

    .main-title {
        font-size: 4rem; /* 大屏幕更大标题 */
    }

    .subtitle {
        font-size: 20px;
    }
}

/* 验证码输入组 */
.verification-input-group {
    display: flex;
    gap: 12px;
    align-items: center;
}

.verification-input {
    flex: 1;
}

.send-code-btn {
    padding: 12px 16px;
    background: linear-gradient(135deg, #d2691e 0%, #b8621a 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    min-width: 110px;
    box-shadow: 0 2px 8px rgba(210, 105, 30, 0.2);
}

.send-code-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #b8621a 0%, #a0551a 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(210, 105, 30, 0.3);
}

.send-code-btn:disabled {
    background: #9ca3af !important;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .claude-register {
        padding: 0;
    }

    .register-container {
        padding: 16px;
        align-items: flex-start;
        padding-top: 20px; /* 减少顶部内边距 */
    }

    .register-section {
        max-width: 100%;
    }

    /* Logo responsive styles removed */

    .main-title {
        font-size: 2.2rem; /* 进一步减小 */
    }

    .subtitle {
        font-size: 16px;
    }

    .form-container {
        padding: 20px;
        margin: 16px 0;
    }
}

@media (max-width: 480px) {
    .register-container {
        padding: 12px;
        padding-top: 20px;
    }

    .main-title {
        font-size: 2rem;
    }

    .form-container {
        padding: 20px;
        border-radius: 16px;
    }

    .form-input {
        padding: 14px 16px;
        font-size: 16px; /* 防止iOS缩放 */
    }

    .register-btn {
        padding: 16px;
        font-size: 16px;
    }
}

.send-code-btn:active:not(:disabled) {
    transform: translateY(0);
}
</style>
