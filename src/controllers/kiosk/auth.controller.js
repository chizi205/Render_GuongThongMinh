const service = require("../../services/kiosk/auth.service");
const session = require("../../services/kiosk/session.service");
const {
  ok,
  badRequest,
  unauthorized,
  serverError,
} = require("../../utils/response");

const login = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const data = await service.login({ username, password });

    return ok(res, 200, {
      message: "LOGIN_SUCCESS",
      data,
    });
  } catch (err) {
    const code = err.status || 500;

    if (code === 400) return badRequest(res, err.message);
    if (code === 401) return unauthorized(res, err.message);

    return serverError(res, err.message || "Server error");
  }
};

const refresh = async (req, res) => {
  try {
    const { refresh_token } = req.body || {};
    const data = await service.refresh({ refresh_token });

    return ok(res, 200, {
      message: "REFRESH_SUCCESS",
      data,
    });
  } catch (err) {
    const code = err.status || 500;

    if (code === 400) return badRequest(res, err.message);
    if (code === 401) return unauthorized(res, err.message);

    return serverError(res, err.message || "Server error");
  }
};
const logout = async (req, res) => {
  try {
    const { refresh_token } = req.body || {};
    const data = await service.logout({ refresh_token });

    return ok(res, 200, {
      message: "LOGOUT_SUCCESS",
      data,
    });
  } catch (err) {
    const code = err.status || 500;

    if (code === 400) return badRequest(res, err.message);
    if (code === 401) return unauthorized(res, err.message);

    return serverError(res, err.message || "Server error");
  }
};


module.exports = { login, refresh, logout };
