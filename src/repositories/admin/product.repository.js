const { pool } = require("../../config/database");

// ==========================================
// 1. QUẢN LÝ SẢN PHẨM (PRODUCTS)
// ==========================================

// Lấy danh sách (Có: Phân trang Cursor, Lọc Category, Tìm kiếm Tên)
const getProductsByCategory = async ({ category_id, search, limit = 10, cursor = null }) => {
  let queryParams = [limit];
  let whereClause = `WHERE p.deleted_at IS NULL`;
  
  // Lọc theo danh mục
  if (category_id) {
    whereClause += ` AND p.category_id = $${queryParams.length + 1}`;
    queryParams.push(category_id);
  }

  // Lọc theo từ khóa tìm kiếm (Tên sản phẩm)
  if (search) {
    whereClause += ` AND p.name ILIKE $${queryParams.length + 1}`;
    queryParams.push(`%${search}%`);
  }

  // Phân trang bằng Cursor
  if (cursor) {
    whereClause += ` AND p.id < $${queryParams.length + 1}`;
    queryParams.push(cursor);
  }

  // Lấy Sản phẩm & Tên danh mục
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

  // Lấy thêm danh sách Biến thể (Variants) nhét vào trong Sản phẩm
  if (products.length > 0) {
    const productIds = products.map(p => p.id);
    const variantsResult = await pool.query(`
      SELECT * FROM product_variants 
      WHERE product_id = ANY($1)
      ORDER BY created_at ASC
    `, [productIds]);
    
    products.forEach(p => {
      // Lọc các biến thể thuộc về sản phẩm này
      p.variants = variantsResult.rows.filter(v => v.product_id === p.id);
      
      // MẸO: Vì bảng 'products' trong db.sql không có cột 'image_url', 
      // ta tự động lấy ảnh của biến thể đầu tiên làm ảnh đại diện hiển thị ra Table.
      if (p.variants.length > 0 && p.variants[0].image_urls && p.variants[0].image_urls.length > 0) {
        p.image_url = p.variants[0].image_urls[0];
      }
    });
  }

  return products;
};

// Tạo Sản phẩm
const createProduct = async (data) => {
  // Lưu ý: shop_id bắt buộc phải có theo schema db.sql của bạn
  const { shop_id, category_id, name, description, status } = data;
  const sql = `
    INSERT INTO products (shop_id, category_id, name, description, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    RETURNING *;
  `;
  const values = [shop_id, category_id, name, description, status || 'active'];
  const result = await pool.query(sql, values);
  return result.rows[0];
};

// Cập nhật Sản phẩm
const updateProduct = async (id, data) => {
  const { category_id, name, description, status } = data;
  const sql = `
    UPDATE products 
    SET 
      category_id = COALESCE($1, category_id),
      name = COALESCE($2, name),
      description = COALESCE($3, description),
      status = COALESCE($4, status),
      updated_at = NOW()
    WHERE id = $5 AND deleted_at IS NULL
    RETURNING *;
  `;
  const values = [category_id, name, description, status, id];
  const result = await pool.query(sql, values);
  return result.rows[0];
};

// Xóa Sản phẩm (Soft Delete)
const deleteProduct = async (id) => {
  const sql = `
    UPDATE products 
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = $1
    RETURNING *;
  `;
  const result = await pool.query(sql, [id]);
  return result.rows[0];
};


// ==========================================
// 2. QUẢN LÝ BIẾN THỂ (VARIANTS)
// ==========================================

// Tạo Biến thể
const createVariant = async (data) => {
  const { product_id, sku, size, color, price, stock, model_3d_url, image_urls } = data;
  const sql = `
    INSERT INTO product_variants 
      (product_id, sku, size, color, price, stock, model_3d_url, image_urls, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    RETURNING *;
  `;
  // DB yêu cầu image_urls là mảng text[] nên phải truyên mảng vào đây
  const values = [product_id, sku, size, color, price, stock || 0, model_3d_url, image_urls || []];
  const result = await pool.query(sql, values);
  return result.rows[0];
};

// Cập nhật Biến thể
const updateVariant = async (id, data) => {
  const { sku, size, color, price, stock, model_3d_url, image_urls } = data;
  const sql = `
    UPDATE product_variants 
    SET 
      sku = COALESCE($1, sku),
      size = COALESCE($2, size),
      color = COALESCE($3, color),
      price = COALESCE($4, price),
      stock = COALESCE($5, stock),
      model_3d_url = COALESCE($6, model_3d_url),
      image_urls = COALESCE($7, image_urls),
      updated_at = NOW()
    WHERE id = $8
    RETURNING *;
  `;
  const values = [sku, size, color, price, stock, model_3d_url, image_urls, id];
  const result = await pool.query(sql, values);
  return result.rows[0];
};

// Xóa Biến thể (Hard Delete - Xóa cứng vì bảng này thường không cần soft delete)
const deleteVariant = async (id) => {
  const sql = `DELETE FROM product_variants WHERE id = $1 RETURNING *;`;
  const result = await pool.query(sql, [id]);
  return result.rows[0];
};

module.exports = {
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant
};