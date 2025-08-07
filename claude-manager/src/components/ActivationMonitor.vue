<template>
    <div class="activation-monitor">
        <!-- 统计卡片区域 -->
        <div class="stats-section">
            <div class="stats-grid">
                <div class="stat-card total">
                    <div class="stat-icon">📊</div>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats.totalCodes || 0 }}</div>
                        <div class="stat-label">总激活码</div>
                    </div>
                    <div class="stat-bg"></div>
                </div>

                <div class="stat-card active">
                    <div class="stat-icon">✅</div>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats.usedCodes || 0 }}</div>
                        <div class="stat-label">已激活</div>
                    </div>
                    <div class="stat-bg"></div>
                </div>

                <div class="stat-card unused">
                    <div class="stat-icon">⏳</div>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats.unusedCodes || 0 }}</div>
                        <div class="stat-label">未使用</div>
                    </div>
                    <div class="stat-bg"></div>
                </div>

                <div class="stat-card expired">
                    <div class="stat-icon">⚠️</div>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats.expiredCodes || 0 }}</div>
                        <div class="stat-label">已过期</div>
                    </div>
                    <div class="stat-bg"></div>
                </div>
            </div>
        </div>

        <!-- 饼状图区域 -->
        <div class="chart-section">
            <div class="chart-card">
                <h3>激活码状态分布</h3>
                <div class="pie-chart" ref="pieChartRef" v-loading="chartLoading"></div>
            </div>
        </div>

        <!-- 激活码列表区域 -->
        <div class="list-section">
            <div class="list-header">
                <h3>激活码列表</h3>
                <div class="list-actions">
                    <el-input
                        v-model="searchText"
                        placeholder="搜索激活码"
                        style="width: 200px; margin-right: 10px"
                        clearable
                        @input="handleSearch"
                    >
                        <template #prefix>
                            <el-icon>
                                <Search />
                            </el-icon>
                        </template>
                    </el-input>
                    <el-button @click="refreshData" :loading="loading">
                        <el-icon>
                            <Refresh />
                        </el-icon>刷新
                    </el-button>
                </div>
            </div>

            <div class="code-list">
                <div v-if="loading" class="loading-state">
                    <el-icon class="is-loading">
                        <Loading />
                    </el-icon>
                    <span>加载中...</span>
                </div>

                <div v-else-if="filteredCodes.length === 0" class="empty-state">
                    <div class="empty-icon">📝</div>
                    <div class="empty-text">暂无激活码数据</div>
                </div>

                <div v-else class="code-items">
                    <div v-for="code in paginatedCodes" :key="code.code" class="code-item">
                        <div class="code-main">
                            <div class="code-value">{{ code.code }}</div>
                            <div class="code-meta">
                                <span class="code-type">{{ getTypeText(code.type) }}</span>
                                <span
                                    class="code-status"
                                    :class="code.status"
                                >{{ getStatusText(code.status) }}</span>
                                <span class="code-time">{{ formatDate(code.createdAt) }}</span>
                            </div>
                        </div>
                        <div class="code-description">{{ code.description || '无描述' }}</div>
                        <div class="code-actions">
                            <el-button size="small" @click="viewCodeDetails(code)">详情</el-button>
                            <el-button
                                v-if="code.status === 'used'"
                                size="small"
                                type="warning"
                                @click="suspendCode(code)"
                            >暂停</el-button>
                            <el-button size="small" type="danger" @click="deleteCode(code)">删除</el-button>
                        </div>
                    </div>
                </div>

                <!-- 分页 -->
                <div class="pagination-wrapper" v-if="filteredCodes.length > pageSize">
                    <el-pagination
                        :current-page="currentPage"
                        :page-size="pageSize"
                        :page-sizes="[10, 20, 50, 100]"
                        :total="filteredCodes.length"
                        layout="total, sizes, prev, pager, next"
                        @size-change="handleSizeChange"
                        @current-change="handleCurrentChange"
                    />
                </div>
            </div>
        </div>

        <!-- 生成激活码对话框 -->
        <GenerateDialog
            :visible="showGenerateDialog"
            @close="$emit('close-generate-dialog')"
            @generated="handleCodeGenerated"
        />

        <!-- 激活码测试对话框 -->
        <TestDialog :visible="showTestDialog" @close="$emit('close-test-dialog')" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Loading, Search, Refresh } from "@element-plus/icons-vue";
