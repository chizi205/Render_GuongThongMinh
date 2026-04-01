const path = require("path");
const fs = require("fs");
const axios = require("axios");
const sessionService = require("./session.service");
const tryonRepo = require("../../repositories/kiosk/tryon.repo");
const fitroom = require("../external/fitroom.client");

const uploadBodyImage = async ({
  kiosk_id,
  kiosk_account_id,
  file,
  publicUrl,
}) => {
  if (!file) {
    const err = new Error("MISSING_BODY_IMAGE");
    err.status = 400;
    throw err;
  }
  if (!kiosk_id || !kiosk_account_id) {
    const err = new Error("MISSING_KIOSK_CONTEXT");
    err.status = 400;
    throw err;
  }

  const session = await sessionService.ensureActiveSession({
    kiosk_id,
    kiosk_account_id,
  });

  const bodyImageUrl = `${publicUrl}/${file.path.replace(/\\/g, "/")}`;

  const temp = await tryonRepo.insertTempImage({
    kiosk_session_id: session.id,
    filename: file.filename,
    url: bodyImageUrl,
  });

  return {
    kiosk_session_id: session.id,
    temp_image_id: temp.id,
    bodyImageUrl,
  };
};
const allowedClothTypes = ["upper", "lower", "full"];

const processTryOn = async ({
  kiosk_session_id,
  temp_image_id,
  product_variant_id,
  cloth_type,
}) => {
  if (!kiosk_session_id || !temp_image_id || !product_variant_id) {
    const err = new Error("MISSING_PARAMS");
    err.status = 400;
    throw err;
  }
  const clothType = cloth_type || "upper";
  if (!allowedClothTypes.includes(clothType)) {
    return badRequest(res, "INVALID_CLOTH_TYPE", {
      good_clothes_types: allowedClothTypes,
    });
  }
  const temp = await tryonRepo.getTempImage({
    temp_image_id,
    kiosk_session_id,
  });
  if (!temp) {
    const err = new Error("TEMP_IMAGE_NOT_FOUND");
    err.status = 400;
    throw err;
  }

  const variant = await tryonRepo.getVariant({ product_variant_id });
  if (!variant) {
    const err = new Error("VARIANT_NOT_FOUND");
    err.status = 400;
    throw err;
  }

  const clothFilename = variant.model_3d_url; // tên ảnh đồ
  if (!clothFilename) {
    const err = new Error("CLOTH_IMAGE_MISSING");
    err.status = 400;
    throw err;
  }

  const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
  const modelFilePath = path.join(process.cwd(), UPLOAD_DIR, temp.filename);
  const clothFilePath = path.join(process.cwd(), UPLOAD_DIR, clothFilename);

  if (!fs.existsSync(modelFilePath)) {
    const err = new Error("BODY_FILE_NOT_FOUND");
    err.status = 400;
    err.extra = { modelFilePath };
    throw err;
  }
  if (!fs.existsSync(clothFilePath)) {
    const err = new Error("CLOTH_FILE_NOT_FOUND");
    err.status = 400;
    err.extra = { clothFilePath };
    throw err;
  }

  // gọi Fitroom
  const task = await fitroom.createTryOnTask(
    modelFilePath,
    clothFilePath,
    clothType, // <-- dùng cái user chọn
    true,
  );

  const finalResult = await fitroom.pollTaskUntilComplete(task.task_id);

  if (!finalResult?.download_signed_url) {
    const err = new Error("FITROOM_NO_DOWNLOAD_URL");
    err.status = 502;
    throw err;
  }

  // === THÊM PHẦN NÀY: Tải về và lưu vào server của bạn ===
  // Tạo tên file mới (ví dụ: tryon_<kiosk_session_id>_<timestamp>.jpg)
  const timestamp = Date.now();
  const newFilename = `tryon_${kiosk_session_id}_${timestamp}.jpg`;
  const localSavePath = path.join(process.cwd(), UPLOAD_DIR, newFilename);

  // Tải file từ signed URL
  const response = await axios({
    url: finalResult.download_signed_url,
    method: "GET",
    responseType: "stream", // quan trọng: stream để tải file lớn ổn định
  });

  const writer = fs.createWriteStream(localSavePath);

  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  // Optional: check file tồn tại và có kích thước > 0
  if (!fs.existsSync(localSavePath) || fs.statSync(localSavePath).size === 0) {
    throw new Error("DOWNLOADED_FILE_INVALID");
  }

  // Lưu vào DB: dùng URL/file path của bạn (không dùng signed URL của Fitroom nữa)
  const saved = await tryonRepo.insertTryOn({
    kiosk_session_id,
    product_variant_id,
    image_url: `/uploads/${newFilename}`, // hoặc full URL nếu bạn serve static files
    // hoặc nếu dùng S3/Cloud Storage: s3Key hoặc public URL
    metadata: {
      ...finalResult,
      original_fitroom_url: finalResult.download_signed_url, // lưu tạm để debug
      saved_filename: newFilename,
    },
  });

  await tryonRepo.markTempUsed({ temp_image_id });

  return {
    try_on_id: saved.id,
    downloadUrl: saved.image_url, // bây giờ là URL permanent của bạn
    status: finalResult.status,
  };
};

module.exports = { uploadBodyImage, processTryOn };
