<template>
    <div class="claude-register">
        <div class="register-container">
            <!-- 左侧注册表单 -->
            <div class="register-section">
                <div class="register-content">
                    <!-- Logo -->
                    <div class="logo-section">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 184 40"
                            class="logo"
                            fill="currentColor"
                        >
                            <path
                                shape-rendering="optimizeQuality"
                                fill="#D97757"
                                d="m7.75 26.27 7.77-4.36.13-.38-.13-.21h-.38l-1.3-.08-4.44-.12-3.85-.16-3.73-.2-.94-.2L0 19.4l.09-.58.79-.53 1.13.1 2.5.17 3.75.26 2.72.16 4.03.42h.64l.09-.26-.22-.16-.17-.16-3.88-2.63-4.2-2.78-2.2-1.6L3.88 11l-.6-.76-.26-1.66L4.1 7.39l1.45.1.37.1 1.47 1.13 3.14 2.43 4.1 3.02.6.5.24-.17.03-.12-.27-.45L13 9.9l-2.38-4.1-1.06-1.7-.28-1.02c-.1-.42-.17-.77-.17-1.2L10.34.21l.68-.22 1.64.22.69.6 1.02 2.33 1.65 3.67 2.56 4.99.75 1.48.4 1.37.15.42h.26v-.24l.21-2.81.39-3.45.38-4.44.13-1.25.62-1.5L23.1.57l.96.46.79 1.13-.11.73-.47 3.05-.92 4.78-.6 3.2h.35l.4-.4 1.62-2.15 2.72-3.4 1.2-1.35 1.4-1.49.9-.71h1.7l1.25 1.86-.56 1.92-1.75 2.22-1.45 1.88-2.08 2.8-1.3 2.24.12.18.31-.03 4.7-1 2.54-.46 3.03-.52 1.37.64.15.65-.54 1.33-3.24.8-3.8.76-5.66 1.34-.07.05.08.1 2.55.24 1.09.06h2.67l4.97.37 1.3.86.78 1.05-.13.8-2 1.02-2.7-.64-6.3-1.5-2.16-.54h-.3v.18l1.8 1.76 3.3 2.98 4.13 3.84.21.95-.53.75-.56-.08-3.63-2.73-1.4-1.23-3.17-2.67h-.21v.28l.73 1.07 3.86 5.8.2 1.78-.28.58-1 .35-1.1-.2L26 33.14l-2.33-3.57-1.88-3.2-.23.13-1.11 11.95-.52.61-1.2.46-1-.76-.53-1.23.53-2.43.64-3.17.52-2.52.47-3.13.28-1.04-.02-.07-.23.03-2.36 3.24-3.59 4.85-2.84 3.04-.68.27-1.18-.61.11-1.09.66-.97 3.93-5 2.37-3.1 1.53-1.79-.01-.26h-.09L6.8 30.56l-1.86.24-.8-.75.1-1.23.38-.4 3.14-2.16Z"
                            />
                            <path
                                shape-rendering="optimizeQuality"
                                d="M64.48 33.54c-5.02 0-8.45-2.8-10.07-7.11a19.19 19.19 0 0 1-1.23-7.03c0-7.23 3.24-12.25 10.4-12.25 4.81 0 7.78 2.1 9.47 7.11h2.06l-.28-6.91c-2.88-1.86-6.48-2.8-10.86-2.8-6.17 0-11.42 2.76-14.34 7.74a16.77 16.77 0 0 0-2.22 8.65c0 5.53 2.61 10.43 7.51 13.15a17.51 17.51 0 0 0 8.73 2.06c4.78 0 8.57-.91 11.93-2.5l.87-7.62h-2.1c-1.26 3.48-2.76 5.57-5.25 6.68-1.22.55-2.76.83-4.62.83ZM86.13 7.15l.2-3.4h-1.42l-6.32 1.9v1.03l2.8 1.3v23.78c0 1.62-.83 1.98-3 2.25v1.74h10.75v-1.74c-2.18-.27-3-.63-3-2.25V7.16Zm42.75 29h.83l7.27-1.38v-1.78l-1.02-.08c-1.7-.16-2.14-.51-2.14-1.9V18.33l.2-4.07h-1.15l-6.87.99v1.74l.67.12c1.86.27 2.41.79 2.41 2.09v11.3c-1.78 1.38-3.48 2.25-5.5 2.25-2.24 0-3.63-1.14-3.63-3.8V18.34l.2-4.07h-1.18l-6.88.99v1.74l.71.12c1.86.27 2.41.79 2.41 2.09v10.43c0 4.42 2.5 6.52 6.48 6.52 3.04 0 5.53-1.62 7.4-3.87l-.2 3.87ZM108.9 22.08c0-5.65-3-7.82-8.42-7.82-4.78 0-8.25 1.98-8.25 5.26 0 .98.35 1.73 1.06 2.25l3.64-.48c-.16-1.1-.24-1.77-.24-2.05 0-1.86.99-2.8 3-2.8 2.97 0 4.47 2.09 4.47 5.45v1.1l-7.5 2.25c-2.5.68-3.92 1.27-4.87 2.65a5 5 0 0 0-.7 2.8c0 3.2 2.2 5.46 5.96 5.46 2.72 0 5.13-1.23 7.23-3.56.75 2.33 1.9 3.56 3.95 3.56 1.66 0 3.16-.67 4.5-1.98l-.4-1.38c-.58.16-1.14.24-1.73.24-1.15 0-1.7-.91-1.7-2.69v-8.26Zm-9.6 10.87c-2.05 0-3.32-1.19-3.32-3.28 0-1.42.67-2.25 2.1-2.73l6.08-1.93v5.84c-1.94 1.47-3.08 2.1-4.86 2.1Zm63.3 1.82v-1.78l-1.03-.08c-1.7-.16-2.13-.51-2.13-1.9V7.15l.2-3.4h-1.43l-6.32 1.9v1.03l2.8 1.3v7.82a8.83 8.83 0 0 0-5.37-1.54c-6.28 0-11.18 4.78-11.18 11.93 0 5.89 3.52 9.96 9.32 9.96 3 0 5.61-1.46 7.23-3.72l-.2 3.72h.84l7.27-1.38Zm-13.16-18.14c3 0 5.25 1.74 5.25 4.94v9a7.2 7.2 0 0 1-5.21 2.1c-4.3 0-6.48-3.4-6.48-7.94 0-5.1 2.49-8.1 6.44-8.1Zm28.53 4.5c-.56-2.64-2.18-4.14-4.43-4.14-3.36 0-5.69 2.53-5.69 6.16 0 5.37 2.84 8.85 7.43 8.85a8.6 8.6 0 0 0 7.39-4.35l1.34.36c-.6 4.66-4.82 8.14-10 8.14-6.08 0-10.27-4.5-10.27-10.9 0-6.45 4.55-10.99 10.63-10.99 4.54 0 7.74 2.73 8.77 7.47l-15.84 4.86v-2.14l10.67-3.31Z"
                            />
                        </svg>
                    </div>

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

<script setup>
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

/* Logo */
.logo-section {
    margin-bottom: 32px; /* 减少底部边距 */
    margin-top: 20px; /* 添加顶部边距 */
}

.logo {
    height: 28px;
    color: rgb(var(--text-100)); /* 深棕色 */
}

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

    .logo-section {
        margin-top: 10px;
        margin-bottom: 20px;
    }

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
