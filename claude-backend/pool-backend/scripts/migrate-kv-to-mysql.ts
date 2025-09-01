// scripts/migrate-kv-to-mysql.ts
/**
 * 数据迁移脚本：从 Cloudflare KV 迁移到 MySQL
 * 将现有的邮箱-Session Key 映射从 KV 存储迁移到 MySQL 数据库
 */

import { DatabaseManager } from '../src/database';
import mysql from 'mysql2/promise';

// 从 KV 存储读取的数据格式
interface KVEmailSkMap {
  [email: string]: string;
}

// 数据库配置
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '', // 请根据实际情况修改
  database: 'claudehub',
  connectionLimit: 10
};

// 模拟的 KV 数据（实际使用时需要从真实的 KV 存储读取）
const mockKVData: KVEmailSkMap = {
  'qingquanli325@gmail.com': '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',
  // 添加更多现有数据...
};

/**
 * 从 KV 存储读取数据的函数
 * 在实际环境中，这应该连接到 Cloudflare KV 并读取 EMAIL_TO_SK_MAP
 */
async function readFromKV(): Promise<KVEmailSkMap> {
  // 这里应该是实际的 KV 读取逻辑
  // 例如：const mapStr = await env.CLAUDE_KV.get('EMAIL_TO_SK_MAP');
  // return JSON.parse(mapStr) as KVEmailSkMap;
  
  console.log('使用模拟数据进行迁移演示...');
  return mockKVData;
}

/**
 * 验证邮箱格式
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证 Session Key 格式
 */
function isValidSessionKey(sk: string): boolean {
  return sk.startsWith('sk-ant-') && sk.length > 20;
}

/**
 * 主迁移函数
 */
async function migrateData() {
  console.log('🚀 开始数据迁移：KV -> MySQL');
  console.log('================================');

  let db: DatabaseManager | null = null;
  
  try {
    // 创建数据库连接
    console.log('📡 连接到 MySQL 数据库...');
    db = new DatabaseManager(dbConfig);
    
    // 测试数据库连接
    const isConnected = await db.testConnection();
    if (!isConnected) {
      throw new Error('无法连接到 MySQL 数据库');
    }
    console.log('✅ 数据库连接成功');

    // 从 KV 读取数据
    console.log('📖 从 KV 存储读取数据...');
    const kvData = await readFromKV();
    const emails = Object.keys(kvData);
    console.log(`📊 找到 ${emails.length} 个账户需要迁移`);

    if (emails.length === 0) {
      console.log('⚠️  没有找到需要迁移的数据');
      return;
    }

    // 统计信息
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    console.log('🔄 开始迁移账户数据...');
    console.log('--------------------------------');

    for (const email of emails) {
      const sessionKey = kvData[email];
      
      try {
        // 验证数据格式
        if (!isValidEmail(email)) {
          console.log(`❌ 跳过无效邮箱: ${email}`);
          skipCount++;
          continue;
        }

        if (!isValidSessionKey(sessionKey)) {
          console.log(`❌ 跳过无效 Session Key: ${email}`);
          skipCount++;
          continue;
        }

        // 检查账户是否已存在
        const existingAccount = await db.getAccountByEmail(email);
        if (existingAccount) {
          console.log(`⚠️  账户已存在，跳过: ${email}`);
          skipCount++;
          continue;
        }

        // 添加账户到数据库
        const accountId = await db.addAccount({
          email: email,
          session_key: sessionKey,
          status: 1,
          created_by: 'migration_script',
          notes: 'Migrated from KV storage'
        });

        console.log(`✅ 成功迁移: ${email} (ID: ${accountId})`);
        successCount++;

      } catch (error) {
        const errorMsg = `迁移失败 ${email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.log(`❌ ${errorMsg}`);
        errors.push(errorMsg);
        errorCount++;
      }
    }

    // 显示迁移结果
    console.log('================================');
    console.log('📊 迁移完成统计:');
    console.log(`✅ 成功迁移: ${successCount} 个账户`);
    console.log(`⚠️  跳过: ${skipCount} 个账户`);
    console.log(`❌ 失败: ${errorCount} 个账户`);
    console.log('================================');

    if (errors.length > 0) {
      console.log('❌ 错误详情:');
      errors.forEach(error => console.log(`   ${error}`));
      console.log('================================');
    }

    // 验证迁移结果
    console.log('🔍 验证迁移结果...');
    const allAccounts = await db.getAllAccounts();
    console.log(`📊 数据库中现有账户总数: ${allAccounts.length}`);

    // 显示前几个账户作为验证
    if (allAccounts.length > 0) {
      console.log('📋 账户列表预览:');
      allAccounts.slice(0, 5).forEach((account, index) => {
        console.log(`   ${index + 1}. ${account.email} (${account.session_key.substring(0, 20)}...)`);
      });
      if (allAccounts.length > 5) {
        console.log(`   ... 还有 ${allAccounts.length - 5} 个账户`);
      }
    }

    console.log('🎉 数据迁移完成！');

  } catch (error) {
    console.error('💥 迁移过程中发生错误:', error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    if (db) {
      await db.close();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

/**
 * 创建备份函数
 */
async function createBackup() {
  console.log('💾 创建数据备份...');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // 导出现有数据
    const [rows] = await connection.execute('SELECT email, session_key FROM claude_accounts');
    const backupData = rows as any[];
    
    // 保存备份文件
    const backupContent = JSON.stringify(backupData, null, 2);
    const fs = require('fs');
    const backupFile = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    fs.writeFileSync(backupFile, backupContent);
    console.log(`✅ 备份已保存到: ${backupFile}`);
    
    await connection.end();
  } catch (error) {
    console.error('❌ 创建备份失败:', error);
  }
}

// 主程序入口
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--backup')) {
    await createBackup();
    return;
  }
  
  if (args.includes('--help')) {
    console.log('Claude Pool Manager 数据迁移工具');
    console.log('');
    console.log('用法:');
    console.log('  npm run migrate           # 执行数据迁移');
    console.log('  npm run migrate --backup  # 创建数据备份');
    console.log('  npm run migrate --help    # 显示帮助信息');
    return;
  }

  await migrateData();
}

// 运行主程序
if (require.main === module) {
  main().catch(console.error);
}

export { migrateData, createBackup };
