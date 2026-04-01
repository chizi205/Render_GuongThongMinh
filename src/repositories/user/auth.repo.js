const db = require("../../config/database");

const findUserByPhone = async (phone) => {
  const sql = `
    SELECT 
      id,
      phone,
      full_name,
      gender,
      password_hash,
      zalo_user_id,
      avatar_url,
      is_active,
      created_at,
      updated_at
    FROM users
    WHERE phone = $1
    LIMIT 1
  `;

  const { rows } = await db.query(sql, [phone]);
  return rows[0] || null;
};

const createUser = async ({
  phone,
  full_name,
  gender,
  email,
  address,
  password_hash,
}) => {
  const sql = `
    INSERT INTO users (
      phone,
      full_name,
      gender,
      email,
      address,
      password_hash,
      is_active,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW(), NOW())
    RETURNING
      id,
      phone,
      full_name,
      gender,
      email,
      address,
      zalo_user_id,
      avatar_url,
      is_active,
      created_at,
      updated_at
  `;

  const { rows } = await db.query(sql, [
    phone,
    full_name,
    gender,
    email,
    address,
    password_hash,
  ]);

  return rows[0];
};
const isUserFollowOA = async (shopId, userId) => {
  const sql = `
    SELECT zalo_user_id
    FROM shop_users
    WHERE shop_id = $1 AND user_id = $2
    LIMIT 1
  `;

  const { rows } = await db.query(sql, [shopId, userId]);

  if (!rows[0]) return false;

  return true;
};
module.exports = {
  findUserByPhone,
  createUser,
  isUserFollowOA,
};
