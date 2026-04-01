// src/services/album.service.js
const albumRepo = require("../../repositories/album/album.repo");
class AlbumService {
  async createAlbum(data) {
    const { shop_id, kiosk_session_id, image_urls, user_id } = data;

    console.log(data);
    if (
      !shop_id ||
      !kiosk_session_id ||
      !image_urls ||
      image_urls.length === 0
    ) {
      throw new Error(
        "Thiếu thông tin bắt buộc hoặc không có ảnh nào được chọn.",
      );
    }

    // Gọi Repo để lưu vào DB
    const newAlbum = await albumRepo.createAlbum({
      shop_id,
      kiosk_session_id,
      user_id: user_id, // Có thể null
      image_urls: image_urls,
    });

    const domain = process.env.PUBLIC_URL;
    const shareUrl = `${domain}/public/kiosk/download.html?id=${newAlbum.id}`;

    return {
      albumId: newAlbum.id,
      shareUrl: shareUrl,
    };
  }

  async getAlbumImages(albumId) {
    if (!albumId) {
      throw new Error("Thiếu mã Album ID.");
    }

    const album = await albumRepo.getAlbumById(albumId);

    if (!album) {
      throw new Error("Mã QR không tồn tại hoặc Album đã bị xóa.");
    }

    // Kiểm tra xem QR đã hết hạn chưa (expires_at)
    if (new Date(album.expires_at) < new Date()) {
      throw new Error("Mã QR này đã hết hạn (Quá 7 ngày).");
    }

    // Tăng view_count chạy ngầm (không cần await để tránh làm chậm request)
    albumRepo
      .incrementViewCount(albumId)
      .catch((err) => console.error("Lỗi đếm view QR:", err));

    return album.image_urls;
  }
}

module.exports = new AlbumService();
