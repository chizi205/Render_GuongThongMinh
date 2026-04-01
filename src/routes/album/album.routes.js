// src/routes/album.routes.js
const express = require('express');
const router = express.Router();
const albumController = require('../../controllers/album/album.controller');
const kioskAuth = require("../../middleware/authKiosk");
const userAuth = require("../../middleware/authUser");
// Khai báo middleware xác thực (nếu cần). Ví dụ: Kiosk thì cần authKiosk, khách xem web thì tải tự do.

// API 1: Dành cho phần mềm Kiosk gọi để tạo QR Code lưu ảnh
// Có thể thêm middleware authKiosk vào giữa nếu bạn muốn bảo mật: router.post('/create', authKiosk, albumController.createAlbum);
router.post('/create',kioskAuth,userAuth, albumController.createAlbum);

// API 2: Dành cho trình duyệt web của khách hàng (khi quét mã QR) gọi để lấy ảnh
router.get('/:id', albumController.getAlbum);

module.exports = router;