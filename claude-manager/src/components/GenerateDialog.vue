<template>
    <el-dialog :model-value="visible" title="生成激活码" width="600px" @close="handleClose">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
            <el-form-item label="激活码类型" prop="type">
                <el-select v-model="form.type" placeholder="请选择类型">
                    <el-option label="日卡 (24小时)" value="daily" />
                    <el-option label="周卡 (7天)" value="weekly" />
                    <el-option label="月卡 (30天)" value="monthly" />
                    <el-option label="年卡 (365天)" value="yearly" />
                    <el-option label="永久卡" value="permanent" />
                </el-select>
            </el-form-item>

            <el-form-item label="持续时间" prop="duration" v-if="form.type !== 'permanent'">
                <el-input-number v-model="form.duration" :min="1" :max="8760" placeholder="小时" />
                <span style="margin-left: 10px; color: #909399;">小时</span>
            </el-form-item>

            <el-form-item label="最大设备数" prop="maxDevices">
                <el-input-number v-model="form.maxDevices" :min="1" :max="100" />
            </el-form-item>

            <el-form-item label="生成数量" prop="batchSize">
                <el-input-number v-model="form.batchSize" :min="1" :max="1000" />
            </el-form-item>

            <el-form-item label="描述信息" prop="description">
                <el-input
                    v-model="form.description"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入描述信息"
                />
            </el-form-item>

            <el-form-item label="权限设置" prop="permissions">
                <el-select
                    v-model="form.permissions"
                    multiple
                    placeholder="请选择权限"
                    style="width: 100%"
                >
                    <el-option label="基础权限" value="basic" />
                    <el-option label="高级权限" value="premium" />
                    <el-option label="企业权限" value="enterprise" />
                    <el-option label="API访问" value="api_access" />
                </el-select>
            </el-form-item>

            <el-form-item label="标签" prop="tags">
                <el-select
                    v-model="form.tags"
                    multiple
                    filterable
                    allow-create
                    placeholder="请选择或输入标签"
                    style="width: 100%"
                >
                    <el-option label="VIP" value="vip" />
                    <el-option label="试用" value="trial" />
                    <el-option label="企业版" value="enterprise" />
                    <el-option label="测试" value="test" />
                </el-select>
            </el-form-item>
        </el-form>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="visible = false">取消</el-button>
                <el-button type="primary" @click="generateCodes" :loading="loading">生成激活码</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import { activationApi } from "../api/activation";

const props = defineProps({
    visible: Boolean,
});

const emit = defineEmits(["close", "generated"]);

const loading = ref(false);
const formRef = ref();

const form = reactive({
    type: "daily",
    duration: 24,
    maxDevices: 1,
    batchSize: 1,
    description: "",
    tags: [],
    permissions: ["basic"], // 添加缺失的 permissions 字段
});

const rules = {
    type: [{ required: true, message: "请选择激活码类型", trigger: "change" }],
    duration: [{ required: true, message: "请输入持续时间", trigger: "blur" }],
    maxDevices: [
        { required: true, message: "请输入最大设备数", trigger: "blur" },
    ],
    batchSize: [{ required: true, message: "请输入生成数量", trigger: "blur" }],
};

const generateCodes = async () => {
    try {
        await formRef.value.validate();

        loading.value = true;

        // 准备API请求数据
        const requestData = {
            type: form.type,
            batchSize: form.batchSize,
            maxDevices: form.maxDevices,
            description: form.description,
            tags: form.tags,
            permissions: form.permissions,
            enhanced: form.permissions && form.permissions.length > 1,
        };

        // 如果不是永久卡，添加持续时间
        if (form.type !== "permanent") {
            requestData.duration = form.duration;
        }

        const response = await activationApi.generateCodes(requestData);

        if (response.data && response.data.status === 0) {
            ElMessage.success(`成功生成 ${form.batchSize} 个激活码`);
            emit("generated");
            handleClose();
        } else {
            throw new Error(response.data?.message || "生成失败");
        }
    } catch (error) {
        if (error.message) {
            ElMessage.error("生成失败: " + error.message);
        }
    } finally {
        loading.value = false;
    }
};

const resetForm = () => {
    Object.assign(form, {
        type: "daily",
        duration: 24,
        maxDevices: 1,
        batchSize: 1,
        description: "",
        tags: [],
        permissions: ["basic"],
    });
    formRef.value?.clearValidate();
};
</script>

<style scoped>
.dialog-footer {
    text-align: right;
}
</style>