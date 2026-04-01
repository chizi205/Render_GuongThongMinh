const db = require("../../config/database");

const insertTempImage = async ({ kiosk_session_id, filename, url }) => {
  const { rows } = await db.query(
    `INSERT INTO tryon_temp_images (kiosk_session_id, filename, url, uploaded_at, is_used)
     VALUES ($1, $2, $3, NOW(), false)
     RETURNING id, kiosk_session_id, filename, url, uploaded_at, is_used`,
    [kiosk_session_id, filename, url]
  );
  return rows[0];
};

const getTempImage = async ({ temp_image_id, kiosk_session_id }) => {
  const { rows } = await db.query(
    `SELECT id, kiosk_session_id, url, filename, is_used
     FROM tryon_temp_images
     WHERE id = $1 AND kiosk_session_id = $2
     LIMIT 1`,
    [temp_image_id, kiosk_session_id]
  );
  return rows[0] || null;
};

const getVariant = async ({ product_variant_id }) => {
  const { rows } = await db.query(
    `SELECT id, product_id, model_3d_url, image_urls
     FROM product_variants
     WHERE id = $1
     LIMIT 1`,
    [product_variant_id]
  );
  return rows[0] || null;
};

const insertTryOn = async ({ kiosk_session_id, product_variant_id, image_url, metadata }) => {
  const { rows } = await db.query(
    `INSERT INTO try_ons (kiosk_session_id, product_variant_id, image_url, metadata, sent_to_zalo)
     VALUES ($1, $2, $3, $4::jsonb, false)
     RETURNING id, kiosk_session_id, product_variant_id, image_url, tried_at, sent_to_zalo`,
    [kiosk_session_id, product_variant_id, image_url, JSON.stringify(metadata || {})]
  );
  return rows[0];
};

const markTempUsed = async ({ temp_image_id }) => {
  await db.query(
    `UPDATE tryon_temp_images SET is_used = true WHERE id = $1`,
    [temp_image_id]
  );
};

module.exports = {
  insertTempImage,
  getTempImage,
  getVariant,
  insertTryOn,
  markTempUsed,
};
