<template>
    <div class="claude-dashboard-desktop">
        <!-- 顶部导航栏 -->
        <header class="desktop-header">
            <div class="header-left">
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
            </div>

            <div class="header-right">
                <!-- 兑换码按钮 -->
                <button class="redeem-btn" @click="showRedeemDialog = true">兑换码</button>
                <!-- 状态信息 -->
                <div class="status-info">
                    <span class="expire-text">{{ membershipExpireText }}</span>
                </div>

                <!-- 用户头像菜单 -->
                <div class="user-menu" @click="toggleUserMenu">
                    <el-avatar
                        :src="userInfo.avatar"
                        :alt="userInfo.username"
                        :size="40"
                        shape="circle"
                        class="user-avatar"
                        @error="handleAvatarError"
                    >{{ userInfo.username ? userInfo.username.charAt(0).toUpperCase() : 'U' }}</el-avatar>
                    <div v-if="showUserMenu" class="user-dropdown">
                        <div class="dropdown-item" @click="showProfileDialog = true">个人中心</div>
                        <div class="dropdown-item" @click="showPasswordDialog = true">修改密码</div>
                        <div class="dropdown-item" @click="showEmailDialog = true">修改邮箱</div>
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-item logout" @click="handleLogout">退出登录</div>
                    </div>
                </div>
            </div>
        </header>

        <!-- 主布局容器 -->
        <div class="main-layout">
            <!-- 左侧边栏 -->
            <aside class="sidebar">
                <div class="sidebar-content">
                    <!-- 推广信息 -->
                    <div class="sidebar-section">
                        <div class="promo-card">
                            <div class="promo-icon">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    fill="currentColor"
                                    viewBox="0 0 256 256"
                                >
                                    <path
                                        d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z"
                                    />
                                </svg>
                            </div>
                            <div class="promo-content">
                                <p>推广的用户好评选择优质体验，从这里开始</p>
                                <p class="contact">客服微信 LL32556188</p>
                                <p class="notice">在使用账号过程中，请您注意，由于我们无法预知和控制可能存在的官方封问题。</p>
                                <p
                                    class="warning"
                                >如果您认为对话内容更重要，强烈建议您备行存储您的价值存，在此特别提醒，如果未来存储您的市交易数据丢失，我们无法承担。希望能理解并配合！</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <!-- 主内容区 -->
            <main class="main-content">
                <!-- 搜索栏 -->
                <div class="search-section">
                    <div class="search-bar">
                        <input type="text" placeholder="搜索账号..." class="search-input" />
                        <button class="search-btn">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                viewBox="0 0 256 256"
                            >
                                <path
                                    d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"
                                />
                            </svg>
                        </button>
                        <button class="refresh-btn-main" @click="refreshAccounts">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                viewBox="0 0 256 256"
                            >
                                <path
                                    d="M197.67,186.37a8,8,0,0,1,0,11.29C196.58,198.73,170.82,224,128,224c-37.39,0-64.53-22.4-80-39.85V208a8,8,0,0,1-16,0V160a8,8,0,0,1,8-8H88a8,8,0,0,1,0,16H55.44C67.76,183.35,93,208,128,208c36.72,0,58.4-21.15,58.4-21.15A8,8,0,0,1,197.67,186.37ZM216,40a8,8,0,0,0-8,8V71.85C192.53,54.4,165.39,32,128,32,85.18,32,59.42,57.27,58.33,58.34a8,8,0,0,0,11.34,11.32S91.28,48,128,48c35,0,60.24,24.65,72.56,40H168a8,8,0,0,0,0,16h48a8,8,0,0,0,8-8V48A8,8,0,0,0,216,40Z"
                                />
                            </svg>
                        </button>
                        <button class="random-login-btn" @click="handleRandomLogin">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                viewBox="0 0 256 256"
                            >
                                <path
                                    d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z"
                                />
                            </svg>
                            随机登录
                        </button>
                    </div>

                    <!-- 标签栏 -->
                    <div class="tabs-section">
                        <div class="tab-item">
                            <span>Claude</span>
                        </div>
                    </div>
                </div>

                <!-- Claude账号列表 -->
                <div class="accounts-section">
                    <div class="accounts-header">
                        <h2 class="accounts-title">可用账号</h2>
                    </div>

                    <!-- 加载状态 -->
                    <div v-if="loading" class="loading-container">
                        <div class="loading-text">正在加载账号列表...</div>
                    </div>

                    <!-- 错误状态 -->
                    <div v-else-if="error" class="error-container">
                        <div class="error-text">加载失败，请重试</div>
                        <button class="retry-btn" @click="refreshAccounts">重新加载</button>
                    </div>

                    <!-- 账号网格 -->
                    <div v-else class="accounts-grid-desktop">
                        <div
                            v-for="account in accounts"
                            :key="account.id || account.email"
                            class="account-card-desktop"
                            @click="handleAccountClick(account)"
                        >
                            <!-- Claude 图标装饰 -->
                            <div class="card-decoration">
                                <svg viewBox="0 0 24 24" class="claude-icon">
                                    <path
                                        d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z"
                                        fill="#D97757"
                                        fill-rule="nonzero"
                                    />
                                </svg>
                            </div>

                            <!-- 卡片内容 -->
                            <div class="card-content">
                                <!-- 顶部信息 -->
                                <div class="card-header">
                                    <div
                                        class="account-name-new"
                                    >{{ account.name || account.email.split('@')[0] }}</div>
                                </div>

                                <!-- 底部状态 -->
                                <div class="card-footer">
                                    <div class="status-indicator">
                                        <div class="status-dot"></div>
                                        <span class="status-text">空闲</span>
                                        <span class="email-text">{{ getMaskedEmail(account.email) }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 空状态 -->
                    <div v-if="!loading && !error && accounts.length === 0" class="empty-state">
                        <div class="empty-icon">📝</div>
                        <div class="empty-text">暂无可用账号</div>
                        <button class="refresh-btn" @click="refreshAccounts">刷新列表</button>
                    </div>
                </div>
            </main>
        </div>

        <!-- 兑换码弹窗 -->
        <div v-if="showRedeemDialog" class="modal-overlay" @click="showRedeemDialog = false">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>兑换码兑换</h3>
                    <button class="close-btn" @click="showRedeemDialog = false">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>请输入兑换码</label>
                        <input
                            v-model="redeemCode"
                            type="text"
                            placeholder="请输入兑换码"
                            class="claude-input"
                        />
                    </div>
                </div>
                <div class="modal-footer">
                    <button
                        class="claude-btn claude-btn-secondary"
                        @click="showRedeemDialog = false"
                    >取消</button>
                    <button class="claude-btn claude-btn-primary" @click="handleRedeem">立即兑换</button>
                </div>
            </div>
        </div>

        <!-- 个人中心弹窗 -->
        <div v-if="showProfileDialog" class="modal-overlay" @click="showProfileDialog = false">
            <div class="modal-content large" @click.stop>
                <div class="modal-header">
                    <h3>个人中心</h3>
                    <button class="close-btn" @click="showProfileDialog = false">×</button>
                </div>
                <div class="modal-body">
                    <div class="profile-tabs">
                        <button
                            v-for="tab in profileTabs"
                            :key="tab.key"
                            class="tab-btn"
                            :class="{ active: activeTab === tab.key }"
                            @click="activeTab = tab.key"
                        >{{ tab.label }}</button>
                    </div>

                    <div class="tab-content">
                        <!-- 基本信息 -->
                        <div v-if="activeTab === 'basic'" class="tab-panel">
                            <div class="user-basic-info">
                                <div class="avatar-section">
                                    <img
                                        :src="userInfo.avatar"
                                        :alt="userInfo.username"
                                        class="large-avatar"
                                    />
                                </div>
                                <div class="info-section">
                                    <div class="info-row">
                                        <label>用户名</label>
                                        <span>{{ userInfo.username }}</span>
                                    </div>
                                    <div class="info-row">
                                        <label>邮箱</label>
                                        <span>{{ userInfo.email }}</span>
                                    </div>
                                    <div class="info-row">
                                        <label>注册时间</label>
                                        <span>{{ userInfo.registerDate }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 兑换记录 -->
                        <div v-if="activeTab === 'redemption'" class="tab-panel">
                            <div class="redemption-list">
                                <div class="redemption-header">
                                    <h4>兑换记录</h4>
                                    <button class="refresh-btn" @click="fetchRedemptionRecords">刷新</button>
                                </div>

                                <div v-if="redemptionRecords.length === 0" class="empty-state">
                                    <div class="empty-icon">📝</div>
                                    <div class="empty-text">暂无兑换记录</div>
                                    <button
                                        class="claude-btn claude-btn-primary"
                                        @click="showRedeemDialog = true"
                                    >立即兑换</button>
                                </div>

                                <div v-else class="redemption-table">
                                    <div class="table-header">
                                        <div class="col-code">兑换码</div>
                                        <div class="col-time">兑换时间</div>
                                        <div class="col-status">状态</div>
                                        <div class="col-remark">备注</div>
                                    </div>

                                    <div
                                        v-for="record in redemptionRecords"
                                        :key="record.id"
                                        class="table-row"
                                    >
                                        <div class="col-code">
                                            <span class="code-text">{{ record.code }}</span>
                                        </div>
                                        <div
                                            class="col-time"
                                        >{{ formatDateTime(record.redeemTime) }}</div>
                                        <div class="col-status">
                                            <span
                                                class="status-badge"
                                                :class="`status-${record.status}`"
                                            >{{ record.statusText }}</span>
                                        </div>
                                        <div class="col-remark">{{ record.remark }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 修改密码弹窗 -->
        <div v-if="showPasswordDialog" class="modal-overlay" @click="showPasswordDialog = false">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>修改密码</h3>
                    <button class="close-btn" @click="showPasswordDialog = false">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>当前密码</label>
                        <input
                            v-model="passwordForm.currentPassword"
                            type="password"
                            class="form-input"
                            placeholder="请输入当前密码"
                        />
                    </div>
                    <div class="form-group">
                        <label>新密码</label>
                        <input
                            v-model="passwordForm.newPassword"
                            type="password"
                            class="form-input"
                            placeholder="请输入新密码"
                        />
                    </div>
                    <div class="form-group">
                        <label>确认新密码</label>
                        <input
                            v-model="passwordForm.confirmPassword"
                            type="password"
                            class="form-input"
                            placeholder="请再次输入新密码"
                        />
                    </div>
                </div>
                <div class="modal-footer">
                    <button
                        class="claude-btn claude-btn-secondary"
                        @click="showPasswordDialog = false"
                    >取消</button>
                    <button class="claude-btn claude-btn-primary" @click="handleChangePassword">确认修改</button>
                </div>
            </div>
        </div>

        <!-- 修改邮箱弹窗 -->
        <div v-if="showEmailDialog" class="modal-overlay" @click="showEmailDialog = false">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>修改邮箱</h3>
                    <button class="close-btn" @click="showEmailDialog = false">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>当前邮箱</label>
                        <input :value="userInfo.email" type="email" class="form-input" disabled />
                    </div>
                    <div class="form-group">
                        <label>新邮箱</label>
                        <input
                            v-model="emailForm.newEmail"
                            type="email"
                            class="form-input"
                            placeholder="请输入新邮箱地址"
                        />
                    </div>
                    <div class="form-group">
                        <label>验证码</label>
                        <div class="verification-input">
                            <input
                                v-model="emailForm.verificationCode"
                                type="text"
                                class="form-input"
                                placeholder="请输入验证码"
                            />
                            <button class="send-code-btn" @click="sendVerificationCode">发送验证码</button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button
                        class="claude-btn claude-btn-secondary"
                        @click="showEmailDialog = false"
                    >取消</button>
                    <button class="claude-btn claude-btn-primary" @click="handleChangeEmail">确认修改</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { ElMessage } from "element-plus";
import { claudeUsersService } from "@/api/claude-users";
import { authApi } from "@/api/auth";

const router = useRouter();
const authStore = useAuthStore();

// 响应式数据
const showRedeemDialog = ref(false);
const showProfileDialog = ref(false);
const showPasswordDialog = ref(false);
const showEmailDialog = ref(false);
const showUserMenu = ref(false);
const redeemCode = ref("");
const activeTab = ref("basic");

// 账号列表相关数据
const accounts = ref([]);
const loading = ref(false);
const error = ref(false);

// 修改密码表单
const passwordForm = ref({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
});

// 修改邮箱表单
const emailForm = ref({
    newEmail: "",
    verificationCode: "",
});

// 用户信息
const userInfo = computed(
    () =>
        authStore.userInfo || {
            username: "admin",
            email: "admin@example.com",
            avatar: "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
            registerDate: "2024-01-01",
        }
);

// 会员过期时间文本
const membershipExpireText = computed(() => {
    const membership = authStore.membership;
    if (!membership || !membership.membership_expires_at) {
        return "有效期 未激活";
    }

    const expiresAt = new Date(membership.membership_expires_at);
    const now = new Date();

    if (expiresAt <= now) {
        return "有效期 已过期";
    }

    // 格式化时间为 YYYY-MM-DD HH:mm:ss
    const year = expiresAt.getFullYear();
    const month = String(expiresAt.getMonth() + 1).padStart(2, "0");
    const day = String(expiresAt.getDate()).padStart(2, "0");
    const hours = String(expiresAt.getHours()).padStart(2, "0");
    const minutes = String(expiresAt.getMinutes()).padStart(2, "0");
    const seconds = String(expiresAt.getSeconds()).padStart(2, "0");

    return `有效期 ${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
});

// 个人中心标签页
const profileTabs = [
    { key: "basic", label: "基本信息" },
    { key: "redemption", label: "兑换记录" },
];

// 兑换记录数据
const redemptionRecords = ref([]);

// 修改密码
const handleChangePassword = async () => {
    if (
        !passwordForm.value.currentPassword ||
        !passwordForm.value.newPassword ||
        !passwordForm.value.confirmPassword
    ) {
        ElMessage.warning("请填写完整的密码信息");
        return;
    }

    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
        ElMessage.warning("两次输入的新密码不一致");
        return;
    }

    if (passwordForm.value.newPassword.length < 6) {
        ElMessage.warning("新密码长度至少6位");
        return;
    }

    try {
        // 调用真实的API
        const response = await authApi.changePassword({
            currentPassword: passwordForm.value.currentPassword,
            newPassword: passwordForm.value.newPassword,
        });

        if (response.status === 0) {
            ElMessage.success("密码修改成功");
            showPasswordDialog.value = false;

            // 重置表单
            passwordForm.value = {
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            };
        } else {
            ElMessage.error(response.message || "密码修改失败");
        }
    } catch (error) {
        ElMessage.error(error.message || "密码修改失败");
    }
};

// 发送验证码
const sendVerificationCode = () => {
    if (!emailForm.value.newEmail) {
        ElMessage.warning("请先输入新邮箱地址");
        return;
    }

    // 模拟发送验证码
    ElMessage.success("验证码已发送到新邮箱");
};

// 修改邮箱
const handleChangeEmail = () => {
    if (!emailForm.value.newEmail || !emailForm.value.verificationCode) {
        ElMessage.warning("请填写完整的邮箱信息");
        return;
    }

    // 模拟API调用
    ElMessage.success("邮箱修改成功");
    showEmailDialog.value = false;

    // 重置表单
    emailForm.value = {
        newEmail: "",
        verificationCode: "",
    };
};

// 获取兑换记录
const fetchRedemptionRecords = async () => {
    try {
        const userInfo = await authStore.fetchCompleteUserInfo();
        if (userInfo && userInfo.activations) {
            redemptionRecords.value = userInfo.activations.map(
                (activation) => ({
                    id: activation.id,
                    code: activation.code,
                    redeemTime: activation.activated_at,
                    status: getRedemptionStatus(activation),
                    statusText: getRedemptionStatusText(activation),
                    type: activation.type,
                    duration: activation.duration_hours,
                    expiresAt: activation.expires_at,
                    remark: getRedemptionRemark(activation),
                })
            );
        }
    } catch {
        ElMessage.error("获取兑换记录失败");
    }
};

// 获取兑换状态
const getRedemptionStatus = (activation) => {
    const now = new Date();
    const expiresAt = new Date(activation.expires_at);

    if (expiresAt > now) {
        return "active";
    } else {
        return "expired";
    }
};

// 获取兑换状态文本
const getRedemptionStatusText = (activation) => {
    const status = getRedemptionStatus(activation);
    const statusMap = {
        active: "有效",
        expired: "已过期",
    };
    return statusMap[status] || "未知";
};

// 获取兑换备注
const getRedemptionRemark = (activation) => {
    const typeMap = {
        daily: "日卡",
        weekly: "周卡",
        monthly: "月卡",
        yearly: "年卡",
        permanent: "永久",
    };
    const typeName = typeMap[activation.type] || activation.type;
    return `${typeName} - ${activation.duration_hours}小时`;
};

// 格式化时间
const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};

// 脱敏邮箱地址
const getMaskedEmail = (email) => {
    if (!email) return "";
    const [localPart, domain] = email.split("@");
    if (!localPart || !domain) return email;

    // 如果本地部分长度小于等于3，只显示第一个字符
    if (localPart.length <= 3) {
        return `${localPart[0]}***@${domain}`;
    }

    // 显示前2个字符和后1个字符，中间用***代替
    const maskedLocal = `${localPart.slice(0, 2)}***${localPart.slice(-1)}`;
    return `${maskedLocal}@${domain}`;
};

// 清理账号名称，去掉数字后缀
const cleanAccountName = (name) => {
    if (!name) return "";
    // 去掉末尾的 #数字 格式，比如 "Claude#3" -> "Claude"
    return name.replace(/#\d+$/, "");
};

const handleRedeem = async () => {
    if (!redeemCode.value.trim()) {
        ElMessage.warning("请输入兑换码");
        return;
    }

    try {
        const result = await authStore.bindActivationCode(
            redeemCode.value.trim()
        );
        if (result.success) {
            showRedeemDialog.value = false;
            redeemCode.value = "";
            // 刷新兑换记录
            await fetchRedemptionRecords();
        }
    } catch {
        // 兑换失败，已通过ElMessage显示错误信息
    }
};

const toggleUserMenu = () => {
    showUserMenu.value = !showUserMenu.value;
};

const handleLogout = async () => {
    await authStore.logout();
    router.push("/login");
};

// 头像加载错误处理
const handleAvatarError = () => {
    // 头像加载失败时，el-avatar 会自动显示 slot 中的内容（用户名首字母）
};

// 获取账号列表
const fetchAccounts = async () => {
    loading.value = true;
    error.value = false;

    try {
        const response = await claudeUsersService.getUserList();

        if (response.status === 0 && response.data) {
            accounts.value = response.data.map((user) => ({
                id: user.id || user.email,
                email: user.email,
                name: cleanAccountName(user.name || user.email.split("@")[0]),
                status: user.status || "active",
                avatar: user.avatar || null,
            }));
        } else {
            throw new Error(response.message || "获取账号列表失败");
        }
    } catch (err) {
        error.value = true;
        ElMessage.error("获取账号列表失败: " + err.message);
    } finally {
        loading.value = false;
    }
};

// 刷新账号列表
const refreshAccounts = () => {
    fetchAccounts();
};

// 随机登录
const handleRandomLogin = async () => {
    try {
        // 1. 首先验证用户的激活码是否过期

        const accessResult = await claudeUsersService.validateUserAccess();

        if (!accessResult.data || !accessResult.data.hasAccess) {
            ElMessage.warning("您的激活码已过期或无效，请重新激活");
            return;
        }

        // 2. 调用pool-backend的随机登录接口
        const poolApiUrl =
            import.meta.env.VITE_CLAUDE_POOL_API_URL || "http://localhost:8787";
        const token = localStorage.getItem("token");

        const loginResponse = await fetch(`${poolApiUrl}/api/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                mode: "random",
                unique_name: `random_user_${Date.now()}`,
                expires_in: 3600,
            }),
        });

        if (!loginResponse.ok) {
            const errorData = await loginResponse.json();
            throw new Error(errorData.error || `HTTP ${loginResponse.status}`);
        }

        const loginData = await loginResponse.json();

        // 优先使用 chat_url（直接聊天），如果没有则使用 login_url
        const targetUrl = loginData.chat_url || loginData.login_url;

        if (targetUrl) {
            // 3. 在新窗口打开Claude聊天界面（绕过登录页面）
            window.open(targetUrl, "_blank");
            ElMessage.success("正在跳转到随机分配的Claude聊天界面");

            // 显示分配的邮箱信息（脱敏后）
            if (loginData.email) {
                ElMessage.info(`已为您分配账号: ${loginData.email}`);
            }

            // 显示警告信息（如果有）
            if (loginData.warning) {
                ElMessage.info(loginData.warning);
            }
        } else {
            throw new Error("未获取到聊天链接");
        }
    } catch (err) {
        // 根据错误类型显示不同的提示
        if (err.message.includes("过期") || err.message.includes("expired")) {
            ElMessage.error("您的激活码已过期，请重新激活");
        } else if (
            err.message.includes("404") ||
            err.message.includes("无可用账号")
        ) {
            ElMessage.error("暂无可用账号，请稍后再试");
        } else if (
            err.message.includes("401") ||
            err.message.includes("权限")
        ) {
            ElMessage.error("您没有访问权限，请联系管理员");
        } else {
            ElMessage.error("随机登录失败: " + err.message);
        }
    }
};

