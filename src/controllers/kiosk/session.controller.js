const sessionService = require("../../services/kiosk/session.service");
const { ok, badRequest, serverError } = require("../../utils/response");

const createSession = async (req, res) => {
  try {
    const { kiosk_id, kiosk_account_id } = req.kiosk || {};

    if (!kiosk_id || !kiosk_account_id) {
      return badRequest(res, "MISSING_KIOSK_CONTEXT");
    }

    const session = await sessionService.ensureActiveSession({
      kiosk_id,
      kiosk_account_id,
    });

    return ok(res, 200, {
      message: "CREATE_SESSION_SUCCESS",
      kiosk_session_id: session.id,
    });
  } catch (err) {
    const code = err.status || 500;

    if (code === 400) {
      return badRequest(res, err.message, err.extra || {});
    }

    return serverError(res, err.message || "Server error");
  }
};

const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;           // Lấy từ URL: /sessions/:sessionId
    const { kiosk_id } = req.kiosk || {};       // Từ middleware kioskAuth

    // Kiểm tra bắt buộc
    if (!sessionId) {
      return badRequest(res, "MISSING_SESSION_ID");
    }

    if (!kiosk_id) {
      return badRequest(res, "MISSING_KIOSK_CONTEXT");
    }

    const endedSession = await sessionService.endSession({
      sessionId      
    });

 

    return ok(res, 200, {
      message: "END_SESSION_SUCCESS",
      sessionId,
      status: endedSession?.status || "ended",
    });
  } catch (err) {
    console.error("Lỗi end session:", err);

    const code = err.status || 500;

    if (code === 400) {
      return badRequest(res, err.message, err.extra || {});
    }

    if (code === 404) {
      return notFound(res, err.message || "Session không tồn tại");
    }

    return serverError(res, err.message || "Server error");
  }
};

module.exports = {
  createSession,
  endSession,
};
