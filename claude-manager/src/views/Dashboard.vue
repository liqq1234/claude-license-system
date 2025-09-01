<template>
    <div class="dashboard">
        <!-- 操作按钮区域 -->
        <div class="action-section">
            <el-button type="primary" @click="showGenerateDialog = true" class="action-button">
                <span class="action-icon">🔑</span>
                <span class="action-text">生成激活码</span>
            </el-button>

            <el-button type="success" @click="showTestDialog = true" class="action-button">
                <span class="action-icon">🧪</span>
                <span class="action-text">激活测试</span>
            </el-button>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-section">
            <el-row :gutter="20">
                <el-col :span="6">
                    <el-card class="stat-card">
                        <div class="stat-item">
                            <div class="stat-icon total">🔑</div>
                            <div class="stat-info">
                                <div class="stat-number">{{ totalCodes }}</div>
                                <div class="stat-label">总激活码数</div>
                            </div>
                        </div>
                    </el-card>
                </el-col>

                <el-col :span="6">
                    <el-card class="stat-card">
                        <div class="stat-item">
                            <div class="stat-icon active">✅</div>
                            <div class="stat-info">
                                <div class="stat-number">{{ activeCodes }}</div>
                                <div class="stat-label">已激活</div>
                            </div>
                        </div>
                    </el-card>
                </el-col>

                <el-col :span="6">
                    <el-card class="stat-card">
                        <div class="stat-item">
                            <div class="stat-icon pending">⏳</div>
                            <div class="stat-info">
                                <div class="stat-number">{{ pendingCodes }}</div>
                                <div class="stat-label">待激活</div>
                            </div>
                        </div>
                    </el-card>
                </el-col>

                <el-col :span="6">
                    <el-card class="stat-card">
                        <div class="stat-item">
                            <div class="stat-icon expired">❌</div>
                            <div class="stat-info">
                                <div class="stat-number">{{ expiredCodes }}</div>
                                <div class="stat-label">已过期</div>
                            </div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </div>

        <!-- 饼状图 -->
        <div class="chart-section">
            <el-card>
                <template #header>
                    <div class="card-header">
                        <span>📊 激活码状态分布</span>
                    </div>
                </template>
                <div class="chart-container" ref="chartContainer"></div>
            </el-card>
        </div>

        <!-- 激活码列表 -->
        <div class="list-section">
            <el-card>
                <template #header>
                    <div class="card-header">
                        <span>📋 激活码列表</span>
                    </div>
                </template>
                <ActivationCodeList ref="codeListRef" @refresh="loadData" />
            </el-card>
        </div>

        <!-- 生成激活码弹窗 -->
        <GenerateDialog
            :visible="showGenerateDialog"
            @close="showGenerateDialog = false"
            @generated="handleGenerated"
        />

        <!-- 激活测试弹窗 -->
        <TestDialog :visible="showTestDialog" @close="showTestDialog = false" />
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import ActivationCodeList from "../components/ActivationCodeList.vue";
import GenerateDialog from "../components/GenerateDialog.vue";
import TestDialog from "../components/TestDialog.vue";
import { activationApi } from "../api/activation";
import * as echarts from "echarts";

// 响应式数据
const showGenerateDialog = ref(false);
const showTestDialog = ref(false);
const codeListRef = ref();
const chartContainer = ref();
let chartInstance = null;

// 统计数据
const totalCodes = ref(0);
const activeCodes = ref(0);
const pendingCodes = ref(0);
const expiredCodes = ref(0);

