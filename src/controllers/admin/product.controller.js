const productService = require("../../services/admin/product.service");

// Hàm tiện ích tự động tạo slug (đường dẫn chuẩn SEO) từ tên sản phẩm
const generateSlug = (str) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // xóa dấu
    .replace(/[đĐ]/g, "d") // thay chữ đ
    .replace(/([^0-9a-z-\s])/g, "") // xóa ký tự đặc biệt
    .replace(/(\s+)/g, "-") // thay khoảng trắng bằng gạch ngang
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// ==========================================
// QUẢN LÝ SẢN PHẨM CHÍNH
// ==========================================

const getProducts = async (req, res) => {
  try {
    const { shop_id, category_id, search, cursor, limit } = req.query;
    const result = await productService.getProducts({
      shop_id,
      category_id,
      search,
      cursor,
      limit,
    });

    if (result.data.length === 0 && !cursor) {
      return res.status(204).send();
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      paging: { next_cursor: result.nextCursor },
    });
  } catch (error) {
    console.error("Lỗi getProducts:", error);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

const createProduct = async (req, res) => {
  try {
    // Thêm trường base_price lấy từ form Frontend
    const { shop_id, name, category_id, description, status, base_price } =
      req.body;
    const finalShopId = shop_id || req.user?.shop_id;

    if (!finalShopId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Thiếu thông tin Cửa hàng (shop_id)",
        });
    }

    // 1. LẤY ẢNH SẢN PHẨM
    let image_url = null;
    if (req.file) {
      const filePath = req.file.path.replace(/\\/g, "/");
      image_url = filePath.substring(filePath.indexOf("uploads"));
    }

    // 2. TẠO SLUG DUY NHẤT
    const slug = name
      ? generateSlug(name) + "-" + Date.now().toString().slice(-5)
      : null;

    // 3. GỌI SERVICE LƯU
    const newProduct = await productService.createProduct({
      shop_id: finalShopId,
      category_id: category_id || null,
      name,
      description,
      status,
      image_url,
      base_price: base_price ? parseInt(base_price, 10) : 0,
      slug,
    });

    return res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    console.error("Lỗi createProduct:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi thêm sản phẩm" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, description, status, base_price } = req.body;

    let image_url = undefined;
    if (req.file) {
      const filePath = req.file.path.replace(/\\/g, "/");
      image_url = "/" + filePath.substring(filePath.indexOf("uploads"));
    }

    // Nếu người dùng có cập nhật Tên, mình cũng cập nhật lại Slug
    let slug = undefined;
    if (name) {
      slug = generateSlug(name) + "-" + Date.now().toString().slice(-5);
    }

    const updated = await productService.updateProduct(id, {
      name,
      category_id,
      description,
      status,
      image_url,
      base_price: base_price ? parseInt(base_price, 10) : undefined,
      slug,
    });

    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm" });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Lỗi updateProduct:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi cập nhật sản phẩm" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await productService.deleteProduct(id);

    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm" });
    return res.status(200).json({ success: true, message: "Đã xóa sản phẩm" });
  } catch (error) {
    console.error("Lỗi deleteProduct:", error);
    if (error.code === "HAS_VARIANTS") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Không thể xóa! Sản phẩm này đang chứa biến thể.",
        });
    }
    return res
      .status(500)
      .json({ success: false, message: "Lỗi xóa sản phẩm" });
  }
};

const createVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const { sku, size, color, price, stock } = req.body;

    let model_3d_url = null;
    if (req.file) {
      const filePath = req.file.path.replace(/\\/g, "/");
      model_3d_url = "/" + filePath.substring(filePath.indexOf("uploads"));
    }

    const newVariant = await productService.createVariant({
      product_id: productId,
      sku,
      size,
      color,
      price,
      stock,
      model_3d_url,
    });

    return res.status(201).json({ success: true, data: newVariant });
  } catch (error) {
    console.error("Lỗi createVariant:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi thêm biến thể" });
  }
};

const updateVariant = async (req, res) => {
  try {
    const { variantId } = req.params;
    const { sku, size, color, price, stock } = req.body;

    let model_3d_url = undefined;
    if (req.file) {
      const filePath = req.file.path.replace(/\\/g, "/");
      model_3d_url = "/" + filePath.substring(filePath.indexOf("uploads"));
    }

    const updated = await productService.updateVariant(variantId, {
      sku,
      size,
      color,
      price,
      stock,
      model_3d_url,
    });

    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy biến thể" });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Lỗi updateVariant:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi cập nhật biến thể" });
  }
};

const deleteVariant = async (req, res) => {
  try {
    const { variantId } = req.params;
    const deleted = await productService.deleteVariant(variantId);

    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy biến thể" });
    return res.status(200).json({ success: true, message: "Đã xóa biến thể" });
  } catch (error) {
    console.error("Lỗi deleteVariant:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi xóa biến thể" });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
};
