<template>
    <el-dialog :model-value="visible" title="激活码测试" width="600px" @close="handleClose">
        <div class="test-content">
            <!-- 激活测试表单 -->
            <el-form :model="form" label-width="100px" class="test-form">
                <el-form-item label="激活码" required>
                    <el-input v-model="form.code" placeholder="请输入激活码，如：ABC123DEF456" clearable />
                </el-form-item>

                <el-form-item label="设备ID" required>
                    <el-input v-model="form.deviceId" placeholder="请输入设备ID" clearable />
                    <div class="form-tip">
                        <el-button type="text" @click="generateDeviceId" size="small">🔄 生成随机设备ID</el-button>
                    </div>
                </el-form-item>

                <el-form-item label="用户代理">
                    <el-input v-model="form.userAgent" placeholder="可选，如：MyApp/1.0" clearable />
                </el-form-item>

                <el-form-item label="IP地址">
                    <el-input v-model="form.ipAddress" placeholder="可选，如：192.168.1.100" clearable />
                </el-form-item>

                <el-form-item>
                    <el-button
                        type="primary"
                        @click="testActivation"
                        :loading="testing"
                        :disabled="!form.code || !form.deviceId"
                    >🧪 测试激活</el-button>
                    <el-button @click="resetForm">🔄 重置表单</el-button>
                </el-form-item>
            </el-form>

            <!-- 请求示例 -->
            <el-divider content-position="left">请求示例</el-divider>
            <div class="code-example">
                <h4>POST /v1/activate</h4>
                <pre><code>{{ requestExample }}</code></pre>
            </div>

            <!-- 响应结果 -->
            <el-divider content-position="left">响应结果</el-divider>
            <div v-if="result" class="result-section">
                <el-alert
                    :title="result.success ? '激活成功' : '激活失败'"
                    :type="result.success ? 'success' : 'error'"
                    :description="result.message"
                    show-icon
                    :closable="false"
                />

                <div class="result-details" v-if="result.data">
                    <h4>详细信息：</h4>
                    <pre><code>{{ JSON.stringify(result.data, null, 2) }}</code></pre>
                </div>
            </div>

            <!-- 验证测试区域 -->
            <div v-if="licenseData" class="validation-section">
                <el-divider content-position="left">授权验证测试</el-divider>
                <el-form :model="validationForm" label-width="100px">
                    <el-form-item label="设备ID">
                        <el-input
                            v-model="validationForm.deviceId"
                            placeholder="用于验证的设备ID"
                            readonly
                        />
                    </el-form-item>

                    <el-form-item>
                        <el-button
                            type="success"
                            @click="testValidation"
                            :loading="validating"
                        >🛡️ 测试验证</el-button>
                    </el-form-item>
                </el-form>

                <div v-if="validationResult" class="result-section">
                    <el-alert
                        :title="validationResult.success ? '验证成功' : '验证失败'"
                        :type="validationResult.success ? 'success' : 'error'"
                        :description="validationResult.message"
                        show-icon
                        :closable="false"
                    />

                    <div class="result-details" v-if="validationResult.data">
                        <h4>验证详情：</h4>
                        <pre><code>{{ JSON.stringify(validationResult.data, null, 2) }}</code></pre>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleClose">关闭</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";
import { activationApi } from "../api/activation";

const props = defineProps({
    visible: Boolean,
});

const emit = defineEmits(["close"]);

// 响应式数据
const testing = ref(false);
const validating = ref(false);
const result = ref(null);
const validationResult = ref(null);
const licenseData = ref(null);

const form = reactive({
    code: "",
    deviceId: "",
    userAgent: "TestTool/1.0",
    ipAddress: "",
});

const validationForm = reactive({
    deviceId: "",
});

// 计算属性
const requestExample = computed(() => {
    return JSON.stringify(
        {
            code: form.code || "ABC123DEF456",
            deviceId: form.deviceId || "device-12345",
            userAgent: form.userAgent || "TestTool/1.0",
            ipAddress: form.ipAddress || "192.168.1.100",
        },
        null,
        2
    );
});

// 方法
const generateDeviceId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    form.deviceId = `device-${timestamp}-${random}`;
};

const testActivation = async () => {
    testing.value = true;
    result.value = null;

    try {
        const requestData = {
            code: form.code,
            deviceId: form.deviceId,
            userAgent: form.userAgent,
            ipAddress: form.ipAddress,
        };

        const response = await activationApi.activateDevice(requestData);

        if (response.data && response.data.status === 0) {
            result.value = {
                success: true,
                message: response.data.message || "激活成功",
                data: response.data,
            };

            // 保存授权数据用于验证测试
            if (response.data.license) {
                licenseData.value = response.data.license;
                validationForm.deviceId = form.deviceId;
            }

            ElMessage.success("激活测试成功");
        } else {
            result.value = {
                success: false,
                message: response.data?.message || "激活失败",
                data: response.data,
            };
            ElMessage.error("激活测试失败");
        }
    } catch (error) {
        // 处理HTTP错误响应
        if (error.response && error.response.data) {
            result.value = {
                success: false,
                message: error.response.data.message || "激活失败",
                data: error.response.data,
            };
        } else {
            result.value = {
                success: false,
                message: error.message || "网络错误",
                data: null,
            };
        }
        ElMessage.error(
            "测试失败: " +
                (error.response?.data?.message || error.message || "网络错误")
        );
    } finally {
        testing.value = false;
    }
};

const testValidation = async () => {
    validating.value = true;
    validationResult.value = null;

    try {
        const requestData = {
            deviceId: validationForm.deviceId,
        };

        const response = await activationApi.validateLicense(requestData);

        if (response.data && response.data.status === 0) {
            validationResult.value = {
                success: response.data.valid || false,
                message: response.data.message || "验证成功",
                data: response.data,
            };
            ElMessage.success("验证测试成功");
        } else {
            validationResult.value = {
                success: false,
                message: response.data?.message || "验证失败",
                data: response.data,
            };
            ElMessage.error("验证测试失败");
        }
    } catch (error) {
        validationResult.value = {
            success: false,
            message: error.message || "网络错误",
            data: null,
        };
        ElMessage.error("验证失败: " + (error.message || "网络错误"));
    } finally {
        validating.value = false;
    }
};

const resetForm = () => {
    Object.assign(form, {
        code: "",
        deviceId: "",
        userAgent: "TestTool/1.0",
        ipAddress: "",
    });
    result.value = null;
    validationResult.value = null;
    licenseData.value = null;
    validationForm.deviceId = "";
};

const handleClose = () => {
    resetForm();
    emit("close");
};
</script>

<style scoped>
.test-content {
    max-height: 600px;
    overflow-y: auto;
}

.test-form {
    margin-bottom: 20px;
}

.form-tip {
    margin-top: 5px;
}

.code-example {
    background: #f5f7fa;
    padding: 15px;
    border-radius: 8px;
    margin: 10px 0;
}

.code-example h4 {
    margin: 0 0 10px 0;
    color: #409eff;
    font-size: 14px;
}

.code-example pre {
    margin: 0;
    background: #2d3748;
    color: #e2e8f0;
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 12px;
}

.result-section {
    margin: 15px 0;
}

.result-details {
    margin-top: 15px;
}

.result-details h4 {
    margin: 0 0 10px 0;
    color: #303133;
    font-size: 14px;
}

.result-details pre {
    background: #f5f7fa;
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    border: 1px solid #dcdfe6;
    font-size: 12px;
}

.validation-section {
    margin-top: 20px;
}

.dialog-footer {
    text-align: right;
}
</style>
