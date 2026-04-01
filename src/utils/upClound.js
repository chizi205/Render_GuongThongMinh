import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// ====================== CẤU HÌNH CLOUDINARY ======================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class CloudinaryService {

  /**
   * Upload 1 hoặc nhiều ảnh lên Cloudinary và trả về mảng secure_url
   * 
   * @param {Object|Array} files - File từ multer (req.file hoặc req.files)
   * @param {String} folder - Thư mục trên Cloudinary (mặc định: 'zalo_oa')
   * @returns {Promise<Array>} Mảng các secure_url
   */
  static async uploadImages(files, folder = 'zalo_oa') {
    try {
      // Nếu chỉ truyền 1 file (req.file) thì chuyển thành array
      if (!Array.isArray(files)) {
        files = [files];
      }

      if (files.length === 0) {
        throw new Error("Không có file nào để upload");
      }

      const uploadPromises = files.map(async (file) => {
        const options = {
          folder: folder,
          resource_type: 'image',
          fetch_format: 'auto',
          quality: 'auto',
          public_id: `zalo_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        };

        const result = await cloudinary.uploader.upload(
          file.path || file,   // hỗ trợ cả file.path (diskStorage) và buffer
          options
        );

        // Tối ưu link cho Zalo
        let secureUrl = result.secure_url;
        if (secureUrl.includes('/upload/') && !secureUrl.includes('f_auto')) {
          secureUrl = secureUrl.replace('/upload/', '/upload/f_auto,q_auto/');
        }

        return {
          secure_url: secureUrl,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes
        };
      });

      const results = await Promise.all(uploadPromises);

      console.log(`✅ Đã upload thành công ${results.length} ảnh lên Cloudinary`);

      return results;           // Trả về mảng object
      // Nếu bạn chỉ muốn mảng URL thuần thì dùng: return results.map(r => r.secure_url);

    } catch (error) {
      console.error("CloudinaryService.uploadImages error:", error);
      throw new Error(`Upload ảnh thất bại: ${error.message}`);
    }
  }

  /**
   * Upload 1 ảnh duy nhất và trả về secure_url
   */
  static async uploadSingleImage(file, folder = 'zalo_oa') {
    const results = await this.uploadImages(file, folder);
    return results[0];        // Trả về object của ảnh đầu tiên
  }
}

export default CloudinaryService;