// 初始化图表
const initChart = () => {
    if (!chartContainer.value) return;

    chartInstance = echarts.init(chartContainer.value);

    const option = {
        tooltip: {
            trigger: "item",
            formatter: "{a} <br/>{b}: {c} ({d}%)",
        },
        legend: {
            orient: "vertical",
            left: "left",
            data: ["已激活", "待激活", "已过期"],
        },
        series: [
            {
                name: "激活码状态",
                type: "pie",
                radius: ["40%", "70%"],
                center: ["60%", "50%"],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: "#fff",
                    borderWidth: 2,
                },
                label: {
                    show: false,
                    position: "center",
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: "18",
                        fontWeight: "bold",
                    },
                },
                labelLine: {
                    show: false,
                },
                data: [
                    {
                        value: activeCodes.value,
                        name: "已激活",
                        itemStyle: { color: "#67C23A" },
                    },
                    {
                        value: pendingCodes.value,
                        name: "待激活",
                        itemStyle: { color: "#E6A23C" },
                    },
                    {
                        value: expiredCodes.value,
                        name: "已过期",
                        itemStyle: { color: "#F56C6C" },
                    },
                ],
            },
        ],
    };

    chartInstance.setOption(option);
};

// 更新图表数据
const updateChart = () => {
    if (!chartInstance) return;

    const option = {
        series: [
            {
                data: [
                    {
                        value: activeCodes.value,
                        name: "已激活",
                        itemStyle: { color: "#67C23A" },
                    },
                    {
                        value: pendingCodes.value,
                        name: "待激活",
                        itemStyle: { color: "#E6A23C" },
                    },
                    {
                        value: expiredCodes.value,
                        name: "已过期",
                        itemStyle: { color: "#F56C6C" },
                    },
                ],
            },
        ],
    };

    chartInstance.setOption(option);
};

// 加载数据
const loadData = async () => {
    try {
        // 获取统计数据
        const statsResponse = await activationApi.getStats();

        if (statsResponse.data && statsResponse.data.status === 0) {
            const overview = statsResponse.data.data?.overview || {};

            totalCodes.value = overview.totalCodes || 0;
            activeCodes.value = overview.usedCodes || 0;
            pendingCodes.value = overview.unusedCodes || 0;
            expiredCodes.value = overview.expiredCodes || 0;
        } else {
            // 如果API失败，使用模拟数据
            totalCodes.value = 150;
            activeCodes.value = 89;
            pendingCodes.value = 45;
            expiredCodes.value = 16;
        }
    } catch (error) {
        console.error("加载统计数据失败:", error);
        ElMessage.warning("加载统计数据失败，使用模拟数据");

        // 使用模拟数据
        totalCodes.value = 150;
        activeCodes.value = 89;
        pendingCodes.value = 45;
        expiredCodes.value = 16;
    }

    // 更新图表
    await nextTick();
    updateChart();

    // 刷新列表
    if (codeListRef.value) {
        codeListRef.value.loadCodes();
    }
};

// 处理生成激活码完成
const handleGenerated = () => {
    loadData();
};

// 生命周期
onMounted(async () => {
    await loadData();
    await nextTick();
    initChart();

    // 监听窗口大小变化
    window.addEventListener("resize", () => {
        if (chartInstance) {
            chartInstance.resize();
        }
    });
});
</script>

<style scoped>
.dashboard {
    padding: 0;
}

/* 操作按钮区域 */
.action-section {
    margin-bottom: 20px;
    display: flex;
    gap: 15px;
}

.action-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
}

.action-icon {
    font-size: 16px;
}

.action-text {
    font-size: 14px;
}

/* 统计卡片区域 */
.stats-section {
    margin-bottom: 20px;
}

.stat-card {
    transition: all 0.3s;
    cursor: pointer;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 15px;
}

.stat-icon {
    font-size: 32px;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
}

.stat-icon.total {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.stat-icon.active {
    background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
    color: white;
}

.stat-icon.pending {
    background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
    color: white;
}

.stat-icon.expired {
    background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
    color: white;
}

.stat-number {
    font-size: 28px;
    font-weight: 700;
    color: #303133;
    margin-bottom: 4px;
}

.stat-label {
    font-size: 14px;
    color: #909399;
    font-weight: 500;
}

/* 图表区域 */
.chart-section {
    margin-bottom: 20px;
}

.chart-container {
    height: 400px;
    width: 100%;
}

.card-header {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

/* 列表区域 */
.list-section {
    margin-bottom: 20px;
}

/* 全局样式 */
:deep(.el-card) {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: none;
}

:deep(.el-card__header) {
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
    padding: 15px 20px;
}

:deep(.el-card__body) {
    padding: 20px;
}
</style>
