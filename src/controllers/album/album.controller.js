// src/controllers/album.controller.js
const albumService = require('../../services/album/album.service');

class AlbumController {
  // POST /api/album/create
  async createAlbum(req, res) {
    try {
      // 1. Lấy shop_id từ token (an toàn tuyệt đối)
      const shop_id = req.kiosk.shop_id; 
      const user_id=req.user.user_id;
      
      // 2. Lấy các thông tin còn lại từ body (do Kiosk gửi lên)
      const { kiosk_session_id, image_urls } = req.body;
      // 3. Gọi service
      const result = await albumService.createAlbum({
        shop_id,
        kiosk_session_id,
        user_id,
        image_urls
      });
      console.log(result)

      
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/album/:id
  async getAlbum(req, res) {
    try {
      const albumId = req.params.id;
      const imageUrls = await albumService.getAlbumImages(albumId);
      
      // Trả về đúng format mà file HTML của bạn đang dùng: result.success và result.data
      return res.status(200).json({
        success: true,
        data: imageUrls
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi lấy thông tin ảnh.'
      });
    }
  }
}

module.exports = new AlbumController();