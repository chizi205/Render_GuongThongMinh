const service = require("../../services/advertise/ad.service"); // Trỏ đúng path ad.service.js
const { ok, serverError, badRequest } = require("../../utils/response");

const generateRandomImages = async (req, res) => {
  try {
    const shopId = req.kiosk?.shop_id || req.body.shopId;
    const result = await service.generateRandomAdImages(shopId, parseInt(req.body.limit) || 5);
    return ok(res, 201, result);
  } catch (err) {
    return serverError(res);
  }
};

const selectManualImages = async (req, res) => {
  try {
    const shopId = req.kiosk?.shop_id || req.body.shopId;
    const { name, variantIds } = req.body;
    const result = await service.saveManualSelection(shopId, name, variantIds);
    return ok(res, 201, result);
  } catch (err) {
    return serverError(res);
  }
};

module.exports = { generateRandomImages, selectManualImages };