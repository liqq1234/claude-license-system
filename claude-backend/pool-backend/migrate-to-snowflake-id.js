// 数据库迁移脚本：将邮箱改为雪花ID
const mysql = require('mysql2/promise');

// 雪花ID生成器
class SnowflakeIdGenerator {
    constructor(workerId = 1, datacenterId = 1) {
        this.workerId = workerId;
        this.datacenterId = datacenterId;
        this.sequence = 0;
        this.lastTimestamp = -1;
        
        // 各部分位数
        this.workerIdBits = 5;
        this.datacenterIdBits = 5;
        this.sequenceBits = 12;
        
        // 最大值
        this.maxWorkerId = -1 ^ (-1 << this.workerIdBits);
        this.maxDatacenterId = -1 ^ (-1 << this.datacenterIdBits);
        this.sequenceMask = -1 ^ (-1 << this.sequenceBits);
        
        // 位移
        this.workerIdShift = this.sequenceBits;
        this.datacenterIdShift = this.sequenceBits + this.workerIdBits;
        this.timestampLeftShift = this.sequenceBits + this.workerIdBits + this.datacenterIdBits;
        
        // 起始时间戳 (2020-01-01)
        this.twepoch = 1577836800000;
        
        if (workerId > this.maxWorkerId || workerId < 0) {
            throw new Error(`Worker ID must be between 0 and ${this.maxWorkerId}`);
        }
        if (datacenterId > this.maxDatacenterId || datacenterId < 0) {
            throw new Error(`Datacenter ID must be between 0 and ${this.maxDatacenterId}`);
        }
    }
    
    nextId() {
        let timestamp = Date.now();
        
        if (timestamp < this.lastTimestamp) {
            throw new Error('Clock moved backwards');
        }
        
        if (this.lastTimestamp === timestamp) {
            this.sequence = (this.sequence + 1) & this.sequenceMask;
            if (this.sequence === 0) {
                timestamp = this.tilNextMillis(this.lastTimestamp);
            }
        } else {
            this.sequence = 0;
        }
        
        this.lastTimestamp = timestamp;
        
        return ((timestamp - this.twepoch) << this.timestampLeftShift) |
               (this.datacenterId << this.datacenterIdShift) |
               (this.workerId << this.workerIdShift) |
               this.sequence;
    }
    
    tilNextMillis(lastTimestamp) {
        let timestamp = Date.now();
        while (timestamp <= lastTimestamp) {
            timestamp = Date.now();
        }
        return timestamp;
    }
}

// 数据库配置
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'claudehub'
};

async function migrateToSnowflakeId() {
    let connection;
    
    try {
        console.log('🔄 开始数据库迁移：邮箱 -> 雪花ID');
        
        // 创建数据库连接
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ 数据库连接成功');
        
        // 创建雪花ID生成器
        const idGenerator = new SnowflakeIdGenerator();
        
        // 1. 添加新的 snowflake_id 列
        console.log('📝 添加 snowflake_id 列...');
        await connection.execute(`
            ALTER TABLE claude_accounts 
            ADD COLUMN snowflake_id BIGINT UNIQUE AFTER id
        `);
        
        // 2. 获取所有现有账户
        console.log('📊 获取现有账户数据...');
        const [accounts] = await connection.execute('SELECT id, email FROM claude_accounts');
        console.log(`📋 找到 ${accounts.length} 个账户需要迁移`);
        
        // 3. 为每个账户生成雪花ID
        console.log('🔄 开始生成雪花ID...');
        for (const account of accounts) {
            const snowflakeId = idGenerator.nextId();
            await connection.execute(
                'UPDATE claude_accounts SET snowflake_id = ? WHERE id = ?',
                [snowflakeId, account.id]
            );
            console.log(`✅ 账户 ${account.email} -> 雪花ID: ${snowflakeId}`);
            
            // 稍微延迟避免ID冲突
            await new Promise(resolve => setTimeout(resolve, 1));
        }
        
        // 4. 创建备份表（保留原始邮箱数据）
        console.log('💾 创建备份表...');
        await connection.execute(`
            CREATE TABLE claude_accounts_backup AS 
            SELECT * FROM claude_accounts
        `);
        
        // 5. 更新相关表的外键引用
        console.log('🔄 更新使用日志表...');
        
        // 检查 claude_usage_logs 表是否存在 snowflake_id 列
        const [columns] = await connection.execute(`
            SHOW COLUMNS FROM claude_usage_logs LIKE 'account_snowflake_id'
        `);

        if (columns.length === 0) {
            // 添加 snowflake_id 列到 claude_usage_logs
            await connection.execute(`
                ALTER TABLE claude_usage_logs
                ADD COLUMN account_snowflake_id BIGINT AFTER account_id
            `);

            // 更新现有记录
            await connection.execute(`
                UPDATE claude_usage_logs ul
                JOIN claude_accounts ca ON ul.account_id = ca.id
                SET ul.account_snowflake_id = ca.snowflake_id
            `);
        }
        
        // 6. 显示迁移结果
        console.log('📊 迁移结果统计...');
        const [result] = await connection.execute(`
            SELECT 
                COUNT(*) as total_accounts,
                COUNT(snowflake_id) as accounts_with_snowflake_id
            FROM claude_accounts
        `);
        
        console.log('🎉 迁移完成！');
        console.log(`📊 总账户数: ${result[0].total_accounts}`);
        console.log(`✅ 已分配雪花ID: ${result[0].accounts_with_snowflake_id}`);
        
        // 7. 显示一些示例数据
        console.log('📋 示例数据:');
        const [samples] = await connection.execute(`
            SELECT id, snowflake_id, email, status 
            FROM claude_accounts 
            LIMIT 5
        `);
        
        samples.forEach(sample => {
            console.log(`  ID: ${sample.id}, 雪花ID: ${sample.snowflake_id}, 邮箱: ${sample.email}`);
        });
        
        console.log('');
        console.log('⚠️  重要提示:');
        console.log('1. 原始数据已备份到 claude_accounts_backup 表');
        console.log('2. 请更新前端和后端代码使用 snowflake_id 而不是 email');
        console.log('3. 测试完成后可以考虑删除 email 列（建议保留一段时间）');
        console.log('4. 新增账户时请确保生成雪花ID');
        
    } catch (error) {
        console.error('❌ 迁移失败:', error);
        console.error('💡 如果是列已存在错误，可能之前已经迁移过了');
        
        // 检查是否已经有雪花ID
        if (connection) {
            try {
                const [check] = await connection.execute(`
                    SELECT COUNT(*) as count 
                    FROM claude_accounts 
                    WHERE snowflake_id IS NOT NULL
                `);
                console.log(`📊 当前已有雪花ID的账户数: ${check[0].count}`);
            } catch (e) {
                console.error('无法检查现有数据:', e.message);
            }
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 数据库连接已关闭');
        }
    }
}

// 运行迁移
if (require.main === module) {
    migrateToSnowflakeId().catch(console.error);
}

module.exports = { migrateToSnowflakeId, SnowflakeIdGenerator };
