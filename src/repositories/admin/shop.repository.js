const db = require("../../config/database");

class ShopRepository {
  // Lấy danh sách & Tìm kiếm (Phân trang Cursor)
  static async getList({ keyword, cursor, limit = 10 }) {
    let sql = `
      SELECT id, name, slug, zalo_oa_id, logo_url, status, created_at 
      FROM shops 
      WHERE is_deleted = false
    `;
    const params = [];
    let paramIndex = 1;

    if (keyword) {
      sql += ` AND (name ILIKE $${paramIndex} OR slug ILIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (cursor) {
      sql += ` AND created_at < $${paramIndex}::timestamp`;
      params.push(cursor);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const { rows } = await db.query(sql, params);
    const nextCursor = rows.length === limit ? rows[rows.length - 1].created_at : null;

    return { data: rows, nextCursor };
  }

  // Lấy chi tiết theo ID
  static async findById(id) {
    const sql = `SELECT * FROM shops WHERE id = $1 AND is_deleted = false`;
    const { rows } = await db.query(sql, [id]);
    return rows[0];
  }

  // Kiểm tra số lượng sản phẩm thuộc shop
  static async countProducts(shopId) {
    // Chú ý: bảng products cũng phải dùng is_deleted = false
    const sql = `SELECT COUNT(id) FROM products WHERE shop_id = $1 AND is_deleted = false`;
    const { rows } = await db.query(sql, [shopId]);
    return parseInt(rows[0].count);
  }

  // Kiểm tra Slug tồn tại chưa
  static async checkSlugExists(slug, excludeId = null) {
    let sql = `SELECT id FROM shops WHERE slug = $1 AND is_deleted = false`;
    const params = [slug];
    if (excludeId) {
      sql += ` AND id != $2`;
      params.push(excludeId);
    }
    const { rows } = await db.query(sql, params);
    return rows.length > 0;
  }

  // Thêm mới
  static async create(data) {
    const sql = `
      INSERT INTO shops (name, slug, zalo_oa_id, logo_url, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [data.name, data.slug, data.zalo_oa_id, data.logo_url, data.status || 'active'];
    const { rows } = await db.query(sql, values);
    return rows[0];
  }

  // Cập nhật
  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(id); 

    const sql = `
      UPDATE shops 
      SET ${fields.join(', ')} 
      WHERE id = $${paramIndex} AND is_deleted = false 
      RETURNING *
    `;
    const { rows } = await db.query(sql, values);
    return rows[0];
  }

  // Xóa (Xóa mềm - Soft Delete)
  static async softDelete(id) {
    const sql = `
      UPDATE shops 
      SET is_deleted = true, status = 'inactive', updated_at = NOW()
      WHERE id = $1 AND is_deleted = false 
      RETURNING id
    `;
    const { rows } = await db.query(sql, [id]);
    return rows[0];
  }
}

module.exports = ShopRepository;