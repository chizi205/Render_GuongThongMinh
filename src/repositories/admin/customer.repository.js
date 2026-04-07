const { pool } = require("../../config/database");

const findAllCustomers = async (limit, cursor, filters = {}) => {
  let query = `
    SELECT 
      u.id, 
      u.phone, 
      u.full_name, 
      u.gender, 
      su.zalo_user_id, -- ĐÃ SỬA: Lấy từ bảng shop_users (su) thay vì users (u)
      u.avatar_url, 
      u.created_at,
      COUNT(DISTINCT su.shop_id) as total_shops_joined,
      COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0)::numeric AS total_spent,
      MAX(su.last_seen_at) as last_seen_at
    FROM users u
    LEFT JOIN shop_users su ON u.id = su.user_id
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.is_active = true
  `;
  const params = [];
  let paramIndex = 1;

  if (filters.search) {
    query += ` AND (u.full_name ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  // ĐÃ SỬA: Thêm su.zalo_user_id vào GROUP BY để tránh lỗi SQL
  query += ` GROUP BY u.id, su.zalo_user_id`;

  if (cursor) {
    query += ` HAVING u.created_at < $${paramIndex++}`;
    params.push(cursor);
  }

  query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex++}`;
  params.push(limit);

  const res = await pool.query(query, params);
  return res.rows;
};

const getAdminCustomerDetail = async (customerId) => {
  const query = `
    SELECT 
      u.*, 
      su.zalo_user_id, -- ĐÃ SỬA: Lấy từ shop_users
      COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0)::numeric AS total_spent,
      COUNT(o.id) FILTER (WHERE o.status = 'completed') as total_orders
    FROM users u
    LEFT JOIN shop_users su ON u.id = su.user_id
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.id = $1 AND u.is_active = true
    GROUP BY u.id, su.zalo_user_id
  `;
  const res = await pool.query(query, [customerId]);
  return res.rows[0] || null;
};



const getCustomerOrdersAllShops = async (customerId, limit = 10) => {
  const query = `
    SELECT o.*, s.name as shop_name 
    FROM orders o
    JOIN shops s ON o.shop_id = s.id
    WHERE o.user_id = $1
    ORDER BY o.created_at DESC LIMIT $2
  `;
  const res = await pool.query(query, [customerId, limit]);
  return res.rows;
};

const updateCustomer = async (id, data) => {
  const { 
    full_name, 
    phone, 
    email, 
    gender, 
    address, 
    zalo_user_id, 
    avatar_url 
  } = data;

  const result = await pool.query(
    `UPDATE users 
     SET 
        full_name = $1, 
        phone = $2, 
        email = $3, 
        gender = $4, 
        address = $5, 
        zalo_user_id = $6, 
        avatar_url = $7,
        updated_at = NOW()
     WHERE id = $8 AND is_active = true
     RETURNING *`,
    [full_name, phone, email, gender, address, zalo_user_id, avatar_url, id]
  );
  return result.rows[0];
};

const softDeleteCustomer = async (id) => {
  const result = await pool.query(
    `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 AND is_active = true RETURNING *`,
    [id]
  );
  return result.rows[0];
};

module.exports = {
    findAllCustomers,
    getAdminCustomerDetail,
    getCustomerOrdersAllShops,
    updateCustomer,
    softDeleteCustomer
};