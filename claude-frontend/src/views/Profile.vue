<template>
    <div class="profile">
        <el-container>
            <!-- 头部导航 -->
            <el-header class="header">
                <div class="header-left">
                    <el-button @click="$router.go(-1)" text>
                        <el-icon>
                            <ArrowLeft />
                        </el-icon>返回
                    </el-button>
                    <h2>个人资料</h2>
                </div>
            </el-header>

            <!-- 主要内容 -->
            <el-main class="main">
                <div class="profile-container">
                    <el-row :gutter="24">
                        <!-- 左侧个人信息卡片 -->
                        <el-col :span="8">
                            <el-card class="profile-card">
                                <div class="profile-header">
                                    <el-avatar :src="userInfo.avatar" :size="80" />
                                    <h3>{{ userInfo.username }}</h3>
                                    <p>{{ userInfo.email }}</p>
                                    <el-tag type="success">{{ userInfo.role }}</el-tag>
                                </div>

                                <el-divider />

                                <div class="profile-stats">
                                    <div class="stat-item">
                                        <span class="stat-label">注册时间</span>
                                        <span class="stat-value">2024-01-15</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">最后登录</span>
                                        <span class="stat-value">2024-07-30</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">登录次数</span>
                                        <span class="stat-value">128</span>
                                    </div>
                                </div>
                            </el-card>
                        </el-col>

                        <!-- 右侧编辑表单 -->
                        <el-col :span="16">
                            <el-card>
                                <template #header>
                                    <h3>编辑资料</h3>
                                </template>

                                <el-form
                                    ref="profileFormRef"
                                    :model="profileForm"
                                    :rules="profileRules"
                                    label-width="100px"
                                    size="large"
                                >
                                    <el-form-item label="头像">
                                        <el-upload
                                            class="avatar-uploader"
                                            action="#"
                                            :show-file-list="false"
                                            :before-upload="beforeAvatarUpload"
                                            :on-success="handleAvatarSuccess"
                                        >
                                            <el-avatar
                                                v-if="profileForm.avatar"
                                                :src="profileForm.avatar"
                                                :size="60"
                                            />
                                            <el-icon v-else class="avatar-uploader-icon">
                                                <Plus />
                                            </el-icon>
                                        </el-upload>
                                    </el-form-item>

                                    <el-form-item label="用户名" prop="username">
                                        <el-input
                                            v-model="profileForm.username"
                                            placeholder="请输入用户名"
                                        />
                                    </el-form-item>

                                    <el-form-item label="邮箱" prop="email">
                                        <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
                                    </el-form-item>

                                    <el-form-item label="手机号" prop="phone">
                                        <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
                                    </el-form-item>

                                    <el-form-item label="个人简介">
                                        <el-input
                                            v-model="profileForm.bio"
                                            type="textarea"
                                            :rows="4"
                                            placeholder="请输入个人简介"
                                        />
                                    </el-form-item>

                                    <el-form-item>
                                        <el-button
                                            type="primary"
                                            @click="handleSave"
                                            :loading="loading"
                                        >保存修改</el-button>
                                        <el-button @click="handleReset">重置</el-button>
                                    </el-form-item>
                                </el-form>
                            </el-card>

                            <!-- 密码修改 -->
                            <el-card style="margin-top: 24px;">
                                <template #header>
                                    <h3>修改密码</h3>
                                </template>

                                <el-form
                                    ref="passwordFormRef"
                                    :model="passwordForm"
                                    :rules="passwordRules"
                                    label-width="100px"
                                    size="large"
                                >
                                    <el-form-item label="当前密码" prop="currentPassword">
                                        <el-input
                                            v-model="passwordForm.currentPassword"
                                            type="password"
                                            placeholder="请输入当前密码"
                                            show-password
                                        />
                                    </el-form-item>

                                    <el-form-item label="新密码" prop="newPassword">
                                        <el-input
                                            v-model="passwordForm.newPassword"
                                            type="password"
                                            placeholder="请输入新密码"
                                            show-password
                                        />
                                    </el-form-item>

                                    <el-form-item label="确认密码" prop="confirmPassword">
                                        <el-input
                                            v-model="passwordForm.confirmPassword"
                                            type="password"
                                            placeholder="请确认新密码"
                                            show-password
                                        />
                                    </el-form-item>

                                    <el-form-item>
                                        <el-button
                                            type="primary"
                                            @click="handleChangePassword"
                                            :loading="passwordLoading"
                                        >修改密码</el-button>
                                    </el-form-item>
                                </el-form>
                            </el-card>
                        </el-col>
                    </el-row>
                </div>
            </el-main>
        </el-container>
    </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";
import { ArrowLeft, Plus } from "@element-plus/icons-vue";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

// 表单引用
const profileFormRef = ref();
const passwordFormRef = ref();

