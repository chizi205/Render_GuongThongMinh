const service = require("../../services/kiosk/cart.service");

// ========================================
// ADD ITEM
// ========================================
const addItem = async (req, res, next) => {
  try {

    const result = await service.addToCart({
      shop_id: req.kiosk.shop_id,
      kiosk_id: req.kiosk.kiosk_id,
      kiosk_session_id: req.body.kiosk_session_id,
      user_id: req.user?.user_id || null, // ✅ thêm dòng này
      product_variant_id: req.body.product_variant_id,
      quantity: req.body.quantity || 1
    });

    res.json({ success: true, data: result });

  } catch (err) {
    next(err);
  }
};

const getCart = async (req, res, next) => {
  try {

    const cart = await service.getCart({
      kiosk_session_id: req.params.sessionId,
      kiosk_id: req.kiosk.kiosk_id
    });

    res.json({
      success: true,
      message: "GET_CART_SUCCESS",
      data: cart
    });

  } catch (err) {
    next(err);
  }
};

// UPDATE ITEM
const updateItem = async (req, res, next) => {
  try {

    if (req.body.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "INVALID_QUANTITY"
      });
    }

    const result = await service.updateItem({
      item_id: req.params.itemId,
      quantity: req.body.quantity,
      kiosk_id: req.kiosk.kiosk_id
    });

    res.json({
      success: true,
      message: "UPDATE_CART_ITEM_SUCCESS",
      data: result
    });

  } catch (err) {
    next(err);
  }
};

// REMOVE ITEM
const removeItem = async (req, res, next) => {
  try {

    await service.removeItem({
      item_id: req.params.itemId,
      kiosk_id: req.kiosk.kiosk_id
    });

    res.json({
      success: true,
      message: "ITEM_REMOVED"
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  addItem,
  getCart,
  updateItem,
  removeItem
};