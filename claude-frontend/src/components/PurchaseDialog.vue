<template>
    <el-dialog
        v-model="visible"
        title="站内购买"
        width="900px"
        :close-on-click-modal="false"
        class="purchase-dialog"
        @closed="resetForm"
    >
        <div class="purchase-flow">
            <!-- 步骤指示器 -->
            <div class="purchase-steps">
                <div class="step-header">
                    <h2>购买流程</h2>
                </div>
                <div class="steps-container">
                    <div class="step-item" :class="{ active: currentStep >= 0 }">
                        <div class="step-number">1</div>
                        <div class="step-info">
                            <div class="step-title">选择套餐</div>
                            <div class="step-desc">选择你想使用的套餐</div>
                        </div>
                    </div>
                    <div class="step-item" :class="{ active: currentStep >= 1 }">
                        <div class="step-number">2</div>
                        <div class="step-info">
                            <div class="step-title">支付套餐</div>
                            <div class="step-desc">支付后，请不要手动关闭弹窗</div>
                        </div>
                    </div>
                    <div class="step-item" :class="{ active: currentStep >= 2 }">
                        <div class="step-number">3</div>
                        <div class="step-info">
                            <div class="step-title">使用服务</div>
                            <div class="step-desc">在车队列表，选车使用</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 套餐选择区域 -->
            <div class="package-selection">
                <div class="selection-left">
                    <div class="section-title">订阅套餐</div>

                    <!-- 订阅类型 -->
                    <div class="subscription-type">
                        <div class="type-label">订阅类型</div>
                        <div class="type-tabs">
                            <button
                                v-for="type in subscriptionTypes"
                                :key="type.id"
                                class="type-tab"
                                :class="{ active: selectedSubscriptionType === type.code }"
                                @click="selectedSubscriptionType = type.code"
                            >{{ type.name }}</button>
                        </div>
                        <div
                            class="type-desc"
                        >{{ subscriptionTypes.find(t => t.code === selectedSubscriptionType)?.description || 'ChatGPT & Claude' }}</div>
                    </div>

                    <!-- 有效天数 -->
                    <div class="duration-section">
                        <div class="duration-label">有效天数</div>
                        <div class="duration-grid">
                            <button
                                v-for="option in availableDurations"
                                :key="option.days"
                                class="duration-btn"
                                :class="{ active: selectedDuration === option.days }"
                                @click="selectedDuration = option.days"
                            >{{ option.label }}</button>
                        </div>
                    </div>

                    <!-- 支付方式 -->
                    <div class="payment-method">
                        <div class="payment-label">选择支付方式</div>
                        <button
                            v-for="method in paymentMethods"
                            :key="method.id"
                            class="payment-btn"
                            :class="{ active: selectedPaymentMethod === method.code }"
                            @click="selectedPaymentMethod = method.code"
                        >
                            <svg class="payment-icon" viewBox="0 0 24 24" width="20" height="20">
                                <path
                                    fill="currentColor"
                                    d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"
                                />
                            </svg>
                            {{ method.name }}
                        </button>
                    </div>
                </div>

                <div class="selection-right">
                    <div class="section-title">订阅套餐</div>

                    <!-- 套餐卡片 -->
                    <div class="package-card" v-if="selectedPackage">
                        <div class="package-icon">
                            <svg viewBox="0 0 24 24" width="32" height="32">
                                <path
                                    fill="#FF6B35"
                                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                />
                            </svg>
                        </div>
                        <div class="package-name">{{ selectedPackage.name }}</div>
                        <div class="package-price">
                            <span class="price-symbol">¥</span>
                            <span class="price-amount">{{ selectedPackage.price }}</span>
                            <span class="price-unit">/ {{ selectedDuration }}天</span>
                        </div>

                        <div class="package-features" v-if="selectedPackage.features">
                            <!-- 专属功能 -->
                            <div class="feature-section" v-if="selectedPackage.features['专属功能']">
                                <div class="feature-title">专属功能</div>
                                <div class="feature-list">
                                    <div
                                        class="feature-item"
                                        v-for="feature in selectedPackage.features['专属功能']"
                                        :key="feature"
                                    >
                                        <svg
                                            class="check-icon"
                                            viewBox="0 0 24 24"
                                            width="16"
                                            height="16"
                                        >
                                            <path
                                                fill="#22C55E"
                                                d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                                            />
                                        </svg>
                                        {{ feature }}
                                    </div>
                                </div>
                            </div>

                            <!-- 服务保障 -->
                            <div class="feature-section" v-if="selectedPackage.features['服务保障']">
                                <div class="feature-list">
                                    <div
                                        class="feature-item"
                                        v-for="feature in selectedPackage.features['服务保障']"
                                        :key="feature"
                                    >
                                        <svg
                                            class="check-icon"
                                            viewBox="0 0 24 24"
                                            width="16"
                                            height="16"
                                        >
                                            <path
                                                fill="#22C55E"
                                                d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                                            />
                                        </svg>
                                        {{ feature }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 如果没有数据，显示加载中 -->
                        <div v-else-if="loading" class="loading-features">
                            <el-skeleton :rows="3" animated />
                        </div>
                    </div>

                    <!-- 没有选中套餐时显示提示 -->
                    <div v-else class="no-package">
                        <div v-if="loading">
                            <el-skeleton :rows="5" animated />
                        </div>
                        <div v-else>请选择套餐类型和时长</div>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="closeDialog" class="cancel-btn" :disabled="loading">取消</el-button>
                <el-button
                    type="primary"
                    @click="proceedToPayment"
                    :disabled="!canProceedToPayment || loading"
                    :loading="loading"
                    class="confirm-btn"
                >确认订单</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import PackagesAPI from "@/api/packages";

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false,
    },
});

// Emits
const emit = defineEmits(["update:modelValue", "purchase-success"]);

// 响应式数据
const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
});

const currentStep = ref(0);
const selectedSubscriptionType = ref("claude");
const selectedDuration = ref(1);
const selectedPaymentMethod = ref("alipay");
const loading = ref(false);

// 从数据库获取的数据
const subscriptionTypes = ref([]);
const durationOptions = ref([]);
const packages = ref([]);
const paymentMethods = ref([]);

// 计算属性
const selectedPackage = computed(() => {
    if (!packages.value.length) return null;

    return (
        packages.value.find(
            (pkg) =>
                pkg.type_code === selectedSubscriptionType.value &&
                pkg.duration_days === selectedDuration.value
        ) || null
    );
});

const canProceedToPayment = computed(() => {
    return (
        selectedSubscriptionType.value &&
        selectedDuration.value &&
        selectedPackage.value &&
        selectedPaymentMethod.value
    );
});

// 获取当前选中类型的可用时长
const availableDurations = computed(() => {
    if (!packages.value.length) return [];

    const currentTypePackages = packages.value.filter(
        (pkg) => pkg.type_code === selectedSubscriptionType.value
    );
    const durations = currentTypePackages.map((pkg) => ({
        days: pkg.duration_days,
        label: pkg.duration_name,
    }));

    // 去重并排序
    return durations
        .filter(
            (duration, index, self) =>
                index === self.findIndex((d) => d.days === duration.days)
        )
        .sort((a, b) => a.days - b.days);
});

// 获取数据的方法
const loadPurchaseData = async () => {
    try {
        console.log("开始加载购买数据...");
        loading.value = true;
        const response = await PackagesAPI.getPurchaseData();
        console.log("API响应:", response);

        // 直接使用response数据，不检查success字段
        if (response && response.types && response.products) {
            subscriptionTypes.value = response.types;
            durationOptions.value = response.durations;
            packages.value = response.products;
            paymentMethods.value = response.paymentMethods;

            console.log("加载的数据:", {
                types: subscriptionTypes.value,
                durations: durationOptions.value,
                products: packages.value,
                paymentMethods: paymentMethods.value,
            });

            // 设置默认选择
            if (subscriptionTypes.value.length > 0) {
                const claudeType = subscriptionTypes.value.find(
                    (type) => type.code === "claude"
                );
                if (claudeType) {
                    selectedSubscriptionType.value = claudeType.code;
                } else {
                    selectedSubscriptionType.value =
                        subscriptionTypes.value[0].code;
                }
            }

            if (availableDurations.value.length > 0) {
                selectedDuration.value = availableDurations.value[0].days;
            }

            if (paymentMethods.value.length > 0) {
                selectedPaymentMethod.value = paymentMethods.value[0].code;
            }

            console.log("默认选择设置完成:", {
                type: selectedSubscriptionType.value,
                duration: selectedDuration.value,
                payment: selectedPaymentMethod.value,
            });
        } else {
            console.error("API返回数据格式错误:", response);
            ElMessage.error("加载购买数据失败，数据格式错误");
        }
    } catch (error) {
        console.error("加载购买数据失败:", error);
        ElMessage.error("加载购买数据失败，请刷新重试");
    } finally {
        loading.value = false;
    }
};

// 当订阅类型改变时，重置时长选择
watch(selectedSubscriptionType, () => {
    if (availableDurations.value.length > 0) {
        selectedDuration.value = availableDurations.value[0].days;
    }
});

// 方法
const proceedToPayment = async () => {
    if (!canProceedToPayment.value) {
        ElMessage.warning("请完成所有选项");
        return;
    }

    try {
        loading.value = true;
        ElMessage.info("正在创建订单...");

        const paymentMethod = paymentMethods.value.find(
            (pm) => pm.code === selectedPaymentMethod.value
        );

        const response = await PackagesAPI.createOrder(
            selectedPackage.value.id,
            paymentMethod.id
        );

        if (response.success) {
            ElMessage.success(
                "订单创建成功！激活码：" + response.data.activation_code
            );
            emit("purchase-success", response.data);
            closeDialog();
        } else {
            ElMessage.error(response.message || "创建订单失败");
        }
    } catch (error) {
        console.error("创建支付订单失败:", error);
        ElMessage.error("创建订单失败，请重试");
    } finally {
        loading.value = false;
    }
};

const closeDialog = () => {
    visible.value = false;
};

