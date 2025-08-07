// debug-db.js
// 调试数据库连接和数据问题

const mysql = require('mysql2/promise');

async function debugDatabase() {
  console.log('🔍 调试数据库连接和数据问题...');
  console.log('================================');

  const config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '4693090li',
    database: 'claudehub',
    connectTimeout: 10000
  };

  try {
    console.log('📡 连接到数据库...');
    const connection = await mysql.createConnection(config);
    console.log('✅ 数据库连接成功');

    // 1. 检查数据库是否存在
    console.log('\n🗄️  检查数据库...');
    const [databases] = await connection.execute('SHOW DATABASES LIKE "claudehub"');
    if (databases.length > 0) {
      console.log('✅ claudehub 数据库存在');
    } else {
      console.log('❌ claudehub 数据库不存在');
      await connection.end();
      return;
    }

    // 2. 检查表是否存在
    console.log('\n📋 检查表结构...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📊 找到 ${tables.length} 个表:`);
    
    const tableNames = tables.map(table => Object.values(table)[0]);
    tableNames.forEach(tableName => {
      console.log(`   - ${tableName}`);
    });

    // 3. 检查 claude_accounts 表
    if (tableNames.includes('claude_accounts')) {
      console.log('\n👥 检查 claude_accounts 表...');
      
      // 检查表结构
      const [columns] = await connection.execute('DESCRIBE claude_accounts');
      console.log('📝 表结构:');
      columns.forEach(col => {
        console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
      });

      // 检查数据
      const [accounts] = await connection.execute('SELECT * FROM claude_accounts');
      console.log(`\n📊 账户数据: ${accounts.length} 条记录`);
      
      if (accounts.length > 0) {
        console.log('📋 账户列表:');
        accounts.forEach((account, index) => {
          console.log(`   ${index + 1}. ${account.email} (ID: ${account.id}, 状态: ${account.status})`);
          console.log(`      SK: ${account.session_key.substring(0, 20)}...`);
          console.log(`      创建时间: ${account.created_at}`);
        });
      } else {
        console.log('⚠️  表中没有数据');
      }
    } else {
      console.log('❌ claude_accounts 表不存在');
    }

    // 4. 检查使用日志
    if (tableNames.includes('claude_usage_logs')) {
      const [logs] = await connection.execute('SELECT COUNT(*) as count FROM claude_usage_logs');
      console.log(`\n📝 使用日志: ${logs[0].count} 条记录`);
    }

    // 5. 检查管理员日志
    if (tableNames.includes('claude_admin_logs')) {
      const [adminLogs] = await connection.execute('SELECT * FROM claude_admin_logs ORDER BY created_at DESC LIMIT 10');
      console.log(`\n🔧 管理员操作日志: ${adminLogs.length} 条最近记录`);
      
      if (adminLogs.length > 0) {
        console.log('📋 最近操作:');
        adminLogs.forEach((log, index) => {
          console.log(`   ${index + 1}. ${log.action} - ${log.target_email || 'N/A'} (${log.success ? '成功' : '失败'})`);
          console.log(`      时间: ${log.created_at}`);
          if (log.error_message) {
            console.log(`      错误: ${log.error_message}`);
          }
        });
      }
    }

    await connection.end();
    console.log('\n🔌 连接已关闭');

  } catch (error) {
    console.error('❌ 数据库操作失败:', error.message);
    console.error('错误代码:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 MySQL 服务可能未启动');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 用户名或密码错误');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 数据库不存在，请先运行初始化脚本');
    }
  }
}

// 测试添加数据
async function testAddAccount() {
  console.log('\n🧪 测试添加账户...');
  
  const config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '4693090li',
    database: 'claudehub'
  };

  try {
    const connection = await mysql.createConnection(config);
    
    // 添加测试账户
    const testEmail = 'debug-test@example.com';
    const testSK = 'sk-ant-debug-test-123456789012345678901234567890';
    
    console.log(`📝 添加测试账户: ${testEmail}`);
    
    const [result] = await connection.execute(
      'INSERT INTO claude_accounts (email, session_key, status, created_by) VALUES (?, ?, ?, ?)',
      [testEmail, testSK, 1, 'debug_test']
    );
    
    console.log(`✅ 账户添加成功，ID: ${result.insertId}`);
    
    // 验证添加结果
    const [accounts] = await connection.execute(
      'SELECT * FROM claude_accounts WHERE email = ?',
      [testEmail]
    );
    
    if (accounts.length > 0) {
      console.log('✅ 验证成功，账户已存在于数据库中');
      console.log('📋 账户信息:', accounts[0]);
    } else {
      console.log('❌ 验证失败，账户未找到');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ 测试添加失败:', error.message);
  }
}

// 运行调试
debugDatabase().then(() => {
  return testAddAccount();
}).catch(console.error);
