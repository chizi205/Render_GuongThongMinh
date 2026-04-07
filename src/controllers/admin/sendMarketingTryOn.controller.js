const path = require("path");
const pool = require("../../config/database"); // Import pool để truy vấn SQL trực tiếp

const fitroom = require("../../services/external/fitroom.client");

const ZaloService = require("../../services/external/zalooa.client");

// Import Cloudinary (Dùng để lưu vĩnh viễn ảnh từ Fitroom trước khi gửi Zalo)
const CloudinaryModule = require("../../utils/upClound"); 
const CloudinaryService = CloudinaryModule.default || CloudinaryModule; 

const { ok, serverError, badRequest } = require("../../utils/response");

// --- 1. HÀM TRỢ GIÚP LẤY ẢNH NGƯỜI DÙNG MỚI NHẤT ---
const getLatestUserImage = async (userId) => {
  const query = `
    SELECT tti.url 
    FROM tryon_temp_images tti
    JOIN kiosk_sessions ks ON tti.kiosk_session_id = ks.id
    WHERE ks.user_id = $1
    ORDER BY tti.seq_no DESC -- Dùng seq_no thay vì uploaded_at để lấy đúng cái cuối cùng được insert
    LIMIT 1;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows[0]?.url;
};

// --- 2. HÀM TRỢ GIÚP LẤY ẢNH SẢN PHẨM (ĐÃ SỬA LỖI SQL) ---
// --- 2. HÀM TRỢ GIÚP LẤY ẢNH SẢN PHẨM (Sửa lại đúng bảng product_variants) ---
const getProductImage = async (productId) => {
  const query = `
    SELECT model_3d_url, image_urls 
    FROM product_variants 
    WHERE product_id = $1 
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [productId]);
  
  if (rows.length > 0) {
    // Ưu tiên lấy model_3d_url, nếu không có thì lấy ảnh đầu tiên trong mảng image_urls
    if (rows[0].model_3d_url) return rows[0].model_3d_url;
    if (rows[0].image_urls && rows[0].image_urls.length > 0) return rows[0].image_urls[0];
  }
  
  return null; // Trả về null nếu sản phẩm không có biến thể/ảnh nào
};

// --- CONTROLLER CHÍNH: MARKETING TỰ ĐỘNG ---
const sendMarketingTryOn = async (req, res) => {
  try {
    const { userIds, productIds, shopId } = req.body;
    
    if (!userIds || !productIds || !shopId) {
      return badRequest(res, "Thiếu userIds, productIds hoặc shopId");
    }

    console.log(`\x1b[36m>>> [START] Chiến dịch Marketing: Shop ${shopId}\x1b[0m`);
    const finalReport = [];

    // VÒNG LẶP 1: Chạy từng người dùng
    for (const userId of userIds) {
      console.log(`\n\x1b[33m--- Xử lý Khách hàng: ${userId} ---\x1b[0m`);
      
      // Tìm ảnh gốc mới nhất của User
      const userImage = await getLatestUserImage(userId);
      if (!userImage) {
        console.log(`\x1b[31m[!] User ${userId} chưa có ảnh gốc, bỏ qua!\x1b[0m`);
        finalReport.push({ userId, status: "FAILED", reason: "Không tìm thấy ảnh gốc" });
        continue; // Chuyển sang user tiếp theo
      }

      const listGeneratedImageUrls = [];

      // VÒNG LẶP 2: Chạy từng sản phẩm cho user hiện tại
      for (const productId of productIds) {
        try {
          const productImage = await getProductImage(productId);
          if (!productImage) {
            console.log(`[!] Sản phẩm ${productId} không có ảnh, bỏ qua.`);
            continue;
          }

          console.log(`  -> Gửi AI Fitroom (Product: ${productId})...`);
          
          // 1. Tạo Task Fitroom
          const task = await fitroom.createTryOnTask(userImage, productImage, "upper", true);
          
          // 2. Poll đợi kết quả (Chờ tối đa 2 phút theo config của bạn)
          const result = await fitroom.pollTaskUntilComplete(task.task_id);

          if (result && result.download_signed_url) {
            // Lấy URL tạm thời từ AI
            const tempAiUrl = result.download_signed_url;

            console.log(`  -> Đang lưu ảnh lên Cloudinary...`);
            const uploadRes = await CloudinaryService.uploadSingleImage(tempAiUrl, "marketing_tryon");

            if (uploadRes && uploadRes.secure_url) {
              listGeneratedImageUrls.push(uploadRes.secure_url);
              console.log(`  [OK] Đã tạo ảnh: ${uploadRes.secure_url}`);
            }
          }
        } catch (err) {
          console.error(`\x1b[31m  [!] Lỗi Fitroom tại SP ${productId}:\x1b[0m`, err.message);
        }
      }

      // VÒNG LẶP 3: Gửi qua Zalo
      if (listGeneratedImageUrls.length > 0) {
        try {
          console.log(`\x1b[32m>>> [Zalo] Đang gửi ${listGeneratedImageUrls.length} ảnh cho ${userId}...\x1b[0m`);
          
          await ZaloService.sendImages(shopId, userId, listGeneratedImageUrls);
          
          finalReport.push({ userId, status: "SUCCESS", imagesSent: listGeneratedImageUrls.length });
          
          await ZaloService.sendText(shopId, userId, "Hệ thống Gương Thông Minh gợi ý các sản phẩm này rất hợp với bạn. Hãy ghé cửa hàng để trải nghiệm nhé!");

        } catch (zaloErr) {
          console.error(`\x1b[31m>>> [Zalo] Thất bại:\x1b[0m`, zaloErr.message);
          finalReport.push({ userId, status: "ZALO_FAILED", reason: zaloErr.message });
        }
      } else {
        finalReport.push({ userId, status: "FAILED", reason: "Tất cả sản phẩm đều ghép lỗi AI" });
      }
    }

    console.log(`\x1b[36m>>> [DONE] Đã hoàn tất chiến dịch!\x1b[0m`);
    
    // ĐÃ SỬA LỖI STATUS CODE: Trả về số 200 thay vì text
    return ok(res, 200, {
      message: "Chiến dịch gửi Marketing hoàn tất",
      data: finalReport
    });

  } catch (error) {
    console.error("Lỗi sendMarketingTryOn:", error);
    return serverError(res, "Lỗi hệ thống khi gửi Marketing", error);
  }
};

// --- ĐÃ THÊM LẠI HÀM NÀY CHO BẠN ---
const sendImagesForAdmin = async (req, res) => {
  try {
    const { user_id, images, shop_id } = req.body;

    if (!images || images.length === 0) {
      return serverError(res, "MISSING_IMAGES");
    }

    if (!user_id || !shop_id) {
      return badRequest(res, "Thiếu user_id hoặc shop_id");
    }

    const data = await ZaloService.sendImages(shop_id, user_id, images);

    return ok(res, 200, {
      message: "SEND_IMAGES_SUCCESS",
      data,
    });
  } catch (err) {
    if (err.message === "USER_NOT_LINKED_ZALO") {
      return serverError(res, "USER_NOT_FOLLOW_ZALO_OA");
    }
    return serverError(res, err.message);
  }
};

module.exports = {
  sendMarketingTryOn,
  sendImagesForAdmin
};