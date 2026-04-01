const jwt = require("../utils/jwt");

module.exports = function kioskAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "MISSING_TOKEN" });
    }

    const payload = jwt.verifyAccessToken(token);

    if (!payload || payload.type !== "kiosk") {
      return res
        .status(401)
        .json({ success: false, message: "INVALID_KIOSK_TOKEN" });
    }

    req.kiosk = {
      kiosk_id: payload.kiosk_id,
      shop_id: payload.shop_id,
      zalo_oa_id: payload.zalo_oa_id,
      kiosk_account_id: payload.kiosk_account_id || null,
    };

    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "TOKEN_EXPIRED_OR_INVALID" });
  }
};
