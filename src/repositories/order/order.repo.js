const { pool } = require("../../config/database");

const insertOrder = async (client, data) => {
  const query = `
    INSERT INTO orders (shop_id, kiosk_id, user_id, kiosk_session_id, total_amount, payment_method, status, payment_status)
    VALUES ($1, $2, $3, $4, $5, $6, 'pending', 'unpaid')
    RETURNING id, status, payment_status, created_at
  `;
  const res = await client.query(query, [data.shop_id, data.kiosk_id, data.user_id, data.kiosk_session_id, data.total_amount, data.payment_method]);
  return res.rows[0];
};

const insertOrderItem = async (client, orderId, item) => {
  const query = `
    INSERT INTO order_items (order_id, product_variant_id, quantity, unit_price, subtotal)
    VALUES ($1, $2, $3, $4, $5)
  `;
  await client.query(query, [orderId, item.product_variant_id, item.quantity || 1, item.unit_price, item.subtotal]);
};

const findOrderById = async (orderId) => {
  const query = `
    SELECT id, shop_id, kiosk_id, user_id, kiosk_session_id, total_amount, status, payment_status, payment_method, created_at
    FROM orders WHERE id = $1
  `;
  const res = await pool.query(query, [orderId]);
  return res.rowCount === 0 ? null : res.rows[0];
};


const findOrderItemsWithDetails = async (orderId) => {
  const query = `
    SELECT 
        oi.id, 
        oi.product_variant_id, 
        pv.product_id, 
        oi.quantity, 
        oi.unit_price, 
        oi.subtotal,
        p.name AS product_name, 
        pv.image_urls[1] AS image_url 
    FROM order_items oi
    LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
    LEFT JOIN products p ON pv.product_id = p.id
    WHERE oi.order_id = $1
  `;
  const res = await pool.query(query, [orderId]);
  return res.rows;
};


const findOrderItemsByOrderIds = async (orderIds) => {
  const query = `
    SELECT id, order_id, product_variant_id, quantity, unit_price, subtotal
    FROM order_items WHERE order_id = ANY($1::uuid[])
  `;
  const res = await pool.query(query, [orderIds]);
  return res.rows;
};


const updateOrderStatusInDb = async (orderId, status) => {
  const query = `
    UPDATE orders SET status = $1, updated_at = NOW()
    WHERE id = $2 RETURNING id, shop_id, status, payment_status, total_amount, updated_at
  `;
  const res = await pool.query(query, [status, orderId]);
  return res.rowCount === 0 ? null : res.rows[0];
};

const updatePaymentStatusInDb = async (orderId, shopId, payment_status) => {
  const query = `
    UPDATE orders SET payment_status = $1, updated_at = NOW()
    WHERE id = $2 AND shop_id = $3 RETURNING *;
  `;
  const res = await pool.query(query, [payment_status, orderId, shopId]);
  return res.rows[0];
};

// Hàm chung hỗ trợ cho getAllOrders và filterOrders
const findOrders = async (shopId, limit, cursor, filters = {}) => {
  let query = `
    SELECT id, shop_id, kiosk_id, user_id, kiosk_session_id, total_amount, status, payment_status, payment_method, created_at
    FROM orders WHERE shop_id = $1
  `;
  const params = [shopId];
  let paramIndex = 2;
  const sortDir = (filters.sort_dir && filters.sort_dir.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

  if (filters.status) { query += ` AND status = $${paramIndex++}`; params.push(filters.status); }
  if (filters.payment_status) { query += ` AND payment_status = $${paramIndex++}`; params.push(filters.payment_status); }
  if (filters.payment_method) { query += ` AND payment_method = $${paramIndex++}`; params.push(filters.payment_method); }
  if (filters.start_date) { query += ` AND created_at >= $${paramIndex++}`; params.push(filters.start_date); }
  if (filters.end_date) { query += ` AND created_at <= $${paramIndex++}`; params.push(filters.end_date); }

  if (cursor) {
    const operator = sortDir === 'DESC' ? '<' : '>';
    query += ` AND created_at ${operator} $${paramIndex++}`;
    params.push(cursor);
  }

  query += ` ORDER BY created_at ${sortDir} LIMIT $${paramIndex++}`;
  params.push(limit);

  const res = await pool.query(query, params);
  return res.rows;
};

// Hàm lấy tất cả hóa đơn (Admin)
const findAllOrdersForAdmin = async (limit = 20, cursor = null) => {
  try {
    let query = `
      SELECT 
        o.*, 
        s.name AS shop_name,
        u.full_name AS customer_name
      FROM orders o
      LEFT JOIN shops s ON o.shop_id = s.id
      LEFT JOIN users u ON o.user_id = u.id
    `;
    
    const params = [];

    // Nếu có cursor (phân trang theo thời gian)
    if (cursor) {
      query += ` WHERE o.created_at < $1 `;
      params.push(cursor);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} `;
    params.push(limit);

    const { rows } = await pool.query(query, params);
    return rows;
  } catch (err) {
    console.error("SQL Error in findAllOrdersForAdmin:", err);
    throw err;
  }
};

module.exports = {
  insertOrder, insertOrderItem, findOrderById, findOrderItemsWithDetails,
  findOrderItemsByOrderIds, updateOrderStatusInDb, updatePaymentStatusInDb, findOrders, findAllOrdersForAdmin
};