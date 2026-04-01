const { pool } = require("../../config/database");

const getCustomerProfile = async (shopId, customerId) => {
  const query = `
    SELECT u.id, u.phone, u.full_name, u.zalo_user_id, u.avatar_url, u.created_at AS system_joined_at,
           su.first_seen_at, su.last_seen_at, su.total_sessions, su.consent_marketing, su.source,
           COALESCE(COUNT(o.id), 0)::int AS total_orders,
           COALESCE(SUM(o.total_amount), 0)::numeric AS total_spent
    FROM shop_users su
    JOIN users u ON su.user_id = u.id
    LEFT JOIN orders o ON o.user_id = u.id AND o.shop_id = su.shop_id AND o.status = 'completed'
    WHERE su.shop_id = $1 AND u.id = $2
    GROUP BY u.id, su.shop_id, su.first_seen_at, su.last_seen_at, su.total_sessions, su.consent_marketing, su.source
  `;
  const res = await pool.query(query, [shopId, customerId]);
  return res.rowCount === 0 ? null : res.rows[0];
};

const getRecentOrders = async (shopId, customerId, limit = 5) => {
  const query = `
    SELECT id, created_at, total_amount, payment_method, status
    FROM orders WHERE shop_id = $1 AND user_id = $2
    ORDER BY created_at DESC LIMIT $3
  `;
  const res = await pool.query(query, [shopId, customerId, limit]);
  return res.rows;
};

const findCustomers = async (shopId, limit, cursor, filters = {}) => {
  let query = `
    SELECT u.id AS user_id, u.phone, u.full_name, u.zalo_user_id, u.avatar_url,
           su.first_seen_at, su.last_seen_at, su.total_sessions, su.source, su.consent_marketing
    FROM shop_users su JOIN users u ON su.user_id = u.id
    WHERE su.shop_id = $1
  `;
  const params = [shopId];
  let paramIndex = 2;

  if (filters.search) {
    query += ` AND (u.full_name ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }
  if (filters.min_sessions) { query += ` AND su.total_sessions >= $${paramIndex++}`; params.push(filters.min_sessions); }
  if (filters.start_date) { query += ` AND su.first_seen_at >= $${paramIndex++}`; params.push(filters.start_date); }
  if (filters.end_date) { query += ` AND su.first_seen_at <= $${paramIndex++}`; params.push(filters.end_date); }

  const sortDirection = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
  const cursorOperator = sortDirection === 'DESC' ? '<' : '>';

  if (cursor) { query += ` AND su.first_seen_at ${cursorOperator} $${paramIndex++}`; params.push(cursor); }
  
  query += ` ORDER BY su.first_seen_at ${sortDirection} LIMIT $${paramIndex++}`;
  params.push(limit);

  const res = await pool.query(query, params);
  return res.rows;
};



module.exports = { getCustomerProfile, getRecentOrders, findCustomers };