/**
 * Claude Cookie自动更新脚本
 * 用于自动获取和更新Claude登录Cookie
 */

const fs = require('fs');
const path = require('path');
const logger = require('../src/utils/logger');

class ClaudeCookieManager {
  constructor() {
    this.cookieFile = path.join(__dirname, '../config/claude-cookies.json');
    this.nginxConfigFile = path.join(__dirname, '../nginx/claude-proxy.conf');
    this.accounts = [
      {
        id: 1,
        name: 'admin y4',
        email: 'admin@example.com',
        password: 'your_password_here',
        cookies: null,
        lastUpdate: null
      },
      {
        id: 2,
        name: 'dat233d',
        email: 'dat233d@example.com',
        password: 'your_password_here',
        cookies: null,
        lastUpdate: null
      }
      // 添加更多账号...
    ];
  }

  /**
   * 加载已保存的Cookie
   */
  loadCookies() {
    try {
      if (fs.existsSync(this.cookieFile)) {
        const data = fs.readFileSync(this.cookieFile, 'utf8');
        const savedData = JSON.parse(data);
        
        // 合并保存的Cookie数据
        this.accounts.forEach(account => {
          const saved = savedData.find(s => s.id === account.id);
          if (saved) {
            account.cookies = saved.cookies;
            account.lastUpdate = saved.lastUpdate;
          }
        });
        
        logger.info('已加载保存的Cookie数据');
      }
    } catch (error) {
      logger.error('加载Cookie失败:', error);
    }
  }

  /**
   * 保存Cookie到文件
   */
  saveCookies() {
    try {
      const dataToSave = this.accounts.map(account => ({
        id: account.id,
        name: account.name,
        cookies: account.cookies,
        lastUpdate: account.lastUpdate
      }));
      
      fs.writeFileSync(this.cookieFile, JSON.stringify(dataToSave, null, 2));
      logger.info('Cookie数据已保存');
    } catch (error) {
      logger.error('保存Cookie失败:', error);
    }
  }

  /**
   * 模拟登录获取Cookie（需要实际实现）
   * 这里提供一个框架，实际需要使用puppeteer等工具
   */
  async loginAndGetCookies(account) {
    try {
      logger.info(`开始为账号 ${account.name} 获取Cookie...`);
      
      // 这里应该使用puppeteer或其他工具自动登录
      // const browser = await puppeteer.launch();
      // const page = await browser.newPage();
      // await page.goto('https://claude.ai');
      // ... 登录逻辑
      // const cookies = await page.cookies();
      // await browser.close();
      
      // 临时返回模拟数据
      const mockCookies = {
        sessionKey: `mock_session_${account.id}_${Date.now()}`,
        __cf_bm: `mock_cf_bm_${account.id}`,
        'intercom-id-gpkq8zyo': `mock_intercom_id_${account.id}`,
        'intercom-session-gpkq8zyo': `mock_intercom_session_${account.id}`
      };
      
      account.cookies = mockCookies;
      account.lastUpdate = new Date().toISOString();
      
      logger.info(`账号 ${account.name} Cookie获取成功`);
      return mockCookies;
      
    } catch (error) {
      logger.error(`账号 ${account.name} Cookie获取失败:`, error);
      return null;
    }
  }

  /**
   * 验证Cookie是否有效
   */
  async validateCookies(account) {
    try {
      if (!account.cookies) return false;
      
      // 这里应该发送请求验证Cookie是否有效
      // const response = await fetch('https://claude.ai/api/auth/current_user', {
      //   headers: {
      //     'Cookie': this.formatCookieString(account.cookies)
      //   }
      // });
      // return response.ok;
      
      // 临时返回true（实际应该验证）
      return true;
      
    } catch (error) {
      logger.error(`验证Cookie失败:`, error);
      return false;
    }
  }

  /**
   * 格式化Cookie为字符串
   */
  formatCookieString(cookies) {
    if (!cookies) return '';
    
    return Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }

