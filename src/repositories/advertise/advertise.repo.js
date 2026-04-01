const { pool } = require("../../config/database");

const getRandomProducts = async (client, shopId, limit) => {
  const query = `
    SELECT pv.id, pv.image_urls, p.name
    FROM product_variants pv JOIN products p ON pv.product_id = p.id
    WHERE p.shop_id = $1 AND p.status = 'active' AND pv.image_urls IS NOT NULL AND array_length(pv.image_urls, 1) > 0
    ORDER BY RANDOM() LIMIT $2
  `;
  const res = await client.query(query, [shopId, limit]);
  return res.rows;
};

const insertAdEvent = async (client, shopId, name, type) => {
  const query = `
    INSERT INTO advertise_events (shop_id, name, type, status)
    VALUES ($1, $2, $3, 'active') RETURNING id, name, created_at
  `;
  const res = await client.query(query, [shopId, name, type]);
  return res.rows[0];
};

const insertAdEventImage = async (client, eventId, imageUrl, variantId, sortOrder) => {
  const query = `
    INSERT INTO advertise_event_images (advertise_event_id, image_url, product_variant_id, sort_order)
    VALUES ($1, $2, $3, $4)
  `;
  await client.query(query, [eventId, imageUrl, variantId, sortOrder]);
};

const getVariantsByIds = async (client, variantIds) => {
  const query = `SELECT id, image_urls FROM product_variants WHERE id = ANY($1)`;
  const res = await client.query(query, [variantIds]);
  return res.rows;
};

module.exports = { getRandomProducts, insertAdEvent, insertAdEventImage, getVariantsByIds };