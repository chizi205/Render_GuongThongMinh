const db = require("../../config/database");

const listKioskCategories = async (kioskId) => {
  const { rows } = await db.query(
    `SELECT
        pc.id,
        pc.name,
        pc.slug,
        kc.is_default,
        kc.sort_order
      FROM kiosk_categories kc
      JOIN product_categories pc ON pc.id = kc.category_id
      WHERE kc.kiosk_id = $1
        AND pc.is_active = TRUE
      ORDER BY kc.sort_order ASC, pc.name ASC`,
    [kioskId]
  );
  return rows;
};

const kioskHasCategory = async (kioskId, categoryId) => {
  const { rows } = await db.query(
    `SELECT 1 FROM kiosk_categories WHERE kiosk_id = $1 AND category_id = $2 LIMIT 1`,
    [kioskId, categoryId]
  );
  return rows.length > 0;
};

const listProductsByCategory = async (shopId, categoryId) => {
  const { rows } = await db.query(
    `SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.description,
        p.status,
        v.id AS variant_id,
        v.sku,
        v.size,
        v.color,
        v.price,
        v.stock,
        v.model_3d_url,
        v.image_urls
      FROM products p
      LEFT JOIN product_variants v ON v.product_id = p.id
      WHERE p.shop_id = $1
        AND p.category_id = $2
        AND p.status = 'active'
        AND p.deleted_at IS NULL
      ORDER BY p.created_at DESC, v.created_at ASC`,
    [shopId, categoryId]
  );
  return rows;
};

const listAllProducts = async (shopId, limit = 10, cursor = null) => {
  const params = [shopId, limit];
  let cursorCondition = '';

  if (cursor) {
    cursorCondition = `AND p.created_at < $3`;
    params.push(cursor);
  }

  const { rows } = await db.query(
    `SELECT 
         p.id AS product_id,
         p.name AS product_name,
         p.description,
         p.status,
         p.created_at,
         c.name AS category_name,
         COALESCE(
           json_agg(
             json_build_object(
               'variant_id', v.id,
               'sku', v.sku,
               'size', v.size,
               'color', v.color,
               'price', v.price,
               'stock', v.stock,
               'model_3d_url', v.model_3d_url,
               'image_urls', v.image_urls
             )
           ) FILTER (WHERE v.id IS NOT NULL), '[]'
         ) AS variants
      FROM products p
      JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN product_variants v ON v.product_id = p.id
      WHERE p.shop_id = $1 
        AND p.status = 'active'
        AND p.deleted_at IS NULL
        ${cursorCondition}
      GROUP BY p.id, c.name
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT $2`,
    params
  );

  let nextCursor = null;
  if (rows.length === limit) {
    nextCursor = rows[rows.length - 1].created_at;
  }

  return {
    data: rows,
    nextCursor: nextCursor
  };
};

// =========================================
// HÀM MỚI BỔ SUNG ĐỂ TẠO SẢN PHẨM GỘP
// =========================================

/**
 * Thêm sản phẩm vào bảng products
 * @param {Object} client - Đối tượng client từ pool.connect() để chạy transaction
 */
const insertProduct = async (client, { shop_id, category_id, name, description }) => {
  const query = `
    INSERT INTO products (shop_id, category_id, name, description, status)
    VALUES ($1, $2, $3, $4, 'active')
    RETURNING id;
  `;
  const { rows } = await client.query(query, [shop_id, category_id, name, description]);
  return rows[0].id;
};

/**
 * Thêm biến thể vào bảng product_variants
 * @param {Object} client - Đối tượng client từ pool.connect()
 */
const insertVariant = async (client, { product_id, sku, size, color, price, stock, model_3d_url }) => {
  const query = `
    INSERT INTO product_variants (product_id, sku, size, color, price, stock, model_3d_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const { rows } = await client.query(query, [
    product_id, sku, size, color, price, stock, model_3d_url
  ]);
  return rows[0];
};

module.exports = {
  listKioskCategories,
  kioskHasCategory,
  listProductsByCategory,
  listAllProducts,
  insertProduct, // Export hàm mới
  insertVariant  // Export hàm mới
};