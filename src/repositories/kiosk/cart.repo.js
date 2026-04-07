const { pool } = require("../../config/database");

const getActiveCartBySession = async (kioskSessionId, kioskId) => {
  const query = `
    SELECT *
    FROM carts
    WHERE kiosk_session_id = $1
      AND kiosk_id = $2
      AND status = 'active'
    LIMIT 1
  `;
  const res = await pool.query(query, [kioskSessionId, kioskId]);
  return res.rows[0];
};

const createCart = async (data) => {
  const query = `
    INSERT INTO carts (shop_id, kiosk_id, kiosk_session_id, user_id)
    VALUES ($1,$2,$3,$4)
    RETURNING *
  `;

  const values = [
    data.shop_id,
    data.kiosk_id,
    data.kiosk_session_id,
    data.user_id
  ];

  const res = await pool.query(query, values);
  return res.rows[0];
};

// ========================================
// THÊM ITEM VÀO CART
// ========================================
const addCartItem = async (cartId, variantId, quantity) => {
  const query = `
    INSERT INTO cart_items (cart_id, product_variant_id, quantity)
    VALUES ($1,$2,$3)
    ON CONFLICT (cart_id, product_variant_id)
    DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
    RETURNING *
  `;

  const res = await pool.query(query, [cartId, variantId, quantity]);
  return res.rows[0];
};

// ========================================
// LẤY DANH SÁCH ITEM
// ========================================
const getCartItems = async (cartId, kioskId) => {
  const query = `
    SELECT
      ci.id,
      ci.quantity,
      pv.id as variant_id,
      pv.price,
      p.name
    FROM cart_items ci
    JOIN carts c ON ci.cart_id = c.id
    JOIN product_variants pv ON ci.product_variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    WHERE ci.cart_id = $1
      AND c.kiosk_id = $2
  `;

  const res = await pool.query(query, [cartId, kioskId]);
  return res.rows;
};

// ========================================
// UPDATE QUANTITY
// ========================================
const updateCartItem = async (itemId, quantity) => {
  const query = `
    UPDATE cart_items
    SET quantity = $1
    WHERE id = $2
    RETURNING *
  `;

  const res = await pool.query(query, [quantity, itemId]);
  return res.rows[0];
};

// ========================================
// REMOVE ITEM
// ========================================
const removeCartItem = async (itemId) => {
  const query = `
    DELETE FROM cart_items
    WHERE id = $1
  `;
  await pool.query(query, [itemId]);
};

const getCartItemWithKiosk = async (itemId, kioskId) => {
  const query = `
    SELECT ci.*
    FROM cart_items ci
    JOIN carts c ON ci.cart_id = c.id
    WHERE ci.id = $1
      AND c.kiosk_id = $2
  `;
  const res = await pool.query(query, [itemId, kioskId]);
  return res.rows[0];
};
const updateCartUser = async (cartId, userId) => {
  const query = `
    UPDATE carts
    SET user_id = $1, updated_at = NOW()
    WHERE id = $2
  `;
  await pool.query(query, [userId, cartId]);
};
const getVariantById = async (variantId) => {
  const query = `
    SELECT id, stock
    FROM product_variants
    WHERE id = $1
  `;
  const res = await pool.query(query, [variantId]);
  return res.rows[0];
};
module.exports = {
  getActiveCartBySession,
  createCart,
  addCartItem,
  getCartItems,
  updateCartItem,
  removeCartItem,
  getCartItemWithKiosk,
  updateCartUser,
  getVariantById
};