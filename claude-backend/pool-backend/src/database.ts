// src/database.ts
/**
 * MySQL 数据库连接和操作模块
 * 提供 Claude 账户管理的数据库操作接口
 */

import mysql from 'mysql2/promise';

// 数据库配置接口
interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;
  acquireTimeout?: number;
  timeout?: number;
}

// Claude 账户接口
export interface ClaudeAccount {
  id?: number;
  email: string;
  session_key: string;
  status?: number;
  last_used_at?: Date | null;
  usage_count?: number;
  created_at?: Date;
  updated_at?: Date;
  created_by?: string;
  notes?: string;
  unique_name?: string; // 添加unique_name字段
}

// 使用日志接口
export interface UsageLog {
  id?: number;
  account_id: number;
  email: string;
  login_mode: 'random' | 'specific';
  unique_name?: string;
  expires_in?: number;
  client_ip?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  created_at?: Date;
}

// 管理员操作日志接口
export interface AdminLog {
  id?: number;
  action: 'add' | 'update' | 'delete' | 'batch' | 'login' | 'plugin_add';
  target_email?: string;
  old_data?: any;
  new_data?: any;
  admin_ip?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  batch_id?: string;
  created_at?: Date;
}

// 数据库操作类
export class DatabaseManager {
  private pool: mysql.Pool;

  constructor(config: DatabaseConfig) {
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: config.connectionLimit || 10,
      queueLimit: 0,
      charset: 'utf8mb4'
    });
  }

  // 测试数据库连接
  async testConnection(): Promise<boolean> {
    try {
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  // 获取所有活跃账户
  async getAllAccounts(): Promise<ClaudeAccount[]> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM claude_accounts WHERE status = 1 ORDER BY email'
    );
    return rows as ClaudeAccount[];
  }

  // 根据邮箱获取账户
  async getAccountByEmail(email: string): Promise<ClaudeAccount | null> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM claude_accounts WHERE email = ? AND status = 1',
      [email]
    );
    const accounts = rows as ClaudeAccount[];
    return accounts.length > 0 ? accounts[0] : null;
  }

  // 根据ID获取账户
  async getAccountById(id: number): Promise<ClaudeAccount | null> {
    const [rows] = await this.pool.execute(
      'SELECT * FROM claude_accounts WHERE id = ? AND status = 1',
      [id]
    );
    const accounts = rows as ClaudeAccount[];
    return accounts.length > 0 ? accounts[0] : null;
  }

  // 添加账户
  async addAccount(account: ClaudeAccount): Promise<number> {
    const [result] = await this.pool.execute(
      `INSERT INTO claude_accounts (email, session_key, status, created_by, notes) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        account.email,
        account.session_key,
        account.status || 1,
        account.created_by || 'admin',
        account.notes || null
      ]
    );
    return (result as mysql.ResultSetHeader).insertId;
  }

  // 更新账户
  async updateAccount(email: string, updates: Partial<ClaudeAccount>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.email && updates.email !== email) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    if (updates.session_key) {
      fields.push('session_key = ?');
      values.push(updates.session_key);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }

    if (fields.length === 0) {
      return false;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(email);

    const [result] = await this.pool.execute(
      `UPDATE claude_accounts SET ${fields.join(', ')} WHERE email = ?`,
      values
    );

    return (result as mysql.ResultSetHeader).affectedRows > 0;
  }

  // 删除账户
  async deleteAccount(email: string): Promise<boolean> {
    const [result] = await this.pool.execute(
      'DELETE FROM claude_accounts WHERE email = ?',
      [email]
    );
    return (result as mysql.ResultSetHeader).affectedRows > 0;
  }

  // 更新账户使用统计
  async updateAccountUsage(email: string): Promise<void> {
    await this.pool.execute(
      `UPDATE claude_accounts 
       SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP 
       WHERE email = ?`,
      [email]
    );
  }

  // 记录使用日志
  async logUsage(log: UsageLog): Promise<void> {
    await this.pool.execute(
      `INSERT INTO claude_usage_logs 
       (account_id, email, login_mode, unique_name, expires_in, client_ip, user_agent, success, error_message) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        log.account_id,
        log.email,
        log.login_mode,
        log.unique_name || null,
        log.expires_in || null,
        log.client_ip || null,
        log.user_agent || null,
        log.success,
        log.error_message || null
      ]
    );
  }

  // 记录管理员操作日志
  async logAdminAction(log: AdminLog): Promise<void> {
    await this.pool.execute(
      `INSERT INTO claude_admin_logs 
       (action, target_email, old_data, new_data, admin_ip, user_agent, success, error_message, batch_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        log.action,
        log.target_email || null,
        log.old_data ? JSON.stringify(log.old_data) : null,
        log.new_data ? JSON.stringify(log.new_data) : null,
        log.admin_ip || null,
        log.user_agent || null,
        log.success,
        log.error_message || null,
        log.batch_id || null
      ]
    );
  }

  // 获取统计信息
  async getStatistics(): Promise<any> {
    const [accountStats] = await this.pool.execute(`
      SELECT 
        COUNT(*) as total_accounts,
        COUNT(CASE WHEN status = 1 THEN 1 END) as active_accounts,
        COUNT(CASE WHEN status = 0 THEN 1 END) as disabled_accounts,
        COUNT(CASE WHEN last_used_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as recent_used_accounts,
        COALESCE(AVG(usage_count), 0) as avg_usage_count
      FROM claude_accounts
    `);

    const [todayUsage] = await this.pool.execute(`
      SELECT 
        COUNT(*) as total_logins,
        COUNT(CASE WHEN login_mode = 'random' THEN 1 END) as random_logins,
        COUNT(CASE WHEN login_mode = 'specific' THEN 1 END) as specific_logins,
        COUNT(CASE WHEN success = 0 THEN 1 END) as failed_logins,
        COUNT(DISTINCT email) as unique_accounts_used
      FROM claude_usage_logs 
      WHERE DATE(created_at) = CURDATE()
    `);

    return {
      accounts: (accountStats as any[])[0],
      today: (todayUsage as any[])[0]
    };
  }

  // 关闭连接池
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// 创建数据库管理器实例的工厂函数
export function createDatabaseManager(env: any): DatabaseManager {
  const config: DatabaseConfig = {
    host: env.DB_HOST || 'localhost',
    port: parseInt(env.DB_PORT || '3306'),
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'claudehub',
    connectionLimit: parseInt(env.DB_CONNECTION_LIMIT || '10'),
    acquireTimeout: parseInt(env.DB_ACQUIRE_TIMEOUT || '60000'),
    timeout: parseInt(env.DB_TIMEOUT || '60000')
  };

  return new DatabaseManager(config);
}
