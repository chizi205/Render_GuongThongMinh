const repo = require("../../repositories/kiosk/cart.repo");

// ========================================
// ADD ITEM TO CART
// ========================================
const addToCart = async (data) => {

  // 1. Validate cơ bản
  if (!data.kiosk_session_id || !data.product_variant_id) {
    const err = new Error("MISSING_REQUIRED_FIELDS");
    err.status = 400;
    throw err;
  }

  if (data.quantity && data.quantity <= 0) {
    const err = new Error("INVALID_QUANTITY");
    err.status = 400;
    throw err;
  }

  // 2. Lấy cart hiện tại
  let cart = await repo.getActiveCartBySession(data.kiosk_session_id);

  // 3. Nếu chưa có cart → tạo mới
  if (!cart) {
    cart = await repo.createCart({
      shop_id: data.shop_id,
      kiosk_id: data.kiosk_id,
      kiosk_session_id: data.kiosk_session_id,
      user_id: data.user_id || null
    });
  } 
  // 4. Nếu đã có cart nhưng chưa có user → update user
  else if (!cart.user_id && data.user_id) {
    await repo.updateCartUser(cart.id, data.user_id);
    cart.user_id = data.user_id;
  }

  // 5. (Optional) check tồn tại variant
  const variant = await repo.getVariantById(data.product_variant_id);
  if (!variant) {
    const err = new Error("PRODUCT_VARIANT_NOT_FOUND");
    err.status = 404;
    throw err;
  }

  // 6. (Optional) check stock
  if (variant.stock < (data.quantity || 1)) {
    const err = new Error("OUT_OF_STOCK");
    err.status = 400;
    throw err;
  }

  // 7. Add item
  const item = await repo.addCartItem(
    cart.id,
    data.product_variant_id,
    data.quantity || 1
  );

  return item;
};

// ========================================
// GET CART
// ========================================
const getCart = async ({ kiosk_session_id, kiosk_id }) => {

  const cart = await repo.getActiveCartBySessionAndKiosk(
    kiosk_session_id,
    kiosk_id
  );

  if (!cart) return null;

  const items = await repo.getCartItems(cart.id);

  return {
    ...cart,
    items
  };
};

// ========================================
// UPDATE ITEM
// ========================================
const updateItem = async ({ item_id, quantity, kiosk_id }) => {

  if (quantity <= 0) {
    return await removeItem({ item_id, kiosk_id });
  }

  // check item thuộc kiosk
  const item = await repo.getCartItemWithKiosk(item_id, kiosk_id);

  if (!item) {
    const err = new Error("ITEM_NOT_FOUND_OR_FORBIDDEN");
    err.status = 404;
    throw err;
  }

  return await repo.updateCartItem(item_id, quantity);
};

// ========================================
// REMOVE ITEM
// ========================================
const removeItem = async ({ item_id, kiosk_id }) => {

  const item = await repo.getCartItemWithKiosk(item_id, kiosk_id);

  if (!item) {
    const err = new Error("ITEM_NOT_FOUND_OR_FORBIDDEN");
    err.status = 404;
    throw err;
  }

  await repo.removeCartItem(item_id);
};

module.exports = {
  addToCart,
  getCart,
  updateItem,
  removeItem
};