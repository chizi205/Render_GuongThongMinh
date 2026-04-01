const jwt = require("../utils/jwt");

module.exports = function adminAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "MISSING_ADMIN_TOKEN" });
    }

    const payload = jwt.verifyAccessToken(token);

    // Kiểm tra type phải là admin (hoặc root_admin tùy logic của bạn)
    if (!payload || payload.type !== "admin") {
      return res
        .status(403) // 403 Forbidden vì có token nhưng sai quyền
        .json({ success: false, message: "REQUIRE_ADMIN_PRIVILEGES" });
    }

    // Lưu thông tin admin vào request để sử dụng ở controller nếu cần
    req.admin = {
      id: payload.id,
      email: payload.email,
      role: payload.role
    };

    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "ADMIN_TOKEN_EXPIRED_OR_INVALID" });
  }
};