import * as echarts from "echarts";
import { activationApi } from "../../../activation-backend/src/api/activation";
import GenerateDialog from "./GenerateDialog.vue";
import TestDialog from "./TestDialog.vue";

const props = defineProps({
    showGenerateDialog: Boolean,
    showTestDialog: Boolean,
});

const emit = defineEmits(["close-generate-dialog", "close-test-dialog"]);

// 响应式数据
const loading = ref(false);
const chartLoading = ref(false);
const codes = ref([]);
const stats = ref({
    totalCodes: 0,
    unusedCodes: 0,
    usedCodes: 0,
    expiredCodes: 0,
    suspendedCodes: 0,
    activeDeviceBindings: 0,
});

// 搜索和分页
const searchText = ref("");
const currentPage = ref(1);
const pageSize = ref(20);

// 图表引用
const pieChartRef = ref(null);
let pieChart = null;

// 计算属性
const filteredCodes = computed(() => {
    if (!searchText.value) return codes.value;

    const search = searchText.value.toLowerCase();
    return codes.value.filter(
        (code) =>
            code.code.toLowerCase().includes(search) ||
            (code.description &&
                code.description.toLowerCase().includes(search))
    );
});

const paginatedCodes = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredCodes.value.slice(start, end);
});

// 方法
const loadData = async () => {
    loading.value = true;
    try {
        // 并行加载统计数据和激活码列表
        const [statsResponse, codesResponse] = await Promise.all([
            activationApi.getStats(),
            activationApi.getCodes({ page: 1, limit: 1000 }),
        ]);

        // 处理统计数据
        if (statsResponse.data && statsResponse.data.status === 0) {
            stats.value = statsResponse.data.data.overview || stats.value;
        }

        // 处理激活码列表数据
        if (codesResponse.data) {
            codes.value = codesResponse.data.data || [];
        }

        await nextTick();
        initPieChart();
    } catch (error) {
        console.error("加载数据失败:", error);
        ElMessage.error("加载数据失败: " + (error.message || "网络错误"));
    } finally {
        loading.value = false;
    }
};

const initPieChart = async () => {
    if (!pieChartRef.value) return;

    chartLoading.value = true;
    try {
        if (pieChart) {
            pieChart.dispose();
        }

        pieChart = echarts.init(pieChartRef.value);
        const option = {
            tooltip: {
                trigger: "item",
                formatter: "{a} <br/>{b}: {c} ({d}%)",
            },
            legend: {
                orient: "vertical",
                left: "left",
            },
            series: [
                {
                    name: "激活码状态",
                    type: "pie",
                    radius: "70%",
                    center: ["60%", "50%"],
                    data: [
                        {
                            value: stats.value.usedCodes,
                            name: "已激活",
                            itemStyle: { color: "#67C23A" },
                        },
                        {
                            value: stats.value.unusedCodes,
                            name: "未使用",
                            itemStyle: { color: "#E6A23C" },
                        },
                        {
                            value: stats.value.expiredCodes,
                            name: "已过期",
                            itemStyle: { color: "#F56C6C" },
                        },
                        {
                            value: stats.value.suspendedCodes,
                            name: "已暂停",
                            itemStyle: { color: "#909399" },
                        },
                    ],
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: "rgba(0, 0, 0, 0.5)",
                        },
                    },
                },
            ],
        };
        pieChart.setOption(option);
    } catch (error) {
        console.error("初始化图表失败:", error);
    } finally {
        chartLoading.value = false;
    }
};

const refreshData = () => {
    loadData();
};

const handleCodeGenerated = () => {
    refreshData();
};

const handleSearch = () => {
    currentPage.value = 1;
};

const handleSizeChange = (val) => {
    pageSize.value = val;
    currentPage.value = 1;
};

const handleCurrentChange = (val) => {
    currentPage.value = val;
};

