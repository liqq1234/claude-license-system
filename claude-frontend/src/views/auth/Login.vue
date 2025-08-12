<template>
    <div class="claude-login">
        <div class="login-container">
            <!-- 左侧登录表单 -->
            <div class="login-section">
                <div class="login-content">
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
                            您的想法，
                            <br />得以放大
                        </h2>
                        <h3 class="subtitle">隐私优先的AI助手，助您自信创作。</h3>
                    </div>

                    <!-- 登录表单 -->
                    <div class="form-container">
                        <div class="form-content">
                            <!-- 邮箱登录表单 -->
                            <form class="email-form" @submit.prevent="handleLogin">
                                <div class="form-group">
                                    <label for="email" class="form-label">邮箱</label>
                                    <input
                                        id="email"
                                        v-model="loginForm.email"
                                        type="email"
                                        class="form-input"
                                        placeholder="输入您的个人或工作邮箱"
                                        required
                                    />
                                </div>

                                <div class="form-group">
                                    <label for="password" class="form-label">密码</label>
                                    <input
                                        id="password"
                                        v-model="loginForm.password"
                                        type="password"
                                        class="form-input"
                                        placeholder="输入您的密码"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    class="continue-btn"
                                    :disabled="loading"
                                >{{ loading ? '登录中...' : '登录' }}</button>
                            </form>

                            <!-- 注册和忘记密码链接 -->
                            <div class="auth-links">
                                <router-link to="/register" class="auth-link">还没有账户？立即注册</router-link>
                                <router-link
                                    to="/forgot-password"
                                    class="auth-link forgot-link"
                                >忘记密码？</router-link>
                            </div>
                        </div>

                        <!-- 法律条款 -->
                        <div class="legal-text">
                            继续使用即表示您同意我们的
                            <a href="#" class="legal-link">服务条款</a>
                            和
                            <a href="#" class="legal-link">使用政策</a>
                            ，并确认我们的
                            <a href="#" class="legal-link">隐私政策</a>
                            。
                        </div>
                    </div>
                </div>
            </div>

            <!-- 右侧轮播图片区域 -->
            <div class="carousel-section">
                <div class="carousel-container">
                    <div class="carousel-wrapper">
                        <!-- 轮播图片容器 -->
                        <div
                            class="carousel-slides"
                            :style="{ transform: `translateX(-${currentSlide * 100}%)` }"
                        >
                            <div
                                class="carousel-slide"
                                v-for="(image, index) in carouselImages"
                                :key="index"
                            >
                                <div class="slide-content">
                                    <div class="slide-placeholder">
                                        <div class="placeholder-icon">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="48"
                                                height="48"
                                                fill="currentColor"
                                                viewBox="0 0 256 256"
                                            >
                                                <path
                                                    d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H216v62.75l-10.07-10.06a16,16,0,0,0-22.63,0l-20,20-44-44a16,16,0,0,0-22.62,0L40,140.69Zm176,144H40V172l52-52,44,44a8,8,0,0,0,11.31,0l20-20L216,192.69Zm-72-80a24,24,0,1,0-24-24A24,24,0,0,0,144,120Z"
                                                />
                                            </svg>
                                        </div>
                                        <p class="placeholder-text">{{ image.title }}</p>
                                        <p class="placeholder-desc">{{ image.description }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 轮播指示器 -->
                        <div class="carousel-indicators">
                            <button
                                v-for="(image, index) in carouselImages"
                                :key="index"
                                class="indicator"
                                :class="{ active: currentSlide === index }"
                                @click="goToSlide(index)"
                            ></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

// 加载状态
const loading = ref(false);

// 表单数据
const loginForm = reactive({
    email: "", // 清空默认值
    password: "", // 清空默认值
});

// 轮播图片数据
const carouselImages = ref([
    {
        title: "Claude AI助手",
        description: "智能对话，创意无限",
    },
    {
        title: "高效工作",
        description: "提升生产力，简化流程",
    },
    {
        title: "安全可靠",
        description: "隐私保护，数据安全",
    },
    {
        title: "多场景应用",
        description: "适用于各种工作场景",
    },
]);

// 当前轮播图片索引
const currentSlide = ref(0);
let carouselInterval = null;

// 登录处理
const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
        ElMessage.warning("请填写完整的登录信息");
        return;
    }

    loading.value = true;
    try {
        // 使用邮箱登录格式
        const loginData = {
            email: loginForm.email,
            password: loginForm.password,
        };

        const result = await authStore.login(loginData);
        if (result.success) {
            ElMessage.success("登录成功！");
            router.push("/dashboard");
        }
    } catch (error) {
        console.log("登录失败:", error);
    } finally {
        loading.value = false;
    }
};

