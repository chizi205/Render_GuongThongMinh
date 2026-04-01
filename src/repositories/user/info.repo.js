const db = require("../../config/database");

const findUserById = async (id) => {
  const sql = `
    SELECT
      id,
      phone,
      full_name,
      gender,
      email,
      avatar_url,
      zalo_user_id
    FROM users
    WHERE id = $1
  `;

  const { rows } = await db.query(sql, [id]);

  return rows[0];
};
const getPhotoHistory = async ({ user_id, cursor = null, limit = 10 }) => {
  const sql = `
    SELECT
      ks.id AS session_id,
      t.id AS try_on_id,
      t.image_url,
      t.tried_at
    FROM kiosk_sessions ks
    JOIN try_ons t
      ON ks.id = t.kiosk_session_id
    WHERE ks.user_id = $1
    AND ($2::timestamp IS NULL OR t.tried_at < $2)
    ORDER BY t.tried_at DESC
    LIMIT $3
  `;

  const { rows } = await db.query(sql, [user_id, cursor, limit]);

  const next_cursor =
    rows.length === limit ? rows[rows.length - 1].tried_at : null;

  return {
    photos: rows,
    next_cursor,
  };
};
const countPhotoHistory = async (user_id) => {
  const sql = `
    SELECT COUNT(*) AS total
    FROM kiosk_sessions ks
    JOIN try_ons t
      ON ks.id = t.kiosk_session_id
    WHERE ks.user_id = $1
  `;

  const { rows } = await db.query(sql, [user_id]);

  return parseInt(rows[0].total);
};

const upsertZaloFollower = async ({
  shopId,
  userId,
  zaloUserId,
  source = "zalo_oa",
}) => {
  const query = `
    INSERT INTO shop_users (
      shop_id,
      user_id,
      zalo_user_id,
      first_seen_at,
      last_seen_at,
      total_sessions,
      source
    )
    VALUES (
      $1,
      $2,
      $3,
      NOW(),
      NOW(),
      1,
      $4
    )
    ON CONFLICT (shop_id, zalo_user_id)
    DO UPDATE SET
      last_seen_at = NOW(),
      total_sessions = shop_users.total_sessions + 1
    RETURNING *;
  `;

  const values = [shopId, userId, zaloUserId, source];
  const { rows } = await db.query(query, values);
  return rows[0];
};
const getZaloUserId = async (shopId, userId) => {
  const query = `
    SELECT zalo_user_id
    FROM shop_users
    WHERE shop_id = $1 AND user_id = $2
  `;

  const { rows } = await db.query(query, [shopId, userId]);
  return rows[0]?.zalo_user_id;
};
module.exports = {
  findUserById,
  countPhotoHistory,
  getPhotoHistory,
  upsertZaloFollower,
  getZaloUserId
};
