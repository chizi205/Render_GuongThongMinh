const service = require("../../services/user/auth.service");
const {
  ok,
  badRequest,
  unauthorized,
  serverError,
} = require("../../utils/response");

const register = async (req, res) => {
  try {
    const { full_name, phone, gender, password, email, address, session_id } =
      req.body || {};

    const data = await service.register({
      full_name,
      phone,
      gender,
      password,
      email,
      address,
      session_id,
    });

    return ok(res, 201, {
      message: "REGISTER_SUCCESS",
      data,
    });
  } catch (err) {
    const code = err.status || 500;

    if (code === 400) {
      return badRequest(res, err.message, err.extra || {});
    }

    return serverError(res, err.message || "Server error");
  }
};

const login = async (req, res) => {
  try {
    const { phone, password, session_id } = req.body || {};

    const data = await service.login({
      phone,
      password,
      session_id,
    });

    return ok(res, 200, {
      message: "LOGIN_SUCCESS",
      data,
    });
  } catch (err) {
    const code = err.status || 500;

    if (code === 400) return badRequest(res, err.message, err.extra || {});
    if (code === 401) return unauthorized(res, err.message);

    return serverError(res, err.message || "Server error");
  }
};

const checkIsFollow = async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    const shopId = req.kiosk?.shop_id;
    const oaId = req.kiosk?.zalo_oa_id;
    console.log(oaId)

    if (!user_id || !shopId) {
      return res.json({
        success: false,
        is_follow: false,
        follow_url: null,
      });
    }

    const isFollow = await service.checkUserFollowOA({
      shopId,
      userId: user_id,
    });

    if (isFollow) {
      return res.json({
        success: true,
        is_follow: true,
        follow_url: null,
      });
    }

    const ref = `shop_${shopId}_user_${user_id}`;
    const followUrl = oaId ? `https://oa.zalo.me/${oaId}?ref=${ref}` : null;

    return res.json({
      success: true,
      is_follow: false,
      follow_url: followUrl,
    });
  } catch (err) {
    console.error("checkIsFollow error:", err);

    return res.json({
      success: false,
      is_follow: false,
      follow_url: null,
    });
  }
};
module.exports = {
  register,
  login,
  checkIsFollow,
};
