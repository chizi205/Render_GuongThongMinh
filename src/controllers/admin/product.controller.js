const productService = require("../../services/admin/product.service");

// ==========================================
// QUẢN LÝ SẢN PHẨM CHÍNH
// ==========================================

const getProducts = async (req, res) => {
  try {
    const { category_id, search, cursor, limit } = req.query;
    
    const result = await productService.getProducts({ category_id, search, cursor, limit });

    // Trả về đúng format mà Frontend React đang chờ (có paging.next_cursor)
    if (result.data.length === 0 && !cursor) {
      return res.status(204).send(); // Trả về 204 No Content nếu DB rỗng
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      paging: { next_cursor: result.nextCursor }
    });
  } catch (error) {
    console.error("Lỗi getProducts:", error);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, category_id, description, status } = req.body;
    // Tạm thời fix cứng shop_id = 1 nếu hệ thống của bạn chưa có auth shop
    const shop_id = req.user?.shop_id || 1; 

    const newProduct = await productService.createProduct({
      shop_id,
      category_id: category_id || null,
      name,
      description,
      status
    });

    return res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    console.error("Lỗi createProduct:", error);
    return res.status(500).json({ success: false, message: "Lỗi thêm sản phẩm" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, description, status } = req.body;

    const updated = await productService.updateProduct(id, {
      name, category_id, description, status
    });

    if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Lỗi updateProduct:", error);
    return res.status(500).json({ success: false, message: "Lỗi cập nhật sản phẩm" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await productService.deleteProduct(id);
    
    if (!deleted) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    return res.status(200).json({ success: true, message: "Đã xóa sản phẩm" });
  } catch (error) {
    console.error("Lỗi deleteProduct:", error);
    return res.status(500).json({ success: false, message: "Lỗi xóa sản phẩm" });
  }
};


// ==========================================
// QUẢN LÝ BIẾN THỂ (VARIANTS)
// ==========================================

const createVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const { sku, size, color, price, stock } = req.body;

    // Xử lý File ảnh từ Multer (Nếu frontend gửi form-data kèm ảnh)
    let image_urls = [];
    if (req.file) {
      // Tuỳ thuộc vào cách config Multer, file path có thể khác nhau
      image_urls.push(`/uploads/${req.file.filename}`); 
    }

    const newVariant = await productService.createVariant({
      product_id: productId,
      sku, size, color, price, stock, image_urls
    });

    return res.status(201).json({ success: true, data: newVariant });
  } catch (error) {
    console.error("Lỗi createVariant:", error);
    return res.status(500).json({ success: false, message: "Lỗi thêm biến thể" });
  }
};

const updateVariant = async (req, res) => {
  try {
    const { variantId } = req.params;
    const { sku, size, color, price, stock } = req.body;

    // Chỉ cập nhật ảnh nếu user có upload ảnh mới
    let image_urls = undefined; 
    if (req.file) {
      image_urls = [`/uploads/${req.file.filename}`];
    }

    const updated = await productService.updateVariant(variantId, {
      sku, size, color, price, stock, image_urls
    });

    if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy biến thể" });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Lỗi updateVariant:", error);
    return res.status(500).json({ success: false, message: "Lỗi cập nhật biến thể" });
  }
};

const deleteVariant = async (req, res) => {
  try {
    const { variantId } = req.params;
    const deleted = await productService.deleteVariant(variantId);
    
    if (!deleted) return res.status(404).json({ success: false, message: "Không tìm thấy biến thể" });
    return res.status(200).json({ success: true, message: "Đã xóa biến thể" });
  } catch (error) {
    console.error("Lỗi deleteVariant:", error);
    return res.status(500).json({ success: false, message: "Lỗi xóa biến thể" });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant
};