const resetForm = () => {
    currentStep.value = 0;
    if (subscriptionTypes.value.length > 0) {
        const claudeType = subscriptionTypes.value.find(
            (type) => type.code === "claude"
        );
        selectedSubscriptionType.value = claudeType
            ? claudeType.code
            : subscriptionTypes.value[0].code;
    }
    if (availableDurations.value.length > 0) {
        selectedDuration.value = availableDurations.value[0].days;
    }
    if (paymentMethods.value.length > 0) {
        selectedPaymentMethod.value = paymentMethods.value[0].code;
    }
};

// 组件挂载时加载数据
onMounted(() => {
    loadPurchaseData();
});
</script>

<style scoped>
/* 弹窗样式 */
.purchase-dialog :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
}

.purchase-dialog :deep(.el-dialog__header) {
    padding: 24px 24px 0;
    border-bottom: none;
}

.purchase-dialog :deep(.el-dialog__title) {
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
}

.purchase-dialog :deep(.el-dialog__body) {
    padding: 0 24px 24px;
}

.purchase-dialog :deep(.el-dialog__footer) {
    padding: 16px 24px 24px;
    border-top: 1px solid #f3f4f6;
}

/* 主容器 */
.purchase-flow {
    display: flex;
    flex-direction: column;
    gap: 32px;
}

/* 步骤指示器 */
.purchase-steps {
    background: #f9fafb;
    border-radius: 12px;
    padding: 24px;
}

.step-header h2 {
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
}

.steps-container {
    display: flex;
    justify-content: space-between;
    position: relative;
}

.step-item {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    position: relative;
}

.step-item:not(:last-child)::after {
    content: "";
    position: absolute;
    right: -50%;
    top: 20px;
    width: 100%;
    height: 2px;
    background: #e5e7eb;
    z-index: 1;
}

.step-item.active:not(:last-child)::after {
    background: #3b82f6;
}

.step-number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #e5e7eb;
    color: #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    position: relative;
    z-index: 2;
    flex-shrink: 0;
}

.step-item.active .step-number {
    background: #3b82f6;
    color: white;
}

.step-info {
    flex: 1;
}

.step-title {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
}

.step-desc {
    font-size: 12px;
    color: #6b7280;
    line-height: 1.4;
}

/* 套餐选择区域 */
.package-selection {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
}

.section-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 24px;
}

/* 左侧选择区域 */
.selection-left {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

/* 订阅类型 */
.subscription-type {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.type-label {
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
}

.type-tabs {
    display: flex;
    gap: 12px;
}

.type-tab {
    flex: 1;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    color: #6b7280;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.type-tab.active {
    border-color: #8b5cf6;
    background: #8b5cf6;
    color: white;
}

.type-desc {
    font-size: 12px;
    color: #6b7280;
    text-align: center;
}

/* 有效天数 */
.duration-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.duration-label {
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
}

.duration-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
}

.duration-btn {
    padding: 12px 8px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    color: #6b7280;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
}

.duration-btn.active {
    border-color: #8b5cf6;
    background: #8b5cf6;
    color: white;
}

.duration-btn:hover:not(.active) {
    border-color: #d1d5db;
    background: #f9fafb;
}

/* 支付方式 */
.payment-method {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.payment-label {
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
}

.payment-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    color: #1f2937;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.payment-btn.active {
    border-color: #3b82f6;
    background: #eff6ff;
    color: #1d4ed8;
}

.payment-icon {
    width: 20px;
    height: 20px;
    color: #3b82f6;
}

/* 右侧套餐卡片 */
.selection-right {
    display: flex;
    flex-direction: column;
}

.package-card {
    border: 2px solid #e5e7eb;
    border-radius: 16px;
    padding: 24px;
    background: white;
    transition: all 0.2s;
    height: fit-content;
}

.package-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.package-icon {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
}

.package-name {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    text-align: center;
    margin-bottom: 16px;
}

.package-price {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 4px;
    margin-bottom: 24px;
}

.price-symbol {
    font-size: 20px;
    font-weight: 600;
    color: #f59e0b;
}

.price-amount {
    font-size: 28px;
    font-weight: 700;
    color: #f59e0b;
}

.price-unit {
    font-size: 14px;
    color: #6b7280;
}

/* 功能特性 */
.package-features {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.feature-section {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
}

.feature-title {
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 12px;
}

.feature-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.feature-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #1f2937;
}

.check-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
}

/* 底部按钮 */
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.cancel-btn {
    padding: 8px 20px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    color: #6b7280;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.cancel-btn:hover {
    background: #f9fafb;
    border-color: #9ca3af;
}

.confirm-btn {
    padding: 8px 20px;
    border: none;
    border-radius: 6px;
    background: #3b82f6;
    color: white;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.confirm-btn:hover:not(:disabled) {
    background: #2563eb;
}

.confirm-btn:disabled {
    background: #d1d5db;
    color: #9ca3af;
    cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .package-selection {
        grid-template-columns: 1fr;
        gap: 24px;
    }

    .duration-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .steps-container {
        flex-direction: column;
        gap: 16px;
    }

    .step-item::after {
        display: none;
    }
}
</style>
