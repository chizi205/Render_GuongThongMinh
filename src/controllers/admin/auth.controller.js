const adminAuthService = require("../../services/admin/auth.service");
const { ok, badRequest, serverError } = require("../../utils/response");

const register = async (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    if (!username || !email || !password) {
      return badRequest(res, "Vui lòng nhập đủ username, email và password!");
    }

    const data = await adminAuthService.register({ username, email, password, full_name, role });
    
    return ok(res, 201, { message: "Đăng ký thành công", data });
  } catch (err) {
    const code = err.status || 500;
    if (code === 400) return badRequest(res, err.message);
    return serverError(res, err.message);
  }
};

const login = async (req, res) => {
  try {
    // identifier có thể là username hoặc email
    const { username, password } = req.body; 

    if (!username || !password) {
      return badRequest(res, "Vui lòng nhập tài khoản và mật khẩu!");
    }

    const data = await adminAuthService.login({ username, password });
    
    return ok(res, 200, { message: "Đăng nhập thành công", data });
  } catch (err) {
    const code = err.status || 500;
    if (code === 400) return badRequest(res, err.message);
    return serverError(res, err.message);
  }
};

module.exports = {
  register,
  login
};