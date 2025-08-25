<template>
    <div class="activation-code-list">
        <!-- 搜索和筛选栏 -->
        <div class="search-bar">
            <el-input
                v-model="searchText"
                placeholder="搜索激活码或描述"
                style="width: 300px; margin-right: 10px"
                clearable
                @input="handleSearch"
            >
                <template #prefix>
                    <el-icon>
                        <Search />
                    </el-icon>
                </template>
            </el-input>

            <el-select
                v-model="statusFilter"
                placeholder="状态筛选"
                style="width: 150px"
                clearable
                @change="handleSearch"
            >
                <el-option label="全部" value />
                <el-option label="未使用" value="unused" />
                <el-option label="已使用" value="used" />
                <el-option label="已激活" value="activated" />
                <el-option label="已过期" value="expired" />
                <el-option label="已暂停" value="suspended" />
                <el-option label="已禁用" value="disabled" />
            </el-select>
        </div>

        <!-- 激活码表格 -->
        <el-table :data="codes" v-loading="loading" stripe style="width: 100%" height="600">
            <el-table-column prop="code" label="激活码" width="200" fixed>
                <template #default="{ row }">
                    <div class="code-cell">
                        <span class="code-text">{{ row.code }}</span>
                        <el-button
                            size="small"
                            text
                            @click="copyCode(row.code)"
                            :icon="DocumentCopy"
                        />
                    </div>
                </template>
            </el-table-column>

            <el-table-column prop="type" label="类型" width="100">
                <template #default="{ row }">
                    <el-tag :type="getTypeColor(row.type)" size="small">{{ getTypeText(row.type) }}</el-tag>
                </template>
            </el-table-column>

            <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                    <el-tag
                        :type="getStatusType(row.status)"
                        size="small"
                    >{{ getStatusText(row.status) }}</el-tag>
                </template>
            </el-table-column>

            <el-table-column prop="description" label="描述" min-width="120" show-overflow-tooltip />

            <el-table-column prop="createdAt" label="创建时间" width="140">
                <template #default="{ row }">
                    <span v-if="row.createdAt">{{ formatDate(row.createdAt) }}</span>
                    <span v-else class="no-data">未记录</span>
                </template>
            </el-table-column>

            <el-table-column prop="expiresAt" label="过期时间" width="140">
                <template #default="{ row }">
                    <span v-if="row.expiresAt && row.expiresAt !== null">
                        <span v-if="isExpired(row)" class="expired-text">已过期</span>
                        <span v-else>{{ formatDate(row.expiresAt) }}</span>
                    </span>
                    <span v-else class="no-expire">-</span>
                </template>
            </el-table-column>

            <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" @click="viewDetails(row)">详情</el-button>
                    <!-- 已激活的只能暂停 -->
                    <el-button
                        v-if="(row.status === 'used' || row.status === 'activated') && row.status !== 'suspended'"
                        size="small"
                        type="warning"
                        @click="suspendCode(row)"
                    >暂停</el-button>
                    <!-- 已暂停的可以恢复 -->
                    <el-button
                        v-if="row.status === 'suspended'"
                        size="small"
                        type="success"
                        @click="resumeCode(row)"
                    >恢复</el-button>
                    <!-- 未激活、已过期的可以删除，已暂停的也可以删除 -->
                    <el-button
                        v-if="row.status === 'unused' || row.status === 'expired' || row.status === 'suspended' || (row.expiresAt && isExpired(row))"
                        size="small"
                        type="danger"
                        @click="deleteCode(row)"
                    >删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
            <el-pagination
                :current-page="currentPage"
                :page-size="pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="totalCount"
                layout="total, sizes, prev, pager, next, jumper"
                @current-change="handleCurrentChange"
                @size-change="handleSizeChange"
            />
        </div>

        <!-- 详情弹窗 -->
        <el-dialog
            v-model="detailDialogVisible"
            title="激活码详情"
            width="900px"
            :close-on-click-modal="false"
        >
            <div v-if="selectedCode" class="code-details">
                <!-- 基本信息 -->
                <div class="detail-section">
                    <h4 class="section-title">🔑 基本信息</h4>
                    <el-descriptions :column="2" border size="small">
                        <el-descriptions-item label="激活码">
                            <div class="code-display">
                                <span class="code-text">{{ selectedCode.code }}</span>
                                <el-button
                                    size="small"
                                    text
                                    @click="copyCode(selectedCode.code)"
                                    :icon="DocumentCopy"
                                />
                            </div>
                        </el-descriptions-item>
                        <el-descriptions-item label="类型">
                            <el-tag
                                :type="getTypeColor(selectedCode.type)"
                                size="small"
                            >{{ getTypeText(selectedCode.type) }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="状态">
                            <el-tag
                                :type="getStatusType(selectedCode.status)"
                                size="small"
                            >{{ getStatusText(selectedCode.status) }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="持续时间">
                            <span v-if="selectedCode.duration">{{ selectedCode.duration }} 小时</span>
                            <span v-else class="permanent-text">永久</span>
                        </el-descriptions-item>
                    </el-descriptions>
                </div>

                <!-- 设备信息 -->
                <div class="detail-section">
                    <h4 class="section-title">📱 设备信息</h4>
                    <el-descriptions :column="2" border size="small">
                        <el-descriptions-item label="最大设备数">
                            <span class="number-text">{{ selectedCode.maxDevices || 1 }}</span>
                        </el-descriptions-item>
                        <el-descriptions-item label="已使用设备">
                            <span class="number-text">{{ selectedCode.usedCount || 0 }}</span>
                        </el-descriptions-item>
                    </el-descriptions>
                </div>

                <!-- 时间信息 -->
                <div class="detail-section">
                    <h4 class="section-title">⏰ 时间信息</h4>
                    <el-descriptions :column="2" border size="small">
                        <el-descriptions-item label="创建时间">
                            <span
                                v-if="selectedCode.createdAt"
                            >{{ formatDate(selectedCode.createdAt) }}</span>
                            <span v-else class="no-data">未记录</span>
                        </el-descriptions-item>
                        <el-descriptions-item label="过期时间">
                            <span v-if="selectedCode.expiresAt && selectedCode.expiresAt !== null">
                                <span v-if="isExpired(selectedCode)" class="expired-text">已过期</span>
                                <span v-else>{{ formatDate(selectedCode.expiresAt) }}</span>
                            </span>
                            <span v-else class="no-expire">-</span>
                        </el-descriptions-item>
                    </el-descriptions>
                </div>

                <!-- 批次信息 -->
                <div class="detail-section" v-if="selectedCode.batch || selectedCode.batchId">
                    <h4 class="section-title">📦 批次信息</h4>
                    <el-descriptions :column="1" border size="small">
                        <el-descriptions-item label="批次ID">{{ selectedCode.batchId || '无' }}</el-descriptions-item>
                        <el-descriptions-item
                            label="批次名称"
                            v-if="selectedCode.batch?.name"
                        >{{ selectedCode.batch.name }}</el-descriptions-item>
                        <el-descriptions-item
                            label="批次描述"
                            v-if="selectedCode.batch?.description"
                        >{{ selectedCode.batch.description }}</el-descriptions-item>
                    </el-descriptions>
                </div>

                <!-- 扩展信息 -->
                <div class="detail-section">
                    <h4 class="section-title">📝 扩展信息</h4>
                    <el-descriptions :column="1" border size="small">
                        <el-descriptions-item label="描述">{{ selectedCode.description || '无描述' }}</el-descriptions-item>
                        <el-descriptions-item
                            label="标签"
                            v-if="selectedCode.tags && selectedCode.tags.length"
                        >
                            <div class="tags-container">
                                <el-tag
                                    v-for="tag in selectedCode.tags"
                                    :key="tag"
                                    size="small"
                                    class="tag-item"
                                >{{ tag }}</el-tag>
                            </div>
                        </el-descriptions-item>
                        <el-descriptions-item
                            label="权限"
                            v-if="selectedCode.permissions && selectedCode.permissions.length"
                        >
                            <div class="permissions-container">
                                <el-tag
                                    v-for="permission in selectedCode.permissions"
                                    :key="permission"
                                    type="success"
                                    size="small"
                                    class="permission-item"
                                >{{ permission }}</el-tag>
                            </div>
                        </el-descriptions-item>
                    </el-descriptions>
                </div>

                <!-- 设备绑定信息 -->
                <div
                    v-if="selectedCode.deviceBindings && selectedCode.deviceBindings.length"
                    class="device-bindings"
                >
                    <h4>设备绑定信息</h4>
                    <el-table :data="selectedCode.deviceBindings" size="small">
                        <el-table-column prop="deviceId" label="设备ID" />
                        <el-table-column prop="activatedAt" label="激活时间">
                            <template #default="{ row }">{{ formatDate(row.activatedAt) }}</template>
                        </el-table-column>
                        <el-table-column prop="lastSeenAt" label="最后活跃">
                            <template #default="{ row }">{{ formatDate(row.lastSeenAt) }}</template>
                        </el-table-column>
                        <el-table-column prop="status" label="状态">
                            <template #default="{ row }">
                                <el-tag
                                    :type="row.status === 'active' ? 'success' : 'warning'"
                                    size="small"
                                >{{ row.status === 'active' ? '活跃' : '离线' }}</el-tag>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>

            <template #footer>
                <el-button @click="detailDialogVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { DocumentCopy } from "@element-plus/icons-vue";
import { activationApi } from "../api/activation.js";

const props = defineProps({
    loading: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(["refresh"]);

// 响应式数据
const searchText = ref("");
const statusFilter = ref("");
const currentPage = ref(1);
const pageSize = ref(20);
const codes = ref([]);
const totalCount = ref(0);
const loading = ref(false);
const detailDialogVisible = ref(false);
const selectedCode = ref(null);

// 计算属性 - 现在使用服务器端分页和筛选，不需要客户端处理

// 方法
const loadCodes = async () => {
    loading.value = true;
    try {
        const params = {
            page: currentPage.value,
            limit: pageSize.value,
            status: statusFilter.value || undefined,
            search: searchText.value || undefined,
        };

        const response = await activationApi.getCodes(params);
        
        // 后端实际返回结构: {status: 0, codes: [...], total: 17, page: 1, limit: 20}
        if (response && response.status === 0) {
            codes.value = response.codes || [];
            totalCount.value = response.total || 0;
        } else {
            codes.value = [];
            totalCount.value = 0;
            ElMessage.warning("获取激活码列表失败");
        }
    } catch (error) {
        console.error("加载激活码列表失败:", error);
        ElMessage.error("加载激活码列表失败: " + (error.message || "网络错误"));
        codes.value = [];
        totalCount.value = 0;
    } finally {
        loading.value = false;
    }
};

const handleSearch = () => {
    currentPage.value = 1;
    loadCodes();
};

const handleSizeChange = (val) => {
    pageSize.value = val;
    currentPage.value = 1;
    loadCodes();
};

const handleCurrentChange = (val) => {
    currentPage.value = val;
    loadCodes();
};

const copyCode = async (code) => {
    try {
        await navigator.clipboard.writeText(code);
        ElMessage.success("激活码已复制到剪贴板");
    } catch (error) {
        ElMessage.error("复制失败");
    }
};

const viewDetails = async (row) => {
    try {
        const response = await activationApi.getCodeDetails(row.code);

        if (
            response.data &&
            response.data.status === 0 &&
            response.data.data &&
            response.data.data.status === 0
        ) {
            // API成功返回数据
            let codeData = response.data.data.data || response.data.data || row;

            // 处理tags字段，如果是JSON字符串则解析为数组
            if (codeData.tags && typeof codeData.tags === "string") {
                try {
                    codeData.tags = JSON.parse(codeData.tags);
                } catch (e) {
                    console.warn("解析tags失败:", e);
                    codeData.tags = [];
                }
            }

            // 处理permissions字段，如果是JSON字符串则解析为数组
            if (
                codeData.permissions &&
                typeof codeData.permissions === "string"
            ) {
                try {
                    codeData.permissions = JSON.parse(codeData.permissions);
                } catch (e) {
                    console.warn("解析permissions失败:", e);
                    codeData.permissions = [];
                }
            }

            selectedCode.value = codeData;
        } else {
            // API返回错误，使用列表中的数据并进行数据处理
            selectedCode.value = processRowData(row);
        }
        detailDialogVisible.value = true;
    } catch (error) {
        console.error("获取激活码详情失败:", error);
        // 发生错误时，使用列表中的数据并进行处理
        selectedCode.value = processRowData(row);
        detailDialogVisible.value = true;
        ElMessage.warning("获取详细信息失败，显示基本信息");
    }
};

// 处理列表行数据，确保格式正确
const processRowData = (row) => {
    let processedData = { ...row };

    // 处理tags字段
    if (processedData.tags && typeof processedData.tags === "string") {
        try {
            processedData.tags = JSON.parse(processedData.tags);
        } catch (e) {
            console.warn("解析tags失败:", e);
            processedData.tags = [];
        }
    }

    // 处理permissions字段
    if (
        processedData.permissions &&
        typeof processedData.permissions === "string"
    ) {
        try {
            processedData.permissions = JSON.parse(processedData.permissions);
        } catch (e) {
            console.warn("解析permissions失败:", e);
            processedData.permissions = [];
        }
    }

    // 确保必要字段存在
    if (!processedData.batch && processedData.batchId) {
        processedData.batch = {
            id: processedData.batchId,
            name: processedData.batchId,
            description: "批次信息",
        };
    }

    return processedData;
};

const suspendCode = async (row) => {
    try {
        await ElMessageBox.confirm(
            `确定要暂停激活码 ${row.code} 吗？`,
            "确认暂停",
            {
                confirmButtonText: "确定",
                cancelButtonText: "取消",
                type: "warning",
            }
        );

        await activationApi.suspendCode(row.code, { reason: "管理员手动暂停" });
        ElMessage.success("激活码已暂停");
        // 刷新列表数据
        loadCodes();
        emit("refresh");
    } catch (error) {
        if (error !== "cancel") {
            ElMessage.error("暂停失败: " + (error.message || error));
        }
    }
};

const resumeCode = async (row) => {
    try {
        await ElMessageBox.confirm(
            `确定要恢复激活码 ${row.code} 吗？`,
            "确认恢复",
            {
                confirmButtonText: "确定",
                cancelButtonText: "取消",
                type: "warning",
            }
        );

        await activationApi.resumeCode(row.code);
        ElMessage.success("激活码已恢复");
        // 刷新列表数据
        loadCodes();
        emit("refresh");
    } catch (error) {
        if (error !== "cancel") {
            ElMessage.error("恢复失败: " + (error.message || error));
        }
    }
};

const deleteCode = async (row) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除激活码 ${row.code} 吗？此操作不可恢复！`,
            "确认删除",
            {
                confirmButtonText: "确定",
                cancelButtonText: "取消",
                type: "warning",
            }
        );

        await activationApi.deleteCode(row.code);
        ElMessage.success("激活码已删除");
        // 刷新列表数据
        loadCodes();
        emit("refresh");
    } catch (error) {
        if (error !== "cancel") {
            ElMessage.error("删除失败: " + (error.message || error));
        }
    }
};

const getTypeText = (type) => {
    const types = {
        daily: "日卡",
        weekly: "周卡",
        monthly: "月卡",
        yearly: "年卡",
        permanent: "永久卡",
    };
    return types[type] || type;
};

const getTypeColor = (type) => {
    const colors = {
        daily: "warning", // 橙色 - 日卡
        weekly: "info", // 蓝色 - 周卡
        monthly: "success", // 绿色 - 月卡
        yearly: "danger", // 红色 - 年卡
        permanent: "", // 默认色 - 永久卡
    };
    return colors[type] || "";
};

const getStatusType = (status) => {
    const types = {
        unused: "",
        used: "success",
        activated: "success",
        expired: "warning",
        suspended: "danger",
        disabled: "info",
    };
    return types[status] || "";
};

const getStatusText = (status) => {
    const texts = {
        unused: "未使用",
        used: "已使用",
        activated: "已激活",
        expired: "已过期",
        suspended: "已暂停",
        disabled: "已禁用",
    };
    return texts[status] || status;
};

const isExpired = (row) => {
    if (!row.expiresAt) return false;

    // 处理时间戳（毫秒）
    let expiresDate;
    if (typeof row.expiresAt === "number") {
        expiresDate = new Date(row.expiresAt);
    } else {
        expiresDate = new Date(row.expiresAt);
    }

    // 检查日期是否有效
    if (isNaN(expiresDate.getTime())) {
        return false;
    }

    return expiresDate < new Date();
};

const formatDate = (dateString) => {
    if (!dateString) return "-";

    // 处理时间戳（毫秒）
    let date;
    if (typeof dateString === "number") {
        date = new Date(dateString);
    } else {
        date = new Date(dateString);
    }

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};

// 生命周期
onMounted(() => {
    loadCodes();
});

// 暴露方法给父组件
defineExpose({
    loadCodes,
});
</script>

<style scoped>
.activation-code-list {
    padding: 0;
}

.search-bar {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
}

.code-cell {
    display: flex;
    align-items: center;
    gap: 8px;
}

.code-text {
    font-family: "Courier New", monospace;
    font-size: 12px;
    color: #409eff;
}

.pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

/* 详情弹窗样式 */
.code-details {
    max-height: 600px;
    overflow-y: auto;
}

.device-bindings {
    margin-top: 20px;
}

.device-bindings h4 {
    margin: 0 0 15px 0;
    color: #303133;
    font-size: 16px;
    font-weight: 600;
}

/* 过期时间样式 */
.no-expire {
    color: #67c23a;
    font-weight: 500;
    font-size: 12px;
}

.expired-text {
    color: #f56c6c;
    font-weight: 500;
    font-size: 12px;
}

.no-data {
    color: #c0c4cc;
    font-style: italic;
    font-size: 12px;
}

/* 批次信息样式 */
.batch-info {
    line-height: 1.6;
}

.batch-info div {
    margin-bottom: 4px;
}

.batch-info strong {
    color: #303133;
    margin-right: 8px;
}

/* 详情弹窗样式优化 */
.detail-section {
    margin-bottom: 20px;
}

.section-title {
    margin: 0 0 12px 0;
    color: #303133;
    font-size: 16px;
    font-weight: 600;
    padding-bottom: 8px;
    border-bottom: 2px solid #f0f0f0;
}

.code-display {
    display: flex;
    align-items: center;
    gap: 8px;
}

.permanent-text {
    color: #909399;
    font-weight: 500;
}

.number-text {
    color: #409eff;
    font-weight: 600;
}

.tags-container,
.permissions-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.tag-item,
.permission-item {
    margin: 0;
}
</style>