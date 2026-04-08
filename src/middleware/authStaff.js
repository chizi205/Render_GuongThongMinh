const jwt = require("../utils/jwt");

module.exports = function staffAuth(req, res, next) {
  try {
    const token = req.headers["x-staff-token"];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "MISSING_TOKEN",
      });
    }

    const payload = jwt.verifyAccessToken(token);

    // check đúng loại token staff
    if (!payload || payload.type !== "staff") {
      return res.status(401).json({
        success: false,
        message: "INVALID_STAFF_TOKEN",
      });
    }

    // gán thông tin staff vào request
    req.staff = {
      staff_id: payload.id,
      shop_id: payload.shop_id,
      role: payload.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "TOKEN_EXPIRED_OR_INVALID",
    });
  }
};