// 轮播图片方法
const goToSlide = (index) => {
    currentSlide.value = index;
};

const nextSlide = () => {
    currentSlide.value = (currentSlide.value + 1) % carouselImages.value.length;
};

// 自动轮播
const startCarousel = () => {
    carouselInterval = setInterval(nextSlide, 4000); // 每4秒切换
};

const stopCarousel = () => {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
};

// 生命周期
onMounted(() => {
    startCarousel();
});

onUnmounted(() => {
    stopCarousel();
});
</script>

<style scoped>
/* Claude.ai 精确颜色系统 */
:root {
    /* 背景色 RGB 值 */
    --bg-000: 255, 255, 255; /* 纯白 */
    --bg-100: 245, 247, 250; /* 主背景 */
    --bg-200: 229, 231, 235; /* 次要背景 */
    --bg-300: 209, 213, 219; /* 第三级背景 */
    --bg-400: 243, 244, 246; /* 悬停背景 */

    /* 文字色 RGB 值 */
    --text-000: 0, 0, 0; /* 纯黑 */
    --text-100: 26, 26, 26; /* 主文字 */
    --text-200: 55, 65, 81; /* 次要文字 */
    --text-300: 107, 114, 128; /* 第三级文字 */
    --text-400: 156, 163, 175; /* 第四级文字 */
    --text-500: 209, 213, 219; /* 占位符文字 */

    /* 边框色 RGB 值 */
    --border-100: 0, 0, 0; /* 深边框 */
    --border-200: 107, 114, 128; /* 中等边框 */
    --border-300: 209, 213, 219; /* 浅边框 */

    /* 特殊色 */
    --claude-orange: 217, 119, 87; /* Claude橙色 */
}

/* Claude.ai 风格的登录页面 - 温暖色调 */
.claude-login {
    min-height: 100vh;
    background: rgb(250, 249, 245); /* 温暖米白色背景 */
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        sans-serif;
    color: #2d2a26; /* 深棕色文字 */
}

.login-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 100vh;
}

/* 左侧登录区域 */
.login-section {
    display: flex;
    align-items: center;
    min-height: 100vh;
    padding: 24px;
}

.login-content {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
}

/* Logo */
.logo-section {
    margin-bottom: 48px;
}

.logo {
    height: 28px;
    color: #8b7d6b; /* 温暖棕灰色 */
}

/* 标题区域 */
.title-section {
    text-align: center;
    margin-bottom: 32px;
}

.main-title {
    font-size: 3.5rem;
    font-weight: 400;
    line-height: 1em;
    color: #5d4e37; /* 深棕色 */
    margin: 0 0 16px 0;
    font-family: "Times New Roman", serif;
    letter-spacing: -0.03em;
}

.subtitle {
    font-size: 18px;
    color: #5d4e37; /* 深棕色 */
    margin: 0;
    font-weight: 400;
    line-height: 1.4;
    letter-spacing: -0.01em;
}

/* 表单容器 */
.form-container {
    margin: 32px 16px;
    padding: 28px;
    max-width: 400px;
    background: rgb(255, 254, 250); /* 奶白色 */
    border-radius: 32px;
    border: 0.5px solid rgb(235, 230, 220); /* 温暖浅灰边框 */
    box-shadow: 0 4px 24px rgba(139, 125, 107, 0.08),
        0 4px 32px rgba(139, 125, 107, 0.08),
        0 2px 64px rgba(139, 125, 107, 0.06),
        0 16px 32px rgba(139, 125, 107, 0.06);
}

.form-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* 认证链接区域 */
.auth-links {
    text-align: center;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgb(235, 230, 220);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}

.auth-link {
    color: #d2691e; /* 巧克力橙色 */
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: color 0.2s;
}

.auth-link:hover {
    color: #b8621a; /* 深巧克力橙 */
    text-decoration: underline;
}

.forgot-link {
    color: #8b7d6b; /* 稍微淡一些的颜色 */
    font-weight: 400;
}

.forgot-link:hover {
    color: #d2691e;
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
    color: #6b5b47; /* 浅棕色 */
    margin-bottom: 4px;
    font-size: 14px;
    font-weight: 500;
}

.form-input {
    height: 44px;
    padding: 0 12px;
    background: rgb(245, 242, 235); /* 温暖浅灰背景 */
    border: 1px solid rgb(220, 210, 195); /* 温暖中灰边框 */
    border-radius: 10px;
    font-size: 16px;
    color: #2d2a26; /* 深棕色文字 */
    transition: all 0.2s;
}

.form-input:hover {
    border-color: rgb(200, 185, 165); /* 温暖深灰边框 */
}

.form-input:focus {
    outline: none;
    border-color: #d2691e; /* 巧克力橙色边框 */
    background: rgb(255, 254, 250); /* 奶白色背景 */
    box-shadow: 0 0 0 3px rgba(210, 105, 30, 0.1);
}

.form-input::placeholder {
    color: #8b7d6b; /* 中等棕灰色 */
}

/* 登录按钮 */
.continue-btn {
    height: 44px;
    background: #d2691e; /* 巧克力橙色 */
    color: #ffffff;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s cubic-bezier(0.165, 0.85, 0.45, 1);
    position: relative;
    overflow: hidden;
}

.continue-btn:hover {
    background: #b8621a; /* 深巧克力橙 */
    transform: scaleY(1.015) scaleX(1.005);
}

.continue-btn:active {
    transform: scale(0.985);
}

.continue-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

/* 法律条款 */
.legal-text {
    font-size: 12px;
    color: #8b7d6b; /* 中等棕灰色 */
    line-height: 1.5;
    letter-spacing: -0.01em;
    text-align: center;
    margin-top: 16px;
}

.legal-link {
    color: #d2691e; /* 巧克力橙色 */
    text-decoration: underline;
    transition: color 0.2s;
}

.legal-link:hover {
    color: #b8621a; /* 深巧克力橙 */
}

/* 轮播图片区域 */
.carousel-section {
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgb(248, 246, 240); /* 温暖米色背景 */
    padding: 40px;
}

.carousel-container {
    width: 100%;
    max-width: 600px;
}

.carousel-wrapper {
    position: relative;
    background: rgb(255, 254, 250); /* 奶白色背景 */
    border-radius: 16px;
    height: 400px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(139, 125, 107, 0.12);
}

.carousel-slides {
    display: flex;
    height: 100%;
    transition: transform 0.5s ease-in-out;
}

.carousel-slide {
    min-width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.slide-content {
    text-align: center;
    padding: 40px;
}

.slide-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.placeholder-icon {
    color: #d2691e; /* 巧克力橙色 */
    margin-bottom: 16px;
}

.placeholder-text {
    font-size: 24px;
    font-weight: 600;
    color: #5d4e37; /* 深棕色 */
    margin: 0;
}

.placeholder-desc {
    font-size: 16px;
    color: #8b7d6b; /* 中等棕灰色 */
    margin: 0;
    line-height: 1.5;
}

.carousel-indicators {
    position: absolute;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
}

.indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: none;
    background: rgb(220, 210, 195); /* 温暖中灰 */
    cursor: pointer;
    transition: all 0.3s;
}

.indicator.active {
    background: #d2691e; /* 巧克力橙色 */
    transform: scale(1.2);
}

.indicator:hover:not(.active) {
    background: rgb(200, 185, 165); /* 温暖深灰 */
}

/* 响应式设计 */
@media (max-width: 1000px) {
    .login-container {
        grid-template-columns: 1fr;
    }

    .carousel-section {
        display: none;
    }

    .main-title {
        font-size: 2.5rem;
    }
}

@media (max-width: 500px) {
    .login-section {
        padding: 16px;
    }

    .form-container {
        margin: 16px 0;
        padding: 20px;
    }

    .main-title {
        font-size: 1.75rem;
    }

    .subtitle {
        font-size: 16px;
    }
}
</style>
