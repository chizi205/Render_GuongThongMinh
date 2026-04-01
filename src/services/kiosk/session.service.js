const sessionRepo = require("../../repositories/kiosk/session.repo");

const ensureActiveSession = async ({
  kiosk_id,
  kiosk_account_id,
  user_id = null,
}) => {
  const active = await sessionRepo.getActiveSessionByKiosk({ kiosk_id });
  if (active) return active;

  return sessionRepo.createSession({ kiosk_id, kiosk_account_id, user_id });
};
const endSession = async ({ sessionId }) => {
  return sessionRepo.endSession({ sessionId });
};
module.exports = { ensureActiveSession, endSession };
