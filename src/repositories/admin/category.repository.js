const { pool } = require("../../config/database");



const countProductsByCategory = async (categoryId) => {
  const sql = `SELECT COUNT(*) FROM products WHERE category_id = $1`;
  const result = await pool.query(sql, [categoryId]);
  return parseInt(result.rows[0].count, 10);
};
// Lấy danh sách tất cả danh mục (Kèm tên Shop)
const getAllCategories = async () => {
  const sql = `
    SELECT c.*, s.name as shop_name 
    FROM product_categories c
    LEFT JOIN shops s ON c.shop_id = s.id
    WHERE c.is_deleted = false 
    ORDER BY c.created_at DESC
  `;
  const result = await pool.query(sql);
  return result.rows;
};

// SỬA: Chuyển từ DELETE thành UPDATE trạng thái is_deleted = true
const deleteCategory = async (id) => {
  const sql = `
    UPDATE product_categories 
    SET is_deleted = true, updated_at = NOW() 
    WHERE id = $1 
    RETURNING *;
  `;
  const result = await pool.query(sql, [id]);
  return result.rows[0];
};

// Lấy chi tiết 1 danh mục theo ID
const getCategoryById = async (id) => {
  const sql = `SELECT * FROM product_categories WHERE id = $1`;
  const result = await pool.query(sql, [id]);
  return result.rows[0];
};

// Thêm mới danh mục
const createCategory = async (data) => {
  const { shop_id, name, slug } = data;
  const sql = `
    INSERT INTO product_categories (shop_id, name, slug, created_at, updated_at)
    VALUES ($1, $2, $3, NOW(), NOW())
    RETURNING *;
  `;
  const result = await pool.query(sql, [shop_id, name, slug]);
  return result.rows[0];
};

// Cập nhật danh mục
const updateCategory = async (id, data) => {
  const { shop_id, name, slug, is_active } = data;
  const sql = `
    UPDATE product_categories 
    SET 
      shop_id = COALESCE($1, shop_id),
      name = COALESCE($2, name),
      slug = COALESCE($3, slug),
      is_active = COALESCE($4, is_active),
      updated_at = NOW()
    WHERE id = $5
    RETURNING *;
  `;
  const result = await pool.query(sql, [shop_id, name, slug, is_active, id]);
  return result.rows[0];
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  countProductsByCategory
};