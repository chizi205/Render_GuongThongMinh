const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authRepo = require("../../repositories/admin/auth.repo");
const config = require("../../config");

class AdminAuthService {
  // ... (Phần register giữ nguyên)

  // --- CHỨC NĂNG ĐĂNG NHẬP ---
  static async login({ username, password }) {
    const admin = await authRepo.findByUsernameOrEmail(username);
    if (!admin) {
      const err = new Error("Tài khoản không tồn tại hoặc đã bị khóa!");
      err.status = 400;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      const err = new Error("Sai mật khẩu!");
      err.status = 400;
      throw err;
    }

    // --- BƯỚC 3: SỬA LẠI Ở ĐÂY ---
    const JWT_SECRET = process.env.JWT_SECRET || "admin_secret_key_tam_thoi"; 
    
    const accessToken = jwt.sign(
      { 
        id: admin.id, 
        username: admin.username, 
        role: admin.role,
        type: "admin" // <<--- BẮT BUỘC PHẢI CÓ DÒNG NÀY ĐỂ MIDDLEWARE CHẤP NHẬN
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    await authRepo.updateLastLogin(admin.id);
    delete admin.password_hash;

    return {
      accessToken, // Frontend sẽ nhận cái này là data.accessToken hoặc data.data.accessToken
      admin
    };
  }
}

module.exports = AdminAuthService;