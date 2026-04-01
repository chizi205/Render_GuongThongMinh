const db = require("../../config/database");

const findKioskAccountByUsername = async (username) => {
  const { rows } = await db.query(
    `SELECT
       ka.id AS kiosk_account_id,
       ka.shop_id,
       ka.kiosk_id,
       ka.username,
       ka.password_hash,
       ka.is_active,
       k.status AS kiosk_status,
       s.status AS shop_status,
       s.zalo_oa_id,
       k.name AS kiosk_name,
       k.location AS kiosk_location
     FROM kiosk_accounts ka
     JOIN kiosks k ON k.id = ka.kiosk_id
     JOIN shops s ON s.id = ka.shop_id
     WHERE ka.username = $1
     LIMIT 1`,
    [username],
  );
  return rows[0] || null;
};

const updateKioskLastLogin = async (kioskAccountId) => {
  await db.query(
    `UPDATE kiosk_accounts SET last_login = NOW(), updated_at = NOW() WHERE id = $1`,
    [kioskAccountId],
  );
};

const updateKioskLastActive = async (kioskId) => {
  await db.query(
    `UPDATE kiosks SET last_active = NOW(), updated_at = NOW() WHERE id = $1`,
    [kioskId],
  );
};
const setRefreshToken = async (kioskAccountId, refreshTokenHash, expiry) => {
  await db.query(
    `UPDATE kiosk_accounts
     SET refresh_token_hash = $2,
         refresh_token_expiry = $3,
         updated_at = NOW()
     WHERE id = $1`,
    [kioskAccountId, refreshTokenHash, expiry],
  );
};

const findKioskAccountById = async (kioskAccountId) => {
  const { rows } = await db.query(
    `SELECT
       ka.id AS kiosk_account_id,
       ka.shop_id,
       ka.kiosk_id,
       ka.is_active,
       ka.refresh_token_hash,
       ka.refresh_token_expiry,
       k.status AS kiosk_status,
       s.status AS shop_status,
       s.zalo_oa_id
     FROM kiosk_accounts ka
     JOIN kiosks k ON k.id = ka.kiosk_id
     JOIN shops s ON s.id = ka.shop_id
     WHERE ka.id = $1
     LIMIT 1`,
    [kioskAccountId],
  );
  return rows[0] || null;
};
const clearRefreshToken = async (kioskAccountId) => {
  await db.query(
    `UPDATE kiosk_accounts
     SET refresh_token_hash = NULL,
         refresh_token_expiry = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [kioskAccountId],
  );
};

const findSessionWithShopById = async (session_id) => {
  const sql = `
    SELECT
      ks.id,
      ks.kiosk_id,
      ks.kiosk_account_id,
      ks.user_id,
      ks.status,
      ks.started_at,
      ks.ended_at,
      ks.identified_at,
      ks.identify_method,
      k.shop_id
    FROM kiosk_sessions ks
    INNER JOIN kiosks k ON k.id = ks.kiosk_id
    WHERE ks.id = $1
    LIMIT 1
  `;

  const { rows } = await db.query(sql, [session_id]);
  return rows[0] || null;
};

/**
 * Tìm user theo phone
 */
const findUserByPhone = async (phone) => {
  const sql = `
    SELECT id, phone, full_name, zalo_user_id, avatar_url, created_at, updated_at
    FROM users
    WHERE phone = $1
    LIMIT 1
  `;

  const { rows } = await db.query(sql, [phone]);
  return rows[0] || null;
};

/**
 * Tạo user mới
 */
const createUser = async ({ phone, full_name }) => {
  const sql = `
    INSERT INTO users (phone, full_name, created_at, updated_at)
    VALUES ($1, $2, NOW(), NOW())
    RETURNING id, phone, full_name, zalo_user_id, avatar_url, created_at, updated_at
  `;

  const { rows } = await db.query(sql, [phone, full_name]);
  return rows[0];
};

/**
 * Cập nhật thông tin user cũ
 */
const updateUserInfo = async ({ user_id, full_name }) => {
  const sql = `
    UPDATE users
    SET
      full_name = COALESCE($2, full_name),
      updated_at = NOW()
    WHERE id = $1
    RETURNING id, phone, full_name, zalo_user_id, avatar_url, created_at, updated_at
  `;

  const { rows } = await db.query(sql, [user_id, full_name]);
  return rows[0];
};

/**
 * Tạo hoặc cập nhật shop_users
 */
const upsertShopUser = async ({ shop_id, user_id, source = "kiosk" }) => {
  const sql = `
    INSERT INTO shop_users (
      shop_id,
      user_id,
      first_seen_at,
      last_seen_at,
      total_sessions,
      consent_marketing,
      source
    )
    VALUES ($1, $2, NOW(), NOW(), 1, FALSE, $3)
    ON CONFLICT (shop_id, user_id)
    DO UPDATE SET
      last_seen_at = NOW(),
      total_sessions = shop_users.total_sessions + 1,
      source = COALESCE(EXCLUDED.source, shop_users.source)
    RETURNING id, shop_id, user_id, first_seen_at, last_seen_at, total_sessions, consent_marketing, source
  `;

  const { rows } = await db.query(sql, [shop_id, user_id, source]);
  return rows[0];
};

/**
 * Gắn user vào kiosk_session + đánh dấu nhận diện
 */
const attachUserToSession = async ({
  session_id,
  user_id,
  identify_method,
}) => {
  const sql = `
    UPDATE kiosk_sessions
    SET
      user_id = $2,
      identified_at = NOW(),
      identify_method = $3
    WHERE id = $1
    RETURNING id, user_id, identified_at, identify_method
  `;

  const { rows } = await db.query(sql, [session_id, user_id, identify_method]);
  return rows[0] || null;
};

/**
 * Nếu muốn đổi trạng thái session
 */
const updateSessionStatus = async ({ session_id, status }) => {
  const sql = `
    UPDATE kiosk_sessions
    SET
      status = $2,
      ended_at = CASE WHEN $2 = 'completed' THEN NOW() ELSE ended_at END
    WHERE id = $1
    RETURNING id, status, ended_at
  `;

  const { rows } = await db.query(sql, [session_id, status]);
  return rows[0] || null;
};
module.exports = {
  findKioskAccountByUsername,
  updateKioskLastLogin,
  updateKioskLastActive,
  setRefreshToken,
  findKioskAccountById,
  clearRefreshToken,
  findSessionWithShopById,
  findUserByPhone,
  createUser,
  updateUserInfo,
  upsertShopUser,
  attachUserToSession,
  updateSessionStatus,
};
