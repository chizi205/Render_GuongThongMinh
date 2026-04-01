const { ok, badRequest, serverError } = require("../../utils/response");
const config = require("../../config");
const tryonService = require("../../services/kiosk/tryon.service");

const uploadBody = async (req, res) => {
  try {
    const { kiosk_id, kiosk_account_id } = req.kiosk || {};

    // 1. Validate kiosk info (từ middleware auth)
    if (!kiosk_id || !kiosk_account_id) {
      return badRequest(res, "Thiếu thông tin kiosk hoặc tài khoản", {
        code: "MISSING_KIOSK_INFO",
      });
    }

    // 2. Validate file từ Multer
    if (!req.file) {
      return badRequest(res, "Không tìm thấy file ảnh", {
        code: "NO_FILE_UPLOADED",
      });
    }

    const { filename, path: filePath, size, mimetype } = req.file;

    // Optional: log để debug (nên dùng logger thay console)
    console.log(
      `[Upload Body] Kiosk ${kiosk_id} - File: ${filename}, Size: ${size} bytes, Type: ${mimetype}`,
    );

    // 3. Gọi service
    const data = await tryonService.uploadBodyImage({
      kiosk_id,
      kiosk_account_id,
      file: req.file,
      publicUrl: config.publicUrl,
    });

    // 4. Response thành công – trả về thông tin cụ thể để frontend dùng ngay
    return ok(res, 200, {
      ...data,
      message: "Ảnh toàn thân đã chụp thành công, tiếp tục chọn đồ",
    });
  } catch (err) {
    // Log lỗi để dễ debug sau này
    console.error("[Upload Body Error]", {
      kiosk_id: req.kiosk?.kiosk_id,
      error: err.message,
      stack: err.stack?.substring(0, 300), // tránh log quá dài
    });

    const status = err.status || 500;
    const message = err.message || "Lỗi hệ thống khi xử lý ảnh";

    if (status === 400) {
      return badRequest(res, message, err.extra || { code: err.code });
    }

    if (status === 413) {
      // Multer LIMIT_FILE_SIZE
      return badRequest(res, "Dung lượng ảnh vượt quá giới hạn (10MB)", {
        code: "FILE_TOO_LARGE",
      });
    }

    return serverError(res, message);
  } finally {
  }
};

const processTryOn = async (req, res) => {
  try {
    const data = await tryonService.processTryOn(req.body || {});
    return ok(res, 200, { message: "TRYON_SUCCESS", data });
  } catch (err) {
    const code = err.status || 500;
    if (code === 400) return badRequest(res, err.message, err.extra || {});
    return serverError(res, err.message);
  }
};

module.exports = { uploadBody, processTryOn };