  /**
   * 更新nginx配置中的Cookie
   */
  updateNginxConfig(account) {
    try {
      if (!fs.existsSync(this.nginxConfigFile)) {
        logger.warn('nginx配置文件不存在');
        return false;
      }
      
      let config = fs.readFileSync(this.nginxConfigFile, 'utf8');
      const cookieString = this.formatCookieString(account.cookies);
      
      // 替换配置文件中的Cookie
      const cookieRegex = /proxy_set_header Cookie "[^"]*";/g;
      const newCookieLine = `proxy_set_header Cookie "${cookieString}";`;
      
      config = config.replace(cookieRegex, newCookieLine);
      
      fs.writeFileSync(this.nginxConfigFile, config);
      logger.info(`nginx配置已更新，使用账号 ${account.name} 的Cookie`);
      
      return true;
    } catch (error) {
      logger.error('更新nginx配置失败:', error);
      return false;
    }
  }

  /**
   * 重新加载nginx配置
   */
  async reloadNginx() {
    try {
      const { exec } = require('child_process');
      
      return new Promise((resolve, reject) => {
        exec('nginx -s reload', (error, stdout, stderr) => {
          if (error) {
            logger.error('重新加载nginx失败:', error);
            reject(error);
          } else {
            logger.info('nginx配置已重新加载');
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.error('重新加载nginx失败:', error);
      return false;
    }
  }

  /**
   * 获取可用的账号Cookie
   */
  getAvailableAccount() {
    // 优先返回最近更新的有效Cookie
    const validAccounts = this.accounts.filter(account => 
      account.cookies && account.lastUpdate
    );
    
    if (validAccounts.length === 0) return null;
    
    // 按更新时间排序，返回最新的
    validAccounts.sort((a, b) => 
      new Date(b.lastUpdate) - new Date(a.lastUpdate)
    );
    
    return validAccounts[0];
  }

  /**
   * 主要更新流程
   */
  async updateCookies() {
    try {
      logger.info('开始更新Claude Cookie...');
      
      // 加载现有Cookie
      this.loadCookies();
      
      let updated = false;
      
      // 检查每个账号的Cookie
      for (const account of this.accounts) {
        const isValid = await this.validateCookies(account);
        
        if (!isValid) {
          logger.info(`账号 ${account.name} Cookie无效，尝试重新获取...`);
          await this.loginAndGetCookies(account);
          updated = true;
        } else {
          logger.info(`账号 ${account.name} Cookie有效`);
        }
      }
      
      if (updated) {
        // 保存更新的Cookie
        this.saveCookies();
        
        // 选择一个可用账号更新nginx配置
        const availableAccount = this.getAvailableAccount();
        if (availableAccount) {
          this.updateNginxConfig(availableAccount);
          await this.reloadNginx();
        }
      }
      
      logger.info('Cookie更新完成');
      
    } catch (error) {
      logger.error('更新Cookie失败:', error);
    }
  }

  /**
   * 启动定时更新
   */
  startScheduledUpdate() {
    // 立即执行一次
    this.updateCookies();
    
    // 每小时检查一次
    setInterval(() => {
      this.updateCookies();
    }, 60 * 60 * 1000);
    
    logger.info('Cookie定时更新已启动');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const manager = new ClaudeCookieManager();
  
  const command = process.argv[2] || 'update';
  
  switch (command) {
    case 'update':
      manager.updateCookies()
        .then(() => {
          logger.info('Cookie更新完成');
          process.exit(0);
        })
        .catch((error) => {
          logger.error('Cookie更新失败:', error);
          process.exit(1);
        });
      break;
      
    case 'start':
      manager.startScheduledUpdate();
      break;
      
    case 'validate':
      manager.loadCookies();
      const account = manager.getAvailableAccount();
      if (account) {
        manager.validateCookies(account)
          .then((isValid) => {
            logger.info(`Cookie验证结果: ${isValid ? '有效' : '无效'}`);
            process.exit(isValid ? 0 : 1);
          });
      } else {
        logger.error('没有可用的账号Cookie');
        process.exit(1);
      }
      break;
      
    default:
      logger.error('未知命令:', command);
      logger.info('可用命令: update, start, validate');
      process.exit(1);
  }
}

module.exports = ClaudeCookieManager;
