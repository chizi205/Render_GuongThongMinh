const { pool } = require("../../config/database");

// ==========================================
// 1. QUẢN LÝ SẢN PHẨM (PRODUCTS)
// ==========================================

const getProductsByCategory = async ({
  shop_id,
  category_id,
  search,
  limit = 10,
  cursor = null,
}) => {
  let queryParams = [limit];
  let whereClause = `WHERE p.is_deleted = false`;

  if (shop_id) {
    whereClause += ` AND p.shop_id = $${queryParams.length + 1}`;
    queryParams.push(shop_id);
  }
  if (category_id) {
    whereClause += ` AND p.category_id = $${queryParams.length + 1}`;
    queryParams.push(category_id);
  }
  if (search) {
    whereClause += ` AND p.name ILIKE $${queryParams.length + 1}`;
    queryParams.push(`%${search}%`);
  }
  if (cursor) {
    whereClause += ` AND p.id < $${queryParams.length + 1}`;
    queryParams.push(cursor);
  }

  const sql = `
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN product_categories c ON p.category_id = c.id
    ${whereClause}
    ORDER BY p.id DESC
    LIMIT $1
  `;

  const result = await pool.query(sql, queryParams);
  const products = result.rows;

  if (products.length > 0) {
    const productIds = products.map((p) => p.id);
    const variantsResult = await pool.query(
      `
      SELECT * FROM product_variants 
      WHERE product_id = ANY($1)
      ORDER BY created_at ASC
    `,
      [productIds],
    );

    products.forEach((p) => {
      p.variants = variantsResult.rows.filter((v) => v.product_id === p.id);
    });
  }
  return products;
};

const getProductById = async (id) => {
  const sql = `
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN product_categories c ON p.category_id = c.id
    WHERE p.id = $1 AND p.is_deleted = false
  `;
  const res = await pool.query(sql, [id]);
  const product = res.rows[0];

  if (product) {
    const variantsResult = await pool.query(
      `
      SELECT * FROM product_variants WHERE product_id = $1 ORDER BY created_at ASC
    `,
      [id],
    );
    product.variants = variantsResult.rows;
  }
  return product;
};

// CẬP NHẬT: Thêm image_url, base_price, slug, sold_count, view_count
const createProduct = async (data) => {
  const {
    shop_id,
    category_id,
    name,
    description,
    status,
    image_url,
    base_price,
    slug,
  } = data;
  const sql = `
    INSERT INTO products (
      shop_id, category_id, name, description, status, image_url, base_price, slug, 
      sold_count, view_count, is_deleted, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, false, NOW(), NOW())
    RETURNING *;
  `;
  const values = [
    shop_id,
    category_id,
    name,
    description,
    status || "active",
    image_url,
    base_price || 0,
    slug,
  ];
  const result = await pool.query(sql, values);
  return result.rows[0];
};

// CẬP NHẬT: Thêm image_url, base_price, slug
const updateProduct = async (id, data) => {
  const {
    category_id,
    name,
    description,
    status,
    image_url,
    base_price,
    slug,
  } = data;
  const sql = `
UPDATE products 
    SET 
      category_id = COALESCE($1, category_id),
      name = COALESCE($2, name),
      description = COALESCE($3, description),
      status = COALESCE($4, status),
      image_url = COALESCE($5, image_url),
      base_price = COALESCE($6, base_price),
      slug = COALESCE($7, slug),
      updated_at = NOW()
    WHERE id = $8 AND is_deleted = false
    RETURNING *;
  `;
  const values = [
    category_id,
    name,
    description,
    status,
    image_url,
    base_price,
    slug,
    id,
  ];
  const result = await pool.query(sql, values);
  return result.rows[0];
};

const deleteProduct = async (id) => {
  const sql = `
    UPDATE products 
    SET is_deleted = true, status = 'inactive', updated_at = NOW()
    WHERE id = $1 AND is_deleted = false
    RETURNING *;
  `;
  const result = await pool.query(sql, [id]);
  return result.rows[0];
};

// ==========================================
// 2. QUẢN LÝ BIẾN THỂ (VARIANTS)
// ==========================================

const countVariantsByProductId = async (productId) => {
  const sql = `SELECT COUNT(*) FROM product_variants WHERE product_id = $1`;
  const result = await pool.query(sql, [productId]);
  return parseInt(result.rows[0].count, 10);
};

const createVariant = async (data) => {
  const { product_id, sku, size, color, price, stock, model_3d_url } = data;
  const sql = `
    INSERT INTO product_variants 
      (product_id, sku, size, color, price, stock, model_3d_url, image_urls, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, '{}'::text[], NOW(), NOW())
    RETURNING *;
  `;
  const values = [
    product_id,
    sku,
    size,
    color,
    price,
    stock || 0,
    model_3d_url,
  ];
  const result = await pool.query(sql, values);
  return result.rows[0];
};

const updateVariant = async (id, data) => {
  const { sku, size, color, price, stock, model_3d_url } = data;
  const sql = `
    UPDATE product_variants 
    SET 
      sku = COALESCE($1, sku),
      size = COALESCE($2, size),
      color = COALESCE($3, color),
      price = COALESCE($4, price),
      stock = COALESCE($5, stock),
      model_3d_url = COALESCE($6, model_3d_url),
      updated_at = NOW()
    WHERE id = $7
    RETURNING *;
  `;
  const values = [sku, size, color, price, stock, model_3d_url, id];
  const result = await pool.query(sql, values);
  return result.rows[0];
};

const deleteVariant = async (id) => {
  const sql = `DELETE FROM product_variants WHERE id = $1 RETURNING *;`;
  const result = await pool.query(sql, [id]);
  return result.rows[0];
};

module.exports = {
  getProductsByCategory,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  countVariantsByProductId,
  createVariant,
  updateVariant,
  deleteVariant,
};