// 加载状态
const loading = ref(false);
const passwordLoading = ref(false);

// 用户信息
const userInfo = computed(
    () =>
        authStore.userInfo || {
            username: "admin",
            email: "admin@example.com",
            avatar: "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
            role: "admin",
        }
);

// 个人资料表单
const profileForm = reactive({
    username: userInfo.value.username,
    email: userInfo.value.email,
    phone: "",
    bio: "",
    avatar: userInfo.value.avatar,
});

// 密码修改表单
const passwordForm = reactive({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
});

// 表单验证规则
const profileRules = {
    username: [
        { required: true, message: "请输入用户名", trigger: "blur" },
        {
            min: 3,
            max: 20,
            message: "用户名长度在3到20个字符",
            trigger: "blur",
        },
    ],
    email: [
        { required: true, message: "请输入邮箱", trigger: "blur" },
        { type: "email", message: "请输入有效的邮箱地址", trigger: "blur" },
    ],
    phone: [
        {
            pattern: /^1[3-9]\d{9}$/,
            message: "请输入有效的手机号",
            trigger: "blur",
        },
    ],
};

const passwordRules = {
    currentPassword: [
        { required: true, message: "请输入当前密码", trigger: "blur" },
    ],
    newPassword: [
        { required: true, message: "请输入新密码", trigger: "blur" },
        { min: 6, max: 20, message: "密码长度在6到20个字符", trigger: "blur" },
    ],
    confirmPassword: [
        { required: true, message: "请确认新密码", trigger: "blur" },
        {
            validator: (rule, value, callback) => {
                if (value !== passwordForm.newPassword) {
                    callback(new Error("两次输入的密码不一致"));
                } else {
                    callback();
                }
            },
            trigger: "blur",
        },
    ],
};

// 头像上传前验证
const beforeAvatarUpload = (file) => {
    const isJPG = file.type === "image/jpeg" || file.type === "image/png";
    const isLt2M = file.size / 1024 / 1024 < 2;

    if (!isJPG) {
        ElMessage.error("头像只能是 JPG/PNG 格式!");
    }
    if (!isLt2M) {
        ElMessage.error("头像大小不能超过 2MB!");
    }
    return isJPG && isLt2M;
};

// 头像上传成功
const handleAvatarSuccess = (response, file) => {
    profileForm.avatar = URL.createObjectURL(file.raw);
};

// 保存个人资料
const handleSave = async () => {
    if (!profileFormRef.value) return;

    try {
        const valid = await profileFormRef.value.validate();
        if (valid) {
            loading.value = true;

            // 模拟API调用
            setTimeout(() => {
                loading.value = false;
                ElMessage.success("个人资料保存成功！");
            }, 1000);
        }
    } catch (error) {
        console.log("表单验证失败:", error);
    }
};

// 重置表单
const handleReset = () => {
    Object.assign(profileForm, {
        username: userInfo.value.username,
        email: userInfo.value.email,
        phone: "",
        bio: "",
        avatar: userInfo.value.avatar,
    });
};

// 修改密码
const handleChangePassword = async () => {
    if (!passwordFormRef.value) return;

    try {
        const valid = await passwordFormRef.value.validate();
        if (valid) {
            passwordLoading.value = true;

            // 模拟API调用
            setTimeout(() => {
                passwordLoading.value = false;
                ElMessage.success("密码修改成功！");

                // 重置密码表单
                Object.assign(passwordForm, {
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
            }, 1000);
        }
    } catch (error) {
        console.log("表单验证失败:", error);
    }
};
</script>

<style scoped>
.profile {
    height: 100vh;
    background: rgb(250, 249, 245);
}

.header {
    background: rgb(255, 254, 250);
    display: flex;
    align-items: center;
    padding: 0 24px;
    box-shadow: 0 2px 8px rgba(139, 125, 107, 0.1);
}

.header-left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.header-left h2 {
    margin: 0;
    color: #5d4e37;
}

.main {
    padding: 24px;
}

.profile-container {
    max-width: 1200px;
    margin: 0 auto;
}

.profile-card {
    text-align: center;
}

.profile-header h3 {
    margin: 16px 0 8px 0;
    color: #303133;
}

.profile-header p {
    margin: 0 0 16px 0;
    color: #909399;
}

.profile-stats {
    text-align: left;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
}

.stat-item:last-child {
    border-bottom: none;
}

.stat-label {
    color: #909399;
    font-size: 14px;
}

.stat-value {
    color: #303133;
    font-weight: 500;
}

.avatar-uploader {
    display: inline-block;
}

.avatar-uploader :deep(.el-upload) {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: 0.3s;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.avatar-uploader :deep(.el-upload:hover) {
    border-color: #8b55fc;
}

.avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
}
</style>
