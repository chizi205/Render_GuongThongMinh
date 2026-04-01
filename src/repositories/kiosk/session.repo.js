const db = require("../../config/database");

const createSession = async ({ kiosk_id, kiosk_account_id, user_id = null }) => {
  const { rows } = await db.query(
    `INSERT INTO kiosk_sessions (kiosk_id, kiosk_account_id, user_id, status, started_at)
     VALUES ($1, $2, $3, 'active', NOW())
     RETURNING id, kiosk_id, kiosk_account_id, user_id, status, started_at, ended_at`,
    [kiosk_id, kiosk_account_id, user_id]
  );
  return rows[0];
};

const getActiveSessionByKiosk = async ({ kiosk_id }) => {
  const { rows } = await db.query(
    `SELECT id, kiosk_id, kiosk_account_id, user_id, status, started_at, ended_at
     FROM kiosk_sessions
     WHERE kiosk_id = $1 AND status = 'active'
     ORDER BY started_at DESC
     LIMIT 1`,
    [kiosk_id]
  );
  return rows[0] || null;
};

const endSession = async ({ sessionId, status = "completed" }) => {
  const { rows } = await db.query(
    `UPDATE kiosk_sessions
     SET status = $2, ended_at = NOW()
     WHERE id = $1
     RETURNING id, status, ended_at`,
    [sessionId, status]
  );
  return rows[0] || null;
};
const updateUserIdBySessionId = async ({ session_id, user_id }) => {
  const { rows } = await db.query(
    `UPDATE kiosk_sessions
     SET user_id = $2
     WHERE id = $1 AND status = 'active'
     RETURNING id, kiosk_id, kiosk_account_id, user_id, status, started_at, ended_at`,
    [session_id, user_id]
  );
  return rows[0] || null;
};
module.exports = {
  createSession,
  getActiveSessionByKiosk,
  endSession,
  updateUserIdBySessionId
};
