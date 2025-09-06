const axios = require('axios');

const BASE_URL = 'http://localhost:8888';

// 测试所有套餐相关的API接口
async function testPackageAPIs() {
  console.log('🧪 开始测试套餐购买相关API接口...\n');

  try {
    // 1. 测试获取套餐类型
    console.log('1️⃣ 测试获取套餐类型...');
    try {
      const typesResponse = await axios.get(`${BASE_URL}/api/packages/types`);
      console.log('✅ 套餐类型API正常');
      console.log('📋 套餐类型数据:', JSON.stringify(typesResponse.data, null, 2));
    } catch (error) {
      console.log('❌ 套餐类型API失败:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. 测试获取时长选项
    console.log('2️⃣ 测试获取时长选项...');
    try {
      const durationsResponse = await axios.get(`${BASE_URL}/api/packages/durations`);
      console.log('✅ 时长选项API正常');
      console.log('⏱️ 时长选项数据:', JSON.stringify(durationsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ 时长选项API失败:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 3. 测试获取套餐产品
    console.log('3️⃣ 测试获取套餐产品...');
    try {
      const productsResponse = await axios.get(`${BASE_URL}/api/packages/products`);
      console.log('✅ 套餐产品API正常');
      console.log('📦 套餐产品数据:', JSON.stringify(productsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ 套餐产品API失败:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 4. 测试获取支付方式
    console.log('4️⃣ 测试获取支付方式...');
    try {
      const paymentResponse = await axios.get(`${BASE_URL}/api/packages/payment-methods`);
      console.log('✅ 支付方式API正常');
      console.log('💰 支付方式数据:', JSON.stringify(paymentResponse.data, null, 2));
    } catch (error) {
      console.log('❌ 支付方式API失败:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 5. 测试获取完整购买数据
    console.log('5️⃣ 测试获取完整购买数据...');
    try {
      const purchaseDataResponse = await axios.get(`${BASE_URL}/api/packages/purchase-data`);
      console.log('✅ 完整购买数据API正常');
      console.log('🛒 完整购买数据:', JSON.stringify(purchaseDataResponse.data, null, 2));
    } catch (error) {
      console.log('❌ 完整购买数据API失败:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 6. 测试创建订单
    console.log('6️⃣ 测试创建订单...');
    try {
      const orderResponse = await axios.post(`${BASE_URL}/api/packages/create-order`, {
        package_id: 1,
        payment_method_id: 1
      });
      console.log('✅ 创建订单API正常');
      console.log('📋 订单数据:', JSON.stringify(orderResponse.data, null, 2));
    } catch (error) {
      console.log('❌ 创建订单API失败:', error.message);
      if (error.response) {
        console.log('📄 错误响应:', error.response.data);
      }
    }

  } catch (error) {
    console.error('💥 测试过程中发生错误:', error.message);
  }

  console.log('\n🏁 API测试完成！');
}

// 执行测试
testPackageAPIs();
