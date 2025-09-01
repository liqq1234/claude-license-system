/**
 * Claude Login Core Module
 * 核心登录功能提取版本 - 可独立使用
 */

class ClaudeLoginManager {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'https://claude.lqqmail.xyz';
    this.sessionKeys = config.sessionKeys || {}; // { email: sk }
    this.defaultExpiresIn = config.defaultExpiresIn || 0;
    this.maxExpiresIn = config.maxExpiresIn || 0;
    this.adminPassword = config.adminPassword || null; // 管理员密码
  }

  /**
   * 设置Session Key映射
   * @param {Object} sessionKeys - { email: sessionKey }
   */
  setSessionKeys(sessionKeys) {
    this.sessionKeys = sessionKeys;
  }

  /**
   * 添加单个Session Key
   * @param {string} email - 邮箱地址
   * @param {string} sessionKey - 会话密钥
   */
  addSessionKey(email, sessionKey) {
    this.sessionKeys[email] = sessionKey;
  }

  /**
   * 获取可用的邮箱列表
   * @returns {Array} 排序后的邮箱列表
   */
  getAvailableEmails() {
    return Object.keys(this.sessionKeys).sort();
  }

  /**
   * 生成随机会话标识符
   * @returns {string} 随机ID
   */
  generateUniqueId() {
    return 'session-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
  }

  /**
   * 随机选择一个可用账户
   * @returns {string|null} 随机选择的邮箱
   */
  getRandomEmail() {
    const emails = this.getAvailableEmails();
    if (emails.length === 0) return null;
    return emails[Math.floor(Math.random() * emails.length)];
  }

  /**
   * 验证并调整过期时间
   * @param {number} requestedExpiresIn - 请求的过期时间
   * @returns {Object} { expiresIn, warning }
   */
  validateExpiresIn(requestedExpiresIn) {
    let expiresIn = requestedExpiresIn || this.defaultExpiresIn;
    let warning = null;

    if (this.maxExpiresIn > 0 && expiresIn > this.maxExpiresIn) {
      warning = `请求的令牌有效期 ${expiresIn} 秒超过了最大允许值 ${this.maxExpiresIn} 秒，已调整为最大值。`;
      expiresIn = this.maxExpiresIn;
    }

    return { expiresIn, warning };
  }

  /**
   * 核心登录方法 - 通过Session Key获取登录URL
   * @param {Object} options - 登录选项
   * @param {string} options.mode - 'specific' 或 'random'
   * @param {string} [options.email] - 指定邮箱 (mode='specific'时必需)
   * @param {string} [options.uniqueName] - 会话标识符
   * @param {number} [options.expiresIn] - 过期时间(秒)
   * @returns {Promise<Object>} { success, loginUrl, warning, error }
   */
  async getLoginUrl(options = {}) {
    try {
      const { mode, email, uniqueName, expiresIn } = options;

      // 1. 参数验证
      if (!mode || !['specific', 'random'].includes(mode)) {
        return { success: false, error: 'Invalid login mode. Must be "specific" or "random".' };
      }

      // 2. 确定使用的邮箱
      let selectedEmail;

      if (mode === 'random') {
        // 随机模式：让后端选择账户，前端不需要预先检查
        selectedEmail = null; // 后端会随机选择
      } else if (mode === 'specific') {
        if (!email) {
          return { success: false, error: 'Email is required for specific mode.' };
        }
        selectedEmail = email;

        // 检查邮箱是否在可用列表中（如果有sessionKeys的话）
        if (Object.keys(this.sessionKeys).length > 0 && !this.sessionKeys[selectedEmail]) {
          return {
            success: false,
            error: `Account for ${selectedEmail} not found or not available.`
          };
        }
      }

      // 3. 生成会话标识符
      const finalUniqueName = uniqueName || this.generateUniqueId();

      // 4. 验证过期时间
      const { expiresIn: validatedExpiresIn, warning } = this.validateExpiresIn(expiresIn);

      // 5. 构建登录请求载荷（符合管理员API格式）
      const loginPayload = {
        admin_password: this.adminPassword,
        mode: mode,
        email: selectedEmail,
        unique_name: finalUniqueName,
        expires_in: validatedExpiresIn
      };

      // 6. 调用管理员API获取登录URL
      const response = await this.exchangeToken(loginPayload);
      
      if (response.success) {
        return {
          success: true,
          loginUrl: response.loginUrl, // 后端返回的是完整URL，不需要拼接
          warning: response.warning || warning,
          selectedEmail: response.selectedEmail || selectedEmail, // 使用后端返回的邮箱
          uniqueName: response.uniqueName || finalUniqueName // 使用后端返回的会话名称
        };
      } else {
        return { success: false, error: response.error };
      }

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 通过后端API获取登录URL
   * @param {Object} loginPayload - 登录请求载荷
   * @returns {Promise<Object>} { success, loginUrl, error }
   */
  async exchangeToken(loginPayload) {
    try {
      // 使用管理员API而不是普通用户API
      const response = await fetch(`${this.baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Login request failed: ${response.status} - ${errorText}`);
        return {
          success: false,
          error: `Login request failed with status ${response.status}. ${errorText}`
        };
      }

      const data = await response.json();

      if (!data.login_url) {
        console.error('Login response missing login_url:', data);
        return {
          success: false,
          error: 'Login request successful, but login_url was not returned.'
        };
      }

      return {
        success: true,
        loginUrl: data.login_url,
        warning: data.warning,
        selectedEmail: data.selectedEmail || data.email, // 支持两种字段名
        uniqueName: data.uniqueName || data.unique_name // 支持两种字段名
      };

    } catch (error) {
      console.error('Login request error:', error);
      return { success: false, error: `Network error: ${error.message}` };
    }
  }

  /**
   * 快速登录方法 - 随机账户
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 登录结果
   */
  async quickLogin(options = {}) {
    return this.getLoginUrl({
      mode: 'random',
      uniqueName: options.uniqueName,
      expiresIn: options.expiresIn
    });
  }

  /**
   * 指定账户登录
   * @param {string} email - 邮箱地址
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 登录结果
   */
  async loginWithEmail(email, options = {}) {
    return this.getLoginUrl({
      mode: 'specific',
      email: email,
      uniqueName: options.uniqueName,
      expiresIn: options.expiresIn
    });
  }

  /**
   * 批量登录 - 为多个用户生成登录URL
   * @param {Array} users - 用户列表 [{ email?, uniqueName?, expiresIn? }]
   * @returns {Promise<Array>} 登录结果列表
   */
  async batchLogin(users) {
    const results = [];
    
    for (const user of users) {
      const mode = user.email ? 'specific' : 'random';
      const result = await this.getLoginUrl({
        mode: mode,
        email: user.email,
        uniqueName: user.uniqueName,
        expiresIn: user.expiresIn
      });
      
      results.push({
        ...result,
        requestedUser: user
      });
    }
    
    return results;
  }
}

// 导出类和工具函数
if (typeof module !== 'undefined' && module.exports) {
  // Node.js环境
  module.exports = { ClaudeLoginManager };
} else if (typeof window !== 'undefined') {
  // 浏览器环境
  window.ClaudeLoginManager = ClaudeLoginManager;
}

export { ClaudeLoginManager };
