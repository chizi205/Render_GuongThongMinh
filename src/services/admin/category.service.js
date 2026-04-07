const CategoryRepo = require("../../repositories/admin/category.repository");

const getAllCategories = async () => {
  return await CategoryRepo.getAllCategories();
};

const createCategory = async (data) => {
  return await CategoryRepo.createCategory(data);
};

const updateCategory = async (id, data) => {
  // Kiểm tra tồn tại
  const existingCategory = await CategoryRepo.getCategoryById(id);
  if (!existingCategory) {
    throw new Error("CATEGORY_NOT_FOUND");
  }
  return await CategoryRepo.updateCategory(id, data);
};

const deleteCategory = async (id) => {
  // 1. Kiểm tra danh mục có tồn tại không
  const category = await CategoryRepo.getCategoryById(id);
  if (!category) {
    throw new Error("CATEGORY_NOT_FOUND");
  }

  // 2. Đếm số sản phẩm đang dùng danh mục này
  const productCount = await CategoryRepo.countProductsByCategory(id);
  
  // 3. Nếu có sản phẩm (count > 0) -> Chặn không cho xóa
  if (productCount > 0) {
    const error = new Error("CATEGORY_HAS_PRODUCTS");
    error.code = "HAS_PRODUCTS"; // Gắn mã lỗi để Controller nhận diện
    throw error;
  }

  // 4. Đủ điều kiện -> Tiến hành xóa mềm
  return await CategoryRepo.deleteCategory(id);
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};