const viewCodeDetails = async (code) => {
    try {
        const response = await activationApi.getCodeDetails(code.code);
        // 这里可以显示详情对话框
        ElMessage.info("查看详情功能开发中...");
    } catch (error) {
        ElMessage.error("获取详情失败: " + (error.message || "网络错误"));
    }
};

const suspendCode = async (code) => {
    try {
        await ElMessageBox.confirm(
            `确定要暂停激活码 ${code.code} 吗？`,
            "确认暂停",
            {
                confirmButtonText: "确定",
                cancelButtonText: "取消",
                type: "warning",
            }
        );

        await activationApi.suspendCode(code.code, {
            reason: "管理员手动暂停",
        });
        ElMessage.success("激活码已暂停");
        refreshData();
    } catch (error) {
        if (error !== "cancel") {
            ElMessage.error("暂停失败: " + (error.message || error));
        }
    }
};

const deleteCode = async (code) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除激活码 ${code.code} 吗？此操作不可恢复！`,
            "确认删除",
            {
                confirmButtonText: "确定",
                cancelButtonText: "取消",
                type: "warning",
            }
        );

        await activationApi.deleteCode(code.code);
        ElMessage.success("激活码已删除");
        refreshData();
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

const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("zh-CN");
};

// 生命周期
onMounted(() => {
    loadData();
});
</script>

<style scoped>
.activation-monitor {
    padding: 20px;
    background: #f5f7fa;
    min-height: 100vh;
}

/* 统计卡片样式 */
.stats-section {
    margin-bottom: 30px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

.stat-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 16px;
    position: relative;
    overflow: hidden;
    transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.stat-bg {
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100%;
    opacity: 0.1;
    border-radius: 50%;
    transform: translateX(30px);
}

.stat-card.total .stat-bg {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card.active .stat-bg {
    background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.stat-card.unused .stat-bg {
    background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
}

.stat-card.expired .stat-bg {
    background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
}

.stat-icon {
    font-size: 32px;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: #f0f2f5;
    z-index: 1;
}

.stat-card.total .stat-icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.stat-card.active .stat-icon {
    background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
    color: white;
}

.stat-card.unused .stat-icon {
    background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
    color: white;
}

.stat-card.expired .stat-icon {
    background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
    color: white;
}

.stat-content {
    z-index: 1;
}

.stat-value {
    font-size: 28px;
    font-weight: bold;
    color: #303133;
    margin-bottom: 4px;
}

.stat-label {
    font-size: 14px;
    color: #909399;
}

/* 图表样式 */
.chart-section {
    margin-bottom: 30px;
}

.chart-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.chart-card h3 {
    margin: 0 0 20px 0;
    font-size: 16px;
    color: #303133;
}

.pie-chart {
    height: 400px;
}

/* 列表样式 */
.list-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.list-header h3 {
    margin: 0;
    font-size: 16px;
    color: #303133;
}

.list-actions {
    display: flex;
    align-items: center;
}

.loading-state,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #909399;
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.empty-text {
    font-size: 16px;
}

.code-items {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.code-item {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 16px;
    transition: all 0.3s;
}

.code-item:hover {
    border-color: #c0c4cc;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.code-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.code-value {
    font-family: "Courier New", monospace;
    font-size: 16px;
    font-weight: bold;
    color: #409eff;
}

.code-meta {
    display: flex;
    gap: 12px;
    align-items: center;
}

.code-type {
    background: #f0f2f5;
    color: #606266;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
}

.code-status {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
}

.code-status.unused {
    background: #fdf6ec;
    color: #e6a23c;
}

.code-status.used,
.code-status.activated {
    background: #f0f9ff;
    color: #67c23a;
}

.code-status.expired {
    background: #fef0f0;
    color: #f56c6c;
}

.code-status.suspended {
    background: #f4f4f5;
    color: #909399;
}

.code-time {
    font-size: 12px;
    color: #909399;
}

.code-description {
    color: #606266;
    font-size: 14px;
    margin-bottom: 8px;
}

.code-actions {
    display: flex;
    gap: 8px;
}

.pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

@media (max-width: 768px) {
    .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }

    .list-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
    }

    .code-main {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
}
</style>
