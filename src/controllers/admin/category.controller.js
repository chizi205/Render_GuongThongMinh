const CategoryService = require("../../services/admin/category.service");

const getCategories = async (req, res) => {
  try {
    const categories = await CategoryService.getAllCategories();
    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error("Lỗi getCategories:", error);
    return res.status(500).json({ success: false, message: "Lỗi tải danh mục" });
  }
};

const createCategory = async (req, res) => {
  try {
    const { shop_id, name, slug } = req.body;
    
    // Bắt buộc phải có name và shop_id
    if (!name || !shop_id) {
      return res.status(400).json({ success: false, message: "Tên danh mục và Shop quản lý là bắt buộc" });
    }

    const newCategory = await CategoryService.createCategory({ shop_id, name, slug });
    return res.status(201).json({ success: true, data: newCategory, message: "Tạo danh mục thành công" });
  } catch (error) {
    console.error("Lỗi createCategory:", error);
    return res.status(500).json({ success: false, message: "Lỗi khi tạo danh mục" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { shop_id, name, slug, is_active } = req.body;

    const updatedCategory = await CategoryService.updateCategory(id, { shop_id, name, slug, is_active });
    return res.status(200).json({ success: true, data: updatedCategory, message: "Cập nhật thành công" });
  } catch (error) {
    console.error("Lỗi updateCategory:", error);
    if (error.message === "CATEGORY_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Không tìm thấy danh mục" });
    }
    return res.status(500).json({ success: false, message: "Lỗi cập nhật danh mục" });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await CategoryService.deleteCategory(id);
    
    return res.status(200).json({ success: true, message: "Xóa danh mục thành công" });
  } catch (error) {
    console.error("Lỗi deleteCategory:", error);
    
    // Bắt đúng lỗi khi không tìm thấy
    if (error.message === "CATEGORY_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Không tìm thấy danh mục" });
    }
    
    // BẮT ĐÚNG LỖI CÒN SẢN PHẨM Ở ĐÂY
    if (error.code === 'HAS_PRODUCTS' || error.message === 'CATEGORY_HAS_PRODUCTS') {
      return res.status(400).json({ 
        success: false, 
        message: "Không thể xóa! Danh mục này đang chứa sản phẩm. Vui lòng chuyển sản phẩm sang danh mục khác trước." 
      });
    }
    
    return res.status(500).json({ success: false, message: "Lỗi hệ thống khi xóa danh mục" });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};