const jwt = require("../utils/jwt");

module.exports = function userAuth(req, res, next) {
  try {
     const token = req.headers["x-user-token"];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "MISSING_TOKEN",
      });
    }

    const payload = jwt.verifyAccessToken(token);

    if (!payload || payload.type !== "user") {
      return res.status(401).json({
        success: false,
        message: "INVALID_USER_TOKEN",
      });
    }

    req.user = {
      user_id: payload.user_id,
      phone: payload.phone || null,
      role: payload.role || "user",
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "TOKEN_EXPIRED_OR_INVALID",
    });
  }
};