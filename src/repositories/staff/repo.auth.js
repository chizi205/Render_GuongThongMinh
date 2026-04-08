const db = require("../../config/database"); // file pool postgres của bạn

const findByUsername = async (username) => {
  const result = await db.query(
    `
    SELECT *
    FROM shop_staffs
    WHERE username = $1 and is_active=true
    LIMIT 1
    `,
    [username],
  );

  return result.rows[0];
};
const findByPhone = async (phone) => {
  const result = await db.query(
    `
    SELECT *
    FROM shop_staffs
    WHERE phone = $1 and is_active=true
    LIMIT 1
    `,
    [phone],
  );

  return result.rows[0];
};
const findById = async (id) => {
  const result = await db.query(
    `
    SELECT *
    FROM shop_staffs
    WHERE id = $1
    LIMIT 1
    `,
    [id],
  );

  return result.rows[0];
};

// 🕒 update last login
const updateLastLogin = async (id) => {
  await db.query(
    `
    UPDATE shop_staffs
    SET last_login = NOW()
    WHERE id = $1
    `,
    [id],
  );
};

// 🔍 check username tồn tại trong shop (optional)
const findByUsernameAndShop = async (username, shop_id) => {
  const result = await db.query(
    `
    SELECT *
    FROM shop_staffs
    WHERE username = $1 AND shop_id = $2
    LIMIT 1
    `,
    [username, shop_id],
  );

  return result.rows[0];
};

module.exports = {
  findByUsername,
  findById,
  updateLastLogin,
  findByUsernameAndShop,
  findByPhone,
};
