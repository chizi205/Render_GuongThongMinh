const service = require("../../services/external/zalooa.client");
const { ok, serverError } = require("../../utils/response");

const sendImages = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const shopId = req.kiosk.shop_id;
    const { images } = req.body;

    if (!images) {
      return serverError(res, "MISSING_IMAGES");
    }

    const data = await service.sendImages(shopId, user_id, images);

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
const sendText = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const shopId = req.kiosk.shop_id;
    const { text } = req.body;

    if (!text) {
      return serverError(res, "MISSING_TEXT");
    }

    const data = await service.sendText(shopId, user_id, text);

    return ok(res, 200, {
      message: "SEND_TEXT_SUCCESS",
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
  sendImages,
  sendText,
};