// 处理账号点击
const handleAccountClick = async (account) => {
    try {
        // 1. 首先验证用户的激活码是否过期

        const accessResult = await claudeUsersService.validateUserAccess();

        // 验证访问权限

        if (!accessResult.data || !accessResult.data.hasAccess) {
            ElMessage.warning("您的激活码已过期或无效，请重新激活");
            return;
        }

        // 2. 调用pool-backend的用户登录接口，指定账号登录
        const poolApiUrl =
            import.meta.env.VITE_CLAUDE_POOL_API_URL || "http://localhost:8787";
        const token = localStorage.getItem("token");

        const loginResponse = await fetch(`${poolApiUrl}/api/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                mode: "specific",
                account_id: account.id, // 使用账号ID进行登录
                unique_name: `user_${Date.now()}`,
                expires_in: 3600,
            }),
        });

        if (!loginResponse.ok) {
            const errorData = await loginResponse.json();
            throw new Error(errorData.error || `HTTP ${loginResponse.status}`);
        }

        const loginData = await loginResponse.json();

        // 优先使用 chat_url（直接聊天），如果没有则使用 login_url
        const targetUrl = loginData.chat_url || loginData.login_url;

        if (targetUrl) {
            // 3. 在新窗口打开Claude聊天界面（绕过登录页面）
            window.open(targetUrl, "_blank");
            ElMessage.success(`正在跳转到 ${account.name} 的Claude聊天界面`);

            // 显示分配的邮箱信息（脱敏后）
            if (loginData.email) {
                ElMessage.info(`已为您分配账号: ${loginData.email}`);
            }

            // 显示警告信息（如果有）
            if (loginData.warning) {
                ElMessage.info(loginData.warning);
            }
        } else {
            throw new Error("未获取到聊天链接");
        }
    } catch (err) {
        // 根据错误类型显示不同的提示
        if (err.message.includes("过期") || err.message.includes("expired")) {
            ElMessage.error("您的激活码已过期，请重新激活");
        } else if (
            err.message.includes("404") ||
            err.message.includes("不存在")
        ) {
            ElMessage.error("该账号暂时不可用，请选择其他账号");
        } else if (
            err.message.includes("401") ||
            err.message.includes("权限")
        ) {
            ElMessage.error("您没有访问权限，请联系管理员");
        } else {
            ElMessage.error("登录失败: " + err.message);
        }
    }
};

// 点击外部关闭用户菜单
const handleClickOutside = (event) => {
    if (!event.target.closest(".user-menu")) {
        showUserMenu.value = false;
    }
};

onMounted(() => {
    document.addEventListener("click", handleClickOutside);

    // 初始化时获取会员状态和兑换记录
    authStore.fetchCompleteUserInfo();
    fetchRedemptionRecords();

    // 获取账号列表
    fetchAccounts();
});
</script>

<style scoped>
/* 桌面端Claude.ai风格 - 温暖色调 */
.claude-dashboard-desktop {
    min-height: 100vh;
    width: 100%;
    background: rgb(250, 249, 245);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        sans-serif;
    color: #2d2a26;
    display: flex;
    flex-direction: column;
}

/* 桌面端顶部导航栏 */
.desktop-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    background: rgb(255, 254, 250);
    border-bottom: 1px solid rgb(235, 230, 220);
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 1px 3px rgba(139, 125, 107, 0.1);
}

.header-left {
    display: flex;
    align-items: center;
    gap: 32px;
}

.logo-section {
    display: flex;
    align-items: center;
    gap: 12px;
}

.logo {
    height: 24px;
    color: #8b7d6b;
}

.brand-name {
    font-size: 18px;
    font-weight: 600;
    color: #5d4e37;
    letter-spacing: -0.02em;
}

.top-actions {
    display: flex;
    gap: 16px;
}

.action-btn {
    padding: 8px 16px;
    background: rgb(245, 242, 235);
    border: 1px solid rgb(220, 210, 195);
    border-radius: 6px;
    color: #6b5b47;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.action-btn:hover {
    background: rgb(235, 230, 220);
    border-color: rgb(200, 185, 165);
}

.header-right {
    display: flex;
    align-items: center;
    gap: 16px;
}

.status-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
}

.status-text {
    font-size: 14px;
    font-weight: 600;
    color: #5d4e37;
}

.expire-text {
    font-size: 12px;
    color: #8b7d6b;
}

/* 兑换码按钮 */
.redeem-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #d2691e;
    border: 1px solid #d2691e;
    border-radius: 6px;
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.redeem-btn:hover {
    background: #b8621a;
    border-color: #b8621a;
}

/* 用户菜单 */
.user-menu {
    position: relative;
    cursor: pointer;
}

.user-avatar {
    border: 2px solid rgb(var(--border-300));
    transition: border-color 0.2s;
    cursor: pointer;
}

.user-avatar:hover {
    border-color: rgb(var(--border-200));
}

.user-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    min-width: 200px;
    background: rgb(var(--bg-000));
    border: 1px solid rgb(var(--border-300));
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
    padding: 8px 0;
    z-index: 1000;
}

.dropdown-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    color: rgb(var(--text-100));
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.dropdown-item:hover {
    background: rgb(var(--bg-400));
}

.dropdown-item.logout {
    color: #ef4444;
}

.dropdown-item.logout:hover {
    background: #fef2f2;
}

.dropdown-divider {
    height: 1px;
    background: rgb(var(--border-300));
    margin: 8px 0;
}

/* 主布局容器 */
.main-layout {
    display: flex;
    flex: 1;
    height: calc(100vh - 60px);
}

/* 左侧边栏 */
.sidebar {
    width: 240px;
    background: rgb(255, 254, 250);
    border-right: 1px solid rgb(235, 230, 220);
    overflow-y: auto;
    flex-shrink: 0;
}

.sidebar-content {
    padding: 20px;
}

.sidebar-section {
    margin-bottom: 24px;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgb(245, 242, 235);
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #6b5b47;
}

.promo-card {
    background: rgb(248, 246, 240);
    border: 1px solid rgb(235, 230, 220);
    border-radius: 8px;
    padding: 16px;
}

.promo-icon {
    margin-bottom: 12px;
    color: #d2691e;
}

.promo-content h4 {
    font-size: 16px;
    font-weight: 600;
    color: #5d4e37;
    margin: 0 0 8px 0;
}

.promo-content p {
    font-size: 12px;
    color: #8b7d6b;
    margin: 0 0 8px 0;
    line-height: 1.4;
}

.promo-content .contact {
    color: #d2691e;
    font-weight: 500;
}

.promo-content .notice {
    color: #cd853f;
}

.promo-content .warning {
    color: #a0522d;
}

.language-switch {
    padding: 8px 12px;
    background: rgb(245, 242, 235);
    border-radius: 6px;
    font-size: 14px;
    color: #6b5b47;
    cursor: pointer;
    transition: background-color 0.2s;
}

.language-switch:hover {
    background: rgb(235, 230, 220);
}

/* 主内容区 */
.main-content {
    flex: 1;
    padding: 20px 24px;
    overflow-y: auto;
    background: rgb(250, 249, 245);
    max-width: none;
    width: 100%;
    box-sizing: border-box;
}

/* 搜索栏 */
.search-section {
    margin-bottom: 20px;
}

.search-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
}

.search-input {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid rgb(220, 210, 195);
    border-radius: 6px;
    font-size: 14px;
    background: rgb(255, 254, 250);
    color: #2d2a26;
}

.search-input:focus {
    outline: none;
    border-color: #d2691e;
    box-shadow: 0 0 0 3px rgba(210, 105, 30, 0.1);
}

.search-btn,
.refresh-btn-main {
    padding: 10px 12px;
    background: rgb(255, 254, 250);
    border: 1px solid rgb(220, 210, 195);
    border-radius: 6px;
    color: #8b7d6b;
    cursor: pointer;
    transition: all 0.2s;
}

.search-btn:hover,
.refresh-btn-main:hover {
    background: rgb(245, 242, 235);
    border-color: rgb(200, 185, 165);
}

.random-login-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    background: #d2691e;
    border: 1px solid #d2691e;
    border-radius: 6px;
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.random-login-btn:hover {
    background: #b8621a;
    border-color: #b8621a;
}

/* 标签栏 */
.tabs-section {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
}

.tab-item {
    padding: 8px 16px;
    background: rgb(255, 254, 250);
    border: 1px solid rgb(220, 210, 195);
    border-radius: 6px;
    font-size: 14px;
    color: #8b7d6b;
    cursor: pointer;
    transition: all 0.2s;
}

.tab-item.active {
    background: #d2691e;
    border-color: #d2691e;
    color: #ffffff;
}

.tab-item:hover:not(.active) {
    background: rgb(245, 242, 235);
    border-color: rgb(200, 185, 165);
}

/* 账号列表标题 */
.accounts-header {
    margin-bottom: 16px;
}

.accounts-title {
    font-size: 20px;
    font-weight: 600;
    color: #5d4e37;
    margin: 0;
}

/* 桌面端账号卡片网格 - 固定4列布局 */
.accounts-grid-desktop {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    max-width: none;
}

/* 响应式网格布局 - 保持4列，调整间距 */
@media (min-width: 768px) {
    .accounts-grid-desktop {
        grid-template-columns: repeat(4, 1fr);
        gap: 18px;
    }
}

@media (min-width: 1024px) {
    .accounts-grid-desktop {
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
    }
}

@media (min-width: 1200px) {
    .accounts-grid-desktop {
        grid-template-columns: repeat(4, 1fr);
        gap: 22px;
    }
}

@media (min-width: 1600px) {
    .accounts-grid-desktop {
        grid-template-columns: repeat(4, 1fr);
        gap: 24px;
    }
}

/* 桌面端账号卡片 */
.account-card-desktop {
    background: linear-gradient(135deg, #fffbf5 0%, #fef3e2 100%);
    border: 1px solid rgba(251, 146, 60, 0.15);
    border-radius: 16px;
    padding: 0;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    height: 140px;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(251, 146, 60, 0.08);
}

.account-card-desktop:hover {
    border-color: rgba(251, 146, 60, 0.3);
    box-shadow: 0 8px 25px rgba(251, 146, 60, 0.15);
    transform: translateY(-4px);
    background: linear-gradient(135deg, #fefcf9 0%, #fef7ed 100%);
}

/* 卡片装饰背景 */
.card-decoration {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    pointer-events: none;
    opacity: 0.6;
}

.claude-icon {
    width: 100%;
    height: 100%;
}

/* 卡片内容容器 */
.card-content {
    position: relative;
    z-index: 1;
    height: 100%;
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

/* 卡片头部 */
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

/* 新的账号名称样式 */
.account-name-new {
    font-size: 16px;
    font-weight: 600;
    color: #92400e;
    line-height: 1.2;
    max-width: 120px;
    word-break: break-word;
}

/* 卡片底部 */
.card-footer {
    display: flex;
    align-items: center;
}

/* 状态指示器 */
.status-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
}

/* 状态圆点 */
.status-dot {
    width: 8px;
    height: 8px;
    background: #16a34a;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
}

/* 状态文字 */
.status-text {
    font-size: 14px;
    color: #a16207;
    font-weight: 500;
}

/* 邮箱文字 */
.email-text {
    font-size: 12px;
    color: #92400e;
    font-weight: 400;
    margin-left: 8px;
    opacity: 0.8;
}

/* 旧样式已移除，使用新的卡片设计 */

/* 保留必要的弹窗样式 */

/* 弹窗样式 */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: rgb(255, 254, 250);
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(139, 125, 107, 0.15);
}

.modal-content.large {
    max-width: 800px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid rgb(235, 230, 220);
}

.modal-header h3 {
    font-size: 18px;
    font-weight: 600;
    color: #5d4e37;
    margin: 0;
}

.close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    font-size: 20px;
    color: #8b7d6b;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;
}

.close-btn:hover {
    background: rgb(245, 242, 235);
    color: #5d4e37;
}

.modal-body {
    padding: 24px;
    max-height: 60vh;
    overflow-y: auto;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid rgb(235, 230, 220);
}

.form-group {
    margin-bottom: 16px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: #6b5b47;
    font-size: 14px;
    font-weight: 500;
}

.form-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid rgb(220, 210, 195);
    border-radius: 6px;
    font-size: 14px;
    background: rgb(255, 254, 250);
    color: #2d2a26;
}

.form-input:focus {
    outline: none;
    border-color: #d2691e;
    box-shadow: 0 0 0 3px rgba(210, 105, 30, 0.1);
}

.form-input:disabled {
    background: rgb(245, 242, 235);
    color: #8b7d6b;
    cursor: not-allowed;
}

/* 验证码输入框 */
.verification-input {
    display: flex;
    gap: 8px;
}

.verification-input .form-input {
    flex: 1;
}

.send-code-btn {
    padding: 8px 16px;
    background: #d2691e;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
}

.send-code-btn:hover {
    background: #b8621a;
}

/* 个人中心弹窗样式 */
.profile-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    border-bottom: 1px solid rgb(235, 230, 220);
    padding-bottom: 16px;
}

.tab-btn {
    padding: 8px 16px;
    background: transparent;
    border: 1px solid rgb(220, 210, 195);
    border-radius: 6px;
    color: #8b7d6b;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.tab-btn:hover {
    background: rgb(245, 242, 235);
    border-color: #d2691e;
}

.tab-btn.active {
    background: #d2691e;
    border-color: #d2691e;
    color: white;
}

.tab-content {
    min-height: 300px;
}

.tab-panel {
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 基本信息样式 */
.user-basic-info {
    display: flex;
    gap: 32px;
    align-items: flex-start;
}

.avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.large-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 4px solid rgb(235, 230, 220);
    object-fit: cover;
}

.info-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid rgb(245, 242, 235);
}

.info-row:last-child {
    border-bottom: none;
}

.info-row label {
    font-size: 14px;
    font-weight: 600;
    color: #5d4e37;
    min-width: 80px;
}

.info-row span {
    font-size: 14px;
    color: #8b7d6b;
    font-weight: 500;
}

/* 订阅信息样式 */
.subscription-info {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.subscription-card {
    background: rgb(255, 254, 250);
    border: 1px solid rgb(235, 230, 220);
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(139, 125, 107, 0.08);
}

.subscription-card h4 {
    font-size: 18px;
    font-weight: 600;
    color: #5d4e37;
    margin: 0 0 20px 0;
    padding-bottom: 12px;
    border-bottom: 2px solid #d2691e;
}

.subscription-details {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: rgb(250, 249, 245);
    border-radius: 8px;
    border-left: 4px solid #d2691e;
}

.detail-item .label {
    font-size: 14px;
    font-weight: 600;
    color: #5d4e37;
}

.detail-item .value {
    font-size: 14px;
    font-weight: 500;
    color: #8b7d6b;
}

/* 购买记录样式 */
.orders-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.order-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: rgb(255, 254, 250);
    border: 1px solid rgb(235, 230, 220);
    border-radius: 8px;
    transition: all 0.2s;
}

.order-item:hover {
    box-shadow: 0 2px 8px rgba(139, 125, 107, 0.1);
    border-color: #d2691e;
}

.order-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.order-title {
    font-size: 14px;
    font-weight: 600;
    color: #5d4e37;
}

.order-date {
    font-size: 12px;
    color: #8b7d6b;
}

.order-amount {
    font-size: 16px;
    font-weight: 600;
    color: #d2691e;
}

.order-status {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.order-status.status-completed {
    background: rgb(230, 245, 235);
    color: #2d5016;
}

.order-status.status-pending {
    background: rgb(255, 248, 235);
    color: #a0522d;
}

.order-status.status-failed {
    background: rgb(255, 235, 235);
    color: #8b1538;
}

/* 个人中心响应式设计 */
@media (max-width: 768px) {
    .modal-content.large {
        width: 95%;
        max-width: none;
        margin: 20px;
    }

    .profile-tabs {
        flex-wrap: wrap;
        gap: 6px;
    }

    .tab-btn {
        padding: 6px 12px;
        font-size: 12px;
    }

    .user-basic-info {
        flex-direction: column;
        align-items: center;
        gap: 20px;
        text-align: center;
    }

    .large-avatar {
        width: 100px;
        height: 100px;
    }

    .info-section {
        width: 100%;
    }

    .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        padding: 12px 0;
    }

    .info-row label {
        min-width: auto;
    }

    .order-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
    }

    .order-amount {
        align-self: flex-end;
    }

    .detail-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        padding: 16px;
    }
}

.btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-secondary {
    background: rgb(245, 242, 235);
    border: 1px solid rgb(220, 210, 195);
    color: #6b5b47;
}

.btn-secondary:hover {
    background: rgb(235, 230, 220);
}

.btn-primary {
    background: #d2691e;
    border: 1px solid #d2691e;
    color: #ffffff;
}

.btn-primary:hover {
    background: #b8621a;
}

.expiry-info {
    color: #8b7d6b;
    font-size: 12px;
    margin-top: 8px;
}

/* 兑换记录样式 */
.redemption-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.redemption-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.redemption-header h4 {
    font-size: 18px;
    font-weight: 600;
    color: #5d4e37;
    margin: 0;
}

.refresh-btn {
    background: #d2691e;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
}

.refresh-btn:hover {
    background: #b8621a;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    background: rgb(255, 254, 250);
    border: 1px solid rgb(235, 230, 220);
    border-radius: 12px;
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.empty-text {
    font-size: 16px;
    color: #8b7d6b;
    margin-bottom: 24px;
}

.redemption-table {
    background: rgb(255, 254, 250);
    border: 1px solid rgb(235, 230, 220);
    border-radius: 12px;
    overflow: hidden;
}

.table-header {
    display: grid;
    grid-template-columns: 2fr 2fr 1fr 2fr;
    gap: 16px;
    padding: 16px 20px;
    background: rgb(245, 242, 235);
    border-bottom: 1px solid rgb(235, 230, 220);
    font-weight: 600;
    color: #5d4e37;
    font-size: 14px;
}

.table-row {
    display: grid;
    grid-template-columns: 2fr 2fr 1fr 2fr;
    gap: 16px;
    padding: 16px 20px;
    border-bottom: 1px solid rgb(245, 242, 235);
    transition: background-color 0.2s;
}

.table-row:last-child {
    border-bottom: none;
}

.table-row:hover {
    background: rgb(250, 248, 245);
}

.col-code .code-text {
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
    background: rgb(245, 242, 235);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 13px;
    color: #5d4e37;
    font-weight: 500;
}

.col-time {
    color: #8b7d6b;
    font-size: 14px;
}

.status-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.status-badge.status-active {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.status-badge.status-expired {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.col-remark {
    color: #8b7d6b;
    font-size: 14px;
}

/* 账号列表相关样式 */
.accounts-section {
    margin-top: 20px;
}

.loading-container {
    text-align: center;
    padding: 60px 20px;
    background: rgb(255, 254, 250);
    border: 1px solid rgb(235, 230, 220);
    border-radius: 12px;
}

.loading-text {
    font-size: 16px;
    color: #8b7d6b;
    margin-bottom: 16px;
}

.error-container {
    text-align: center;
    padding: 60px 20px;
    background: rgb(255, 254, 250);
    border: 1px solid rgb(235, 230, 220);
    border-radius: 12px;
}

.error-text {
    font-size: 16px;
    color: #d32f2f;
    margin-bottom: 16px;
}

.retry-btn {
    background: #d2691e;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s;
}

.retry-btn:hover {
    background: #b8621a;
}

/* 桌面端专用 - 禁用移动端响应式 */
/* 保持桌面端布局，不进行移动端适配 */
</style>
