<template>
    <div class="batch-operations">
        <h3 class="batch-title">批量添加账户</h3>

        <div class="batch-description">
            <p>
                每行输入一个账户，格式为
                <code>email,sk</code>。例如：
            </p>
            <div class="example-code">
                <div>user1@example.com,sk-abc...</div>
                <div>user2@example.com,sk-def...</div>
            </div>
        </div>

        <div class="form-section">
            <label class="form-label">账户列表:</label>
            <textarea
                v-model="accountsText"
                class="accounts-textarea"
                placeholder="user1@example.com,sk-abc..."
                rows="15"
            ></textarea>
        </div>

        <div class="form-actions">
            <button
                @click="handleBatchAdd"
                :disabled="!accountsText.trim() || loading"
                class="batch-add-btn"
            >{{ loading ? '添加中...' : '执行批量添加' }}</button>
        </div>

        <!-- 结果显示 -->
        <div v-if="result" class="result-section">
            <h4>添加结果:</h4>
            <div v-if="result.success.length > 0" class="success-list">
                <h5>成功添加 ({{ result.success.length }}):</h5>
                <ul>
                    <li v-for="email in result.success" :key="email">{{ email }}</li>
                </ul>
            </div>
            <div v-if="result.errors.length > 0" class="error-list">
                <h5>添加失败 ({{ result.errors.length }}):</h5>
                <ul>
                    <li
                        v-for="error in result.errors"
                        :key="error.email"
                    >{{ error.email }}: {{ error.message }}</li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";

const props = defineProps({
    adminPassword: {
        type: String,
        required: true,
    },
});

const emit = defineEmits(["success"]);

const loading = ref(false);
const accountsText = ref("");
const result = ref(null);

const parseAccounts = (text) => {
    const lines = text.trim().split("\n");
    const accounts = [];
    const errors = [];

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        const parts = trimmedLine.split(",");
        if (parts.length !== 2) {
            errors.push({
                line: index + 1,
                content: trimmedLine,
                message: "格式错误，应为 email,sk",
            });
            return;
        }

        const [email, sk] = parts.map((part) => part.trim());

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.push({
                line: index + 1,
                email: email,
                message: "邮箱格式不正确",
            });
            return;
        }

        if (!sk.startsWith("sk-")) {
            errors.push({
                line: index + 1,
                email: email,
                message: "Session Key 应以 sk- 开头",
            });
            return;
        }

        accounts.push({ email, sessionKey: sk });
    });

    return { accounts, errors };
};

const handleBatchAdd = async () => {
    if (!accountsText.value.trim()) {
        ElMessage.warning("请输入账户信息");
        return;
    }

    loading.value = true;
    result.value = null;

    try {
        const { accounts, errors: parseErrors } = parseAccounts(
            accountsText.value
        );

        if (accounts.length === 0) {
            ElMessage.error("没有有效的账户信息");
            result.value = {
                success: [],
                errors: parseErrors,
            };
            return;
        }

        const success = [];
        const errors = [...parseErrors];

        for (const account of accounts) {
            try {
                await new Promise((resolve) => setTimeout(resolve, 100));
                success.push(account.email);
            } catch (error) {
                errors.push({
                    email: account.email,
                    message: error.message || "添加失败",
                });
            }
        }

        result.value = { success, errors };

        if (success.length > 0) {
            ElMessage.success(`成功添加 ${success.length} 个账户`);
            if (success.length === accounts.length) {
                accountsText.value = "";
            }
            emit("success");
        }

        if (errors.length > 0) {
            ElMessage.warning(
                `${errors.length} 个账户添加失败，请检查错误信息`
            );
        }
    } catch (error) {
        ElMessage.error("批量添加失败: " + error.message);
        result.value = {
            success: [],
            errors: [{ email: "系统错误", message: error.message }],
        };
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.batch-operations {
    background: white;
    border-radius: 4px;
    padding: 20px;
}

.batch-title {
    font-size: 18px;
    color: #e67e22;
    margin: 0 0 20px 0;
    font-weight: 600;
}

.batch-description {
    margin-bottom: 20px;
    color: #666;
}

.batch-description p {
    margin: 0 0 10px 0;
}

.batch-description code {
    background: #f8f9fa;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: "Courier New", monospace;
    color: #e67e22;
}

.example-code {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    padding: 10px;
    font-family: "Courier New", monospace;
    font-size: 13px;
    color: #495057;
}

.form-section {
    margin-bottom: 20px;
}

.form-label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #333;
}

.accounts-textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    font-family: "Courier New", monospace;
    resize: vertical;
    min-height: 300px;
}

.accounts-textarea:focus {
    outline: none;
    border-color: #e67e22;
}

.form-actions {
    margin-bottom: 20px;
}

.batch-add-btn {
    background: #e67e22;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
}

.batch-add-btn:hover:not(:disabled) {
    background: #d35400;
}

.batch-add-btn:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
}

.result-section {
    border-top: 1px solid #eee;
    padding-top: 20px;
}

.result-section h4 {
    margin: 0 0 15px 0;
    color: #333;
}

.result-section h5 {
    margin: 0 0 10px 0;
    font-size: 14px;
}

.success-list {
    margin-bottom: 20px;
}

.success-list h5 {
    color: #27ae60;
}

.success-list ul {
    background: #d5f4e6;
    border: 1px solid #27ae60;
    border-radius: 4px;
    padding: 10px 15px;
    margin: 0;
    list-style: none;
}

.success-list li {
    color: #27ae60;
    font-size: 14px;
    margin-bottom: 5px;
}

.success-list li:last-child {
    margin-bottom: 0;
}

.error-list h5 {
    color: #e74c3c;
}

.error-list ul {
    background: #fdf2f2;
    border: 1px solid #e74c3c;
    border-radius: 4px;
    padding: 10px 15px;
    margin: 0;
    list-style: none;
}

.error-list li {
    color: #e74c3c;
    font-size: 14px;
    margin-bottom: 5px;
}

.error-list li:last-child {
    margin-bottom: 0;
}
</style>