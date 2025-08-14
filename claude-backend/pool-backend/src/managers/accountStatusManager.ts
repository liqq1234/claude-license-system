// src/managers/accountStatusManager.ts
/**
 * 账户状态管理器
 * 负责管理所有账户的状态（空闲/繁忙）和重置时间
 */

export enum AccountStatus {
  IDLE = 'idle',                    // 空闲 - 绿色 - 可以使用
  BUSY = 'busy',                    // 繁忙 - 红色 - 被429限制，显示重置时间
  ERROR = 'error'                   // 错误 - 灰色 - 连接或其他错误
}

/**
 * 状态转换流程：
 * 1. IDLE (空闲) → BUSY (检测到429限流)
 * 2. BUSY (繁忙/限流) → IDLE (重置时间到期)
 * 3. 任何状态 → ERROR (发生错误)
 * 4. ERROR → IDLE (错误恢复)
 */

export interface AccountStatusData {
  accountId: string;
  email: string;
  status: AccountStatus;
  rateLimitUntil?: number;          // 限流结束时间戳
  cooldownSeconds?: number;         // 冷却秒数
  lastCheckTime: number;            // 最后检查时间
  errorCount: number;               // 连续错误次数
  lastErrorMessage?: string;        // 最后错误信息
  lastUsedTime?: number;            // 最后使用时间
  sessionKey?: string;              // Session Key (用于检测)
}

export interface StatusUpdateEvent {
  accountId: string;
  oldStatus: AccountStatus;
  newStatus: AccountStatus;
  timestamp: number;
  reason?: string;
}

class AccountStatusManager {
  private statusCache = new Map<string, AccountStatusData>();
  private statusUpdateCallbacks: Array<(event: StatusUpdateEvent) => void> = [];
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // 每分钟清理过期的限流状态
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredStatuses();
    }, 60000);
    
    console.log('🎯 账户状态管理器已启动');
  }

  /**
   * 获取账户状态
   */
  getAccountStatus(accountId: string): AccountStatusData | null {
    return this.statusCache.get(accountId) || null;
  }

  /**
   * 获取所有账户状态
   */
  getAllAccountStatuses(): Map<string, AccountStatusData> {
    return new Map(this.statusCache);
  }

  /**
   * 设置账户为繁忙状态（检测到429限流时调用）
   */
  setAccountBusy(
    accountId: string, 
    email: string, 
    cooldownSeconds: number = 300,
    errorMessage?: string,
    sessionKey?: string
  ): void {
    const rateLimitUntil = Date.now() + (cooldownSeconds * 1000);
    
    const newStatus: AccountStatusData = {
      accountId,
      email,
      status: AccountStatus.BUSY,
      rateLimitUntil,
      cooldownSeconds,
      lastCheckTime: Date.now(),
      lastUsedTime: Date.now(),
      errorCount: 0,
      lastErrorMessage: errorMessage,
      sessionKey
    };

    this.updateAccountStatus(newStatus);
    
    const resetTime = new Date(rateLimitUntil).toLocaleString('zh-CN');
    console.log(`🔴 账户 ${email} 被限流，状态变更为繁忙，重置时间: ${resetTime} (${cooldownSeconds}秒后)`);
  }

  /**
   * 设置账户为空闲状态
   */
  setAccountIdle(accountId: string, email: string): void {
    const newStatus: AccountStatusData = {
      accountId,
      email,
      status: AccountStatus.IDLE,
      lastCheckTime: Date.now(),
      errorCount: 0
    };

    this.updateAccountStatus(newStatus);
    console.log(`🟢 账户 ${email} 状态变更为空闲`);
  }

  /**
   * 设置账户为错误状态
   */
  setAccountError(accountId: string, email: string, errorMessage: string): void {
    const currentStatus = this.statusCache.get(accountId);
    const errorCount = (currentStatus?.errorCount || 0) + 1;

    const newStatus: AccountStatusData = {
      accountId,
      email,
      status: AccountStatus.ERROR,
      lastCheckTime: Date.now(),
      errorCount,
      lastErrorMessage: errorMessage
    };

    this.updateAccountStatus(newStatus);
    console.log(`⚫ 账户 ${email} 状态变更为错误 (第${errorCount}次): ${errorMessage}`);
  }

  /**
   * 获取可用的账户列表（空闲状态）
   */
  getAvailableAccounts(): AccountStatusData[] {
    const available: AccountStatusData[] = [];
    
    for (const status of this.statusCache.values()) {
      if (status.status === AccountStatus.IDLE) {
        available.push(status);
      }
    }
    
    return available;
  }

  /**
   * 获取限流中的账户列表（繁忙状态且有重置时间）
   */
  getRateLimitedAccounts(): AccountStatusData[] {
    const rateLimited: AccountStatusData[] = [];
    
    for (const status of this.statusCache.values()) {
      if (status.status === AccountStatus.BUSY && status.rateLimitUntil) {
        rateLimited.push(status);
      }
    }
    
    return rateLimited;
  }

  /**
   * 获取状态统计
   */
  getStatusStats(): {
    idle: number;
    busy: number;
    rateLimited: number;
    error: number;
    total: number;
  } {
    const stats = {
      idle: 0,
      busy: 0,
      rateLimited: 0,
      error: 0,
      total: this.statusCache.size
    };

    for (const status of this.statusCache.values()) {
      switch (status.status) {
        case AccountStatus.IDLE:
          stats.idle++;
          break;
        case AccountStatus.BUSY:
          if (status.rateLimitUntil) {
            stats.rateLimited++; // 有重置时间的繁忙状态算作限流
          } else {
            stats.busy++; // 普通繁忙状态
          }
          break;
        case AccountStatus.ERROR:
          stats.error++;
          break;
      }
    }

    return stats;
  }

  /**
   * 计算重置倒计时
   */
  getResetCountdown(accountId: string): {
    isRateLimited: boolean;
    remainingSeconds: number;
    resetTime?: string;
  } {
    const status = this.statusCache.get(accountId);
    
    if (!status || status.status !== AccountStatus.BUSY || !status.rateLimitUntil) {
      return { isRateLimited: false, remainingSeconds: 0 };
    }

    const now = Date.now();
    const remainingMs = status.rateLimitUntil - now;
    
    if (remainingMs <= 0) {
      // 限流已过期，自动设置为空闲
      this.setAccountIdle(accountId, status.email);
      return { isRateLimited: false, remainingSeconds: 0 };
    }

    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const resetTime = new Date(status.rateLimitUntil).toLocaleString('zh-CN');

    return {
      isRateLimited: true,
      remainingSeconds,
      resetTime
    };
  }

  /**
   * 注册状态更新回调
   */
  onStatusUpdate(callback: (event: StatusUpdateEvent) => void): void {
    this.statusUpdateCallbacks.push(callback);
  }

  /**
   * 清理过期的限流状态
   */
  private cleanupExpiredStatuses(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [accountId, status] of this.statusCache.entries()) {
      if (status.status === AccountStatus.BUSY && status.rateLimitUntil) {
        if (now >= status.rateLimitUntil) {
          this.setAccountIdle(accountId, status.email);
          cleanedCount++;
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 清理了 ${cleanedCount} 个过期的限流状态`);
    }
  }

  /**
   * 更新账户状态并触发回调
   */
  private updateAccountStatus(newStatus: AccountStatusData): void {
    const oldStatus = this.statusCache.get(newStatus.accountId);
    
    // 触发状态更新事件
    if (oldStatus && oldStatus.status !== newStatus.status) {
      const event: StatusUpdateEvent = {
        accountId: newStatus.accountId,
        oldStatus: oldStatus.status,
        newStatus: newStatus.status,
        timestamp: Date.now()
      };

      this.statusUpdateCallbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('状态更新回调执行失败:', error);
        }
      });
    }

    this.statusCache.set(newStatus.accountId, newStatus);
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.statusCache.clear();
    this.statusUpdateCallbacks = [];
    console.log('🛑 账户状态管理器已销毁');
  }
}

// 单例实例
export const accountStatusManager = new AccountStatusManager();
