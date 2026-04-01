const categoryService = require("../../services/admin/category.service");

const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error("Lỗi getCategories:", error);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ khi tải danh mục" });
  }
};

module.exports = {
  getAllCategories
};