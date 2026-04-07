const path = require("path");
const fs = require("fs");
const axios = require("axios");
const sessionService = require("./session.service");
const tryonRepo = require("../../repositories/kiosk/tryon.repo");
const fitroom = require("../external/fitroom.client");
const sharp = require("sharp");

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

  const bodyImageUrl = `/${file.path.replace(/\\/g, "/")}`;

  await tryonRepo.updateCustomerImageUrl(session.id, bodyImageUrl);

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
    const err = new Error("INVALID_CLOTH_TYPE");
    err.status = 400;
    err.extra = { allowedClothTypes };
    throw err;
  }

  // ==================== LẤY DỮ LIỆU ====================
  const temp = await tryonRepo.getTempImage({
    temp_image_id,
    kiosk_session_id,
  });
  if (!temp) throw new Error("TEMP_IMAGE_NOT_FOUND");

  const variant = await tryonRepo.getVariant({ product_variant_id });
  if (!variant) throw new Error("VARIANT_NOT_FOUND");

  const clothFilename = variant.model_3d_url;
  if (!clothFilename) throw new Error("CLOTH_IMAGE_MISSING");

  const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
  const modelFilePath = path.join(process.cwd(), temp.url);
  const clothFilePath = path.join(process.cwd(), clothFilename);

  if (!fs.existsSync(modelFilePath)) throw new Error("BODY_FILE_NOT_FOUND");
  if (!fs.existsSync(clothFilePath)) throw new Error("CLOTH_FILE_NOT_FOUND");

  // ==================== RESIZE TỐI ƯU (theo docs FitRoom) ====================
  const tempDir = path.join(process.cwd(), UPLOAD_DIR, "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const timestamp = Date.now();
  const resizedModelPath = path.join(tempDir, `resized_model_${timestamp}.jpg`);
  const resizedClothPath = path.join(tempDir, `resized_cloth_${timestamp}.jpg`);

  await Promise.all([
    sharp(modelFilePath)
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toFile(resizedModelPath),
    sharp(clothFilePath)
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toFile(resizedClothPath),
  ]);

  // ==================== TẠO TASK FITROOM (QUAN TRỌNG: hd_mode = false) ====================
  const task = await fitroom.createTryOnTask(
    resizedModelPath,
    resizedClothPath,
    clothType,
    false, // ←←← ĐÃ ĐỔI TỪ true → false (tắt HD mode)
  );

  // ==================== POLLING NHANH HƠN ====================
  const pollInterval = 1000; // 1 giây
  const maxAttempts = 35; // tối đa ~35 giây (an toàn)

  let finalResult = null;

  for (let i = 0; i < maxAttempts; i++) {
    const result = await fitroom.getTaskStatus(task.task_id);

    if (result.status === "COMPLETED") {
      finalResult = result;
      break;
    }

    if (result.status === "FAILED") {
      fs.unlinkSync(resizedModelPath);
      fs.unlinkSync(resizedClothPath);
      throw new Error("FITROOM_FAILED");
    }

    await new Promise((r) => setTimeout(r, pollInterval));
  }

  if (!finalResult) {
    fs.unlinkSync(resizedModelPath);
    fs.unlinkSync(resizedClothPath);
    const err = new Error("FITROOM_TIMEOUT");
    err.status = 504;
    throw err;
  }

  if (!finalResult.download_signed_url) {
    fs.unlinkSync(resizedModelPath);
    fs.unlinkSync(resizedClothPath);
    throw new Error("NO_DOWNLOAD_URL");
  }

  // ==================== DOWNLOAD & LƯU ====================
  const filename = `tryon_${kiosk_session_id}_${Date.now()}.jpg`;
  const savePath = path.join(process.cwd(), UPLOAD_DIR, filename);

  const response = await axios({
    url: finalResult.download_signed_url,
    method: "GET",
    responseType: "stream",
    timeout: 15000,
  });

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(savePath);
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  if (!fs.existsSync(savePath) || fs.statSync(savePath).size === 0) {
    fs.unlinkSync(resizedModelPath);
    fs.unlinkSync(resizedClothPath);
    throw new Error("DOWNLOAD_FAILED");
  }

  fs.unlinkSync(resizedModelPath);
  fs.unlinkSync(resizedClothPath);

  // ==================== LƯU DATABASE ====================
  const saved = await tryonRepo.insertTryOn({
    kiosk_session_id,
    product_variant_id,
    image_url: `/uploads/${filename}`,
    metadata: finalResult,
  });

  await tryonRepo.markTempUsed({ temp_image_id });

  return {
    try_on_id: saved.id,
    downloadUrl: saved.image_url,
    status: "COMPLETED",
  };
};

module.exports = { uploadBodyImage, processTryOn };
