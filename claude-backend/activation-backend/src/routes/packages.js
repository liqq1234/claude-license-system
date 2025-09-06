const express = require('express');
const router = express.Router();
const db = require('../config/mysql');

/**
 * 获取所有套餐类型
 * GET /api/packages/types
 */
router.get('/types', async (req, res) => {
  try {
    const [types] = await db.execute(`
      SELECT id, name, code, description, sort_order
      FROM subscription_types 
      WHERE is_active = 1 
      ORDER BY sort_order ASC
    `);

    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('获取套餐类型失败:', error);
    res.status(500).json({
      success: false,
      message: '获取套餐类型失败'
    });
  }
});

/**
 * 获取所有时长选项
 * GET /api/packages/durations
 */
router.get('/durations', async (req, res) => {
  try {
    const [durations] = await db.execute(`
      SELECT id, name, days, sort_order
      FROM duration_options 
      WHERE is_active = 1 
      ORDER BY sort_order ASC
    `);

    res.json({
      success: true,
      data: durations
    });
  } catch (error) {
    console.error('获取时长选项失败:', error);
    res.status(500).json({
      success: false,
      message: '获取时长选项失败'
    });
  }
});

/**
 * 获取所有套餐产品
 * GET /api/packages/products
 * 可选参数: type_id (套餐类型ID)
 */
router.get('/products', async (req, res) => {
  try {
    const { type_id } = req.query;
    
    let query = `
      SELECT 
        p.id,
        p.name,
        p.price,
        p.original_price,
        p.features,
        p.is_recommended,
        st.name as type_name,
        st.code as type_code,
        do.name as duration_name,
        do.days as duration_days
      FROM packages p
      LEFT JOIN subscription_types st ON p.subscription_type_id = st.id
      LEFT JOIN duration_options do ON p.duration_id = do.id
      WHERE p.is_active = 1 AND st.is_active = 1 AND do.is_active = 1
    `;
    
    const params = [];
    
    if (type_id) {
      query += ` AND p.subscription_type_id = ?`;
      params.push(type_id);
    }
    
    query += ` ORDER BY st.sort_order ASC, do.sort_order ASC, p.sort_order ASC`;

    const [products] = await db.execute(query, params);

    // 解析 JSON 字段
    const processedProducts = products.map(product => ({
      ...product,
      features: product.features || null // MySQL2 已经自动解析JSON，无需手动parse
    }));

    res.json({
      success: true,
      data: processedProducts
    });
  } catch (error) {
    console.error('获取套餐产品失败:', error);
    res.status(500).json({
      success: false,
      message: '获取套餐产品失败'
    });
  }
});

/**
 * 获取支付方式
 * GET /api/packages/payment-methods
 */
router.get('/payment-methods', async (req, res) => {
  try {
    const [methods] = await db.execute(`
      SELECT id, name, code, icon, sort_order
      FROM payment_methods 
      WHERE is_active = 1 
      ORDER BY sort_order ASC
    `);

    res.json({
      success: true,
      data: methods
    });
  } catch (error) {
    console.error('获取支付方式失败:', error);
    res.status(500).json({
      success: false,
      message: '获取支付方式失败'
    });
  }
});

/**
 * 获取完整的购买界面数据
 * GET /api/packages/purchase-data
 */
router.get('/purchase-data', async (req, res) => {
  try {
    // 并行获取所有数据
    const [typesResult, durationsResult, productsResult, methodsResult] = await Promise.all([
      db.execute(`
        SELECT id, name, code, description, sort_order
        FROM subscription_types 
        WHERE is_active = 1 
        ORDER BY sort_order ASC
      `),
      db.execute(`
        SELECT id, name, days, sort_order
        FROM duration_options 
        WHERE is_active = 1 
        ORDER BY sort_order ASC
      `),
      db.execute(`
        SELECT 
          p.id,
          p.name,
          p.price,
          p.original_price,
          p.features,
          p.is_recommended,
          p.subscription_type_id,
          p.duration_id,
          st.name as type_name,
          st.code as type_code,
          do.name as duration_name,
          do.days as duration_days
        FROM packages p
        LEFT JOIN subscription_types st ON p.subscription_type_id = st.id
        LEFT JOIN duration_options do ON p.duration_id = do.id
        WHERE p.is_active = 1 AND st.is_active = 1 AND do.is_active = 1
        ORDER BY st.sort_order ASC, do.sort_order ASC, p.sort_order ASC
      `),
      db.execute(`
        SELECT id, name, code, icon, sort_order
        FROM payment_methods 
        WHERE is_active = 1 
        ORDER BY sort_order ASC
      `)
    ]);

    const [types] = typesResult;
    const [durations] = durationsResult;
    const [products] = productsResult;
    const [methods] = methodsResult;

    // 处理产品数据，解析 JSON 字段
    const processedProducts = products.map(product => ({
      ...product,
      features: product.features || null // MySQL2 已经自动解析JSON，无需手动parse
    }));

    res.json({
      success: true,
      data: {
        types,
        durations,
        products: processedProducts,
        paymentMethods: methods
      }
    });
  } catch (error) {
    console.error('获取购买界面数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取购买界面数据失败'
    });
  }
});

/**
 * 创建订单
 * POST /api/packages/create-order
 */
router.post('/create-order', async (req, res) => {
  try {
    const { package_id, payment_method_id, user_id } = req.body;

    if (!package_id || !payment_method_id) {
      return res.status(400).json({
        success: false,
        message: '套餐ID和支付方式ID不能为空'
      });
    }

    // 获取套餐信息
    const [packageInfo] = await db.execute(`
      SELECT p.*, do.days as duration_days
      FROM packages p
      LEFT JOIN duration_options do ON p.duration_id = do.id
      WHERE p.id = ? AND p.is_active = 1
    `, [package_id]);

    if (packageInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: '套餐不存在或已下架'
      });
    }

    const packageData = packageInfo[0];
    const orderNo = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const activationCode = `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    // 计算过期时间
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + packageData.duration_days);

    // 创建订单
    const [result] = await db.execute(`
      INSERT INTO orders (
        order_no, user_id, package_id, payment_method_id, 
        amount, activation_code, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      orderNo, user_id || null, package_id, payment_method_id,
      packageData.price, activationCode, expiresAt
    ]);

    res.json({
      success: true,
      data: {
        order_id: result.insertId,
        order_no: orderNo,
        activation_code: activationCode,
        amount: packageData.price,
        expires_at: expiresAt
      }
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({
      success: false,
      message: '创建订单失败'
    });
  }
});

module.exports = router;
