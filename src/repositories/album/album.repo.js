// src/repositories/album.repo.js
const { pool } = require("../../config/database");

class AlbumRepo {
  // Tạo album mới khi khách bấm "Tải ảnh" trên Kiosk
async createAlbum({ shop_id, kiosk_session_id, user_id, image_urls }) {
    const query = `
      INSERT INTO shared_albums (shop_id, kiosk_session_id, user_id, image_urls, expires_at)
      VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')
      RETURNING id, expires_at;
    `;
    const values = [shop_id, kiosk_session_id, user_id || null, image_urls];
    
    const { rows } = await pool.query(query, values);
    return rows[0]; // Trả về cả id và expires_at nếu cần dùng
  }
  // Lấy dữ liệu album dựa vào ID (để hiển thị lên web)
  async getAlbumById(id) {
    const query = `
      SELECT image_urls, expires_at 
      FROM shared_albums 
      WHERE id = $1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  // Tăng lượt xem (view_count) mỗi lần khách tải lại trang web
  async incrementViewCount(id) {
    const query = `
      UPDATE shared_albums 
      SET view_count = view_count + 1 
      WHERE id = $1;
    `;
    await pool.query(query, [id]);
  }
}

module.exports = new AlbumRepo();