<template>
    <div class="claude-login">
        <div class="login-container">
            <!-- 左侧登录表单 -->
            <div class="login-section">
                <div class="login-content">
                    <!-- Logo section removed -->

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

/* Logo styles removed */

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
