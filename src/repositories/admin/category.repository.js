const { pool } = require("../../config/database");

const getAllCategories = async () => {
  // Lấy ra id (mã UUID) và name của danh mục
  const sql = `SELECT id, name FROM product_categories ORDER BY created_at ASC`;
  const result = await pool.query(sql);
  return result.rows;
};

module.exports = {
  getAllCategories
};