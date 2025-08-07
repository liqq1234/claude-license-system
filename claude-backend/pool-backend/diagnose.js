// diagnose.js
// 诊断前端和后端连接问题

console.log('🔍 诊断前端后端连接问题...');
console.log('================================');

// 1. 检查当前运行的服务
async function checkRunningService() {
  console.log('📡 检查当前运行的服务...');
  
  try {
    const response = await fetch('http://localhost:8787/health');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 服务正在运行:', data);
      return data;
    } else {
      console.log('⚠️  服务响应异常:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.log('❌ 无法连接到服务:', error.message);
    return null;
  }
}

// 2. 测试管理员接口
async function testAdminAPI() {
  console.log('\n🔧 测试管理员接口...');
  
  try {
    // 测试获取账户列表
    const listResponse = await fetch('http://localhost:8787/api/admin/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_password: 'admin123' })
    });
    
    if (listResponse.ok) {
      const accounts = await listResponse.json();
      console.log('✅ 获取账户列表成功:', accounts);
      console.log(`📊 当前账户数量: ${Array.isArray(accounts) ? accounts.length : '未知'}`);
    } else {
      console.log('❌ 获取账户列表失败:', listResponse.status, await listResponse.text());
    }
    
    // 测试添加账户
    const testEmail = `test-${Date.now()}@example.com`;
    const testSK = `sk-ant-test-${Date.now()}`;
    
    console.log(`\n➕ 测试添加账户: ${testEmail}`);
    
    const addResponse = await fetch('http://localhost:8787/api/admin/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        admin_password: 'admin123',
        email: testEmail,
        sk: testSK
      })
    });
    
    if (addResponse.ok) {
      const result = await addResponse.json();
      console.log('✅ 添加账户响应:', result);
      
      // 再次检查账户列表
      const verifyResponse = await fetch('http://localhost:8787/api/admin/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_password: 'admin123' })
      });
      
      if (verifyResponse.ok) {
        const updatedAccounts = await verifyResponse.json();
        console.log('🔍 验证添加结果:', updatedAccounts);
        
        const foundAccount = Array.isArray(updatedAccounts) ? 
          updatedAccounts.find(acc => acc.email === testEmail) : null;
        
        if (foundAccount) {
          console.log('✅ 账户添加验证成功');
        } else {
          console.log('❌ 账户添加验证失败 - 账户未在列表中找到');
        }
      }
      
    } else {
      console.log('❌ 添加账户失败:', addResponse.status, await addResponse.text());
    }
    
  } catch (error) {
    console.log('❌ API 测试失败:', error.message);
  }
}

// 3. 检查数据库连接（如果可能）
async function checkDatabase() {
  console.log('\n🗄️  检查数据库连接...');
  
  try {
    const mysql = require('mysql2/promise');
    
    const config = {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '4693090li',
      database: 'claudehub',
      connectTimeout: 5000
    };
    
    console.log('📡 尝试连接数据库...');
    const connection = await mysql.createConnection(config);
    console.log('✅ 数据库连接成功');
    
    // 检查表
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📋 数据库表: ${tables.length} 个`);
    
    if (tables.length > 0) {
      // 检查 claude_accounts 表
      const [accounts] = await connection.execute('SELECT COUNT(*) as count FROM claude_accounts');
      console.log(`👥 claude_accounts 表记录数: ${accounts[0].count}`);
      
      if (accounts[0].count > 0) {
        const [accountList] = await connection.execute('SELECT email, created_at FROM claude_accounts ORDER BY created_at DESC LIMIT 5');
        console.log('📋 最近的账户:');
        accountList.forEach((acc, index) => {
          console.log(`   ${index + 1}. ${acc.email} (${acc.created_at})`);
        });
      }
    } else {
      console.log('⚠️  数据库中没有表，需要初始化');
    }
    
    await connection.end();
    
  } catch (error) {
    console.log('❌ 数据库连接失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 MySQL 服务可能未启动');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 数据库用户名或密码错误');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 数据库不存在');
    }
  }
}

// 4. 生成诊断报告
async function generateReport() {
  console.log('\n📊 生成诊断报告...');
  console.log('================================');
  
  const serviceInfo = await checkRunningService();
  await testAdminAPI();
  await checkDatabase();
  
  console.log('\n📋 诊断总结:');
  console.log('================================');
  
  if (serviceInfo) {
    if (serviceInfo.version && serviceInfo.version.includes('mysql')) {
      console.log('✅ 后端正在使用 MySQL 版本');
    } else {
      console.log('⚠️  后端可能仍在使用 KV 版本');
    }
  } else {
    console.log('❌ 后端服务未运行或无法访问');
  }
  
  console.log('\n💡 建议的解决步骤:');
  console.log('1. 确保 MySQL 服务正在运行');
  console.log('2. 运行数据库初始化: mysql -u root -p4693090li < database/init.sql');
  console.log('3. 启动 MySQL 版本后端服务');
  console.log('4. 检查前端是否连接到正确的后端');
}

// 运行诊断
generateReport().catch(console.error);
