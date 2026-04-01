const pool = require("../../config/database");

class AdminAuthRepository {
  // Lấy admin theo username hoặc email (Dùng cho cả Login và Check lúc Register)
  static async findByUsernameOrEmail(username) {
    const { rows } = await pool.query(
      `
      SELECT *
      FROM admins
      WHERE (username = $1 OR email = $1) AND is_active = true
      LIMIT 1
      `,
      [username]
    );
    return rows[0] || null;
  }

  // Tạo tài khoản Admin mới
  static async create({ username, email, password_hash, full_name, role }) {
    const { rows } = await pool.query(
      `
      INSERT INTO admins (username, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, full_name, role, is_active, created_at
      `,
      [username, email, password_hash, full_name || null, role || 'admin']
    );
    return rows[0]; // Trả về thông tin (không có password_hash)
  }

  // Cập nhật thời gian đăng nhập
  static async updateLastLogin(id) {
    await pool.query(
      `UPDATE admins SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }
}

module.exports = AdminAuthRepository;