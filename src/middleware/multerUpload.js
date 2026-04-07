const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']; 
const maxFileSize = 10 * 1024 * 1024;

const createDynamicStorage = (folderType) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const basePath = config.upload.dir;

      let subPath = '';
      const shopPath = req.body.shop_id || req.body.slug || req.params.shopId || req.params.slug || 'default_shop';
      const userId = req.body.user_id || req.user?.id || 'default_user';

      switch (folderType) {
        case 'shop_logo':
          subPath = `shops/${shopPath}/logo`;
          break;
        case 'product':
          subPath = `products/${shopPath}`;
          break;
        case 'body_root':
          subPath = `bodies/${shopPath}/${userId}/root`;
          break;
        case 'body_tryon':
          subPath = `bodies/${shopPath}/${userId}/tryon`;
          break;
        default:
          subPath = 'others';
      }

      const fullPath = path.join(basePath, subPath);

      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }

      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uniqueSuffix}${ext}`);
    }
  });
};

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    const error = new Error(`Đuôi file không hợp lệ. Chỉ chấp nhận: ${allowedExtensions.join(', ')}`);
    error.code = 'INVALID_FILE_EXTENSION';
    return cb(error, false);
  }

  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(mime)) {
    const error = new Error('Loại file không phải ảnh hợp lệ');
    error.code = 'INVALID_MIME_TYPE';
    return cb(error, false);
  }

  cb(null, true);
};

const uploadShopLogo = multer({ storage: createDynamicStorage('shop_logo'), limits: { fileSize: maxFileSize }, fileFilter });
const uploadProduct = multer({ storage: createDynamicStorage('product'), limits: { fileSize: maxFileSize }, fileFilter });
const uploadBodyRoot = multer({ storage: createDynamicStorage('body_root'), limits: { fileSize: maxFileSize }, fileFilter });
const uploadBodyTryon = multer({ storage: createDynamicStorage('body_tryon'), limits: { fileSize: maxFileSize }, fileFilter });

module.exports = {
  uploadShopLogo: uploadShopLogo.single('logo'),
  uploadProductSingle: uploadProduct.single('image'), 
  uploadVariantSingle: uploadProduct.single('images'),
  uploadBodyRoot: uploadBodyRoot.single('bodyImage'),
  uploadBodyTryon: uploadBodyTryon.single('tryonImage'),
};