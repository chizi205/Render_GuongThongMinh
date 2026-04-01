const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authRepo = require("../../repositories/admin/auth.repo");

class AdminAuthService {
  // --- CHỨC NĂNG ĐĂNG KÝ (CẦN THÊM VÀO) ---
  static async register(data) {
    const { username, password, email, full_name, phone, shop_name } = data;

    // 1. Kiểm tra tài khoản tồn tại chưa
    const existingAdmin = await authRepo.findByUsernameOrEmail(username || email);
    if (existingAdmin) {
      const err = new Error("Username hoặc Email đã được sử dụng!");
      err.status = 400;
      throw err;
    }

    // 2. Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Lưu vào Database (Giả sử repo của bạn có hàm createAdmin)
    // Lưu ý: Bạn cần tạo Shop trước hoặc tạo cùng lúc tùy logic DB
   const newAdmin = await authRepo.create({
    username,
    email,
    password_hash: passwordHash,
    full_name,
    role: 'admin' 
  });

    delete newAdmin.password_hash;
    return newAdmin;
  }

  // --- CHỨC NĂNG ĐĂNG NHẬP (GIỮ NGUYÊN VÀ TỐI ƯU) ---
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

    const JWT_SECRET = process.env.JWT_SECRET || "admin_secret_key_tam_thoi"; 
    
    const accessToken = jwt.sign(
      { 
        id: admin.id, 
        username: admin.username, 
        role: admin.role,
        type: "admin" 
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    await authRepo.updateLastLogin(admin.id);
    delete admin.password_hash;

    return {
      accessToken,
      admin
    };
  }
}

module.exports = AdminAuthService;