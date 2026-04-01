const multer = require('multer');
const path = require('path');
const config = require('../config');

// Định nghĩa các loại file được phép (chỉ ảnh)
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']; // có thể thêm .gif nếu cần
const maxFileSize = 10 * 1024 * 1024; // 10MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  // Check extension
  if (!allowedExtensions.includes(ext)) {
    const error = new Error(
      `Đuôi file không hợp lệ. Chỉ chấp nhận: ${allowedExtensions.join(', ')}`
    );
    error.code = 'INVALID_FILE_EXTENSION';
    return cb(error, false);
  }

  // Check mimetype (phòng trường hợp ai đó đổi đuôi file)
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    // 'image/gif' nếu bạn muốn thêm
  ];
  if (!allowedMimeTypes.includes(mime)) {
    const error = new Error('Loại file không phải ảnh hợp lệ');
    error.code = 'INVALID_MIME_TYPE';
    return cb(error, false);
  }

  // Nếu qua được 2 check trên → ok
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter,
});

// Export nhiều handler tùy theo nhu cầu
module.exports = {
  uploadLocal: upload,                    // dùng khi cần upload nhiều file
  uploadBodyImage: upload.single('bodyImage'),   // dùng cho route upload 1 ảnh body
  uploadProductImage: upload.single('productImage'), // ví dụ thêm nếu cần
  // Nếu sau này cần nhiều ảnh: upload.array('images', 5)
};