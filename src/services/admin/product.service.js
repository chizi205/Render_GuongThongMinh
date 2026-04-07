const productRepo = require("../../repositories/admin/product.repository");

const getProducts = async (filters) => {
  const limit = parseInt(filters.limit) || 10;
  
  // Đảm bảo shop_id được truyền vào repository qua object filters
  const products = await productRepo.getProductsByCategory({
    ...filters,
    limit: limit + 1
  });

  let nextCursor = null;
  if (products.length > limit) {
    products.pop();
    nextCursor = products[products.length - 1].id;
  }

  return { data: products, nextCursor };
};

const createProduct = async (data) => {
  return await productRepo.createProduct(data);
};

const updateProduct = async (id, data) => {
  return await productRepo.updateProduct(id, data);
};

const deleteProduct = async (id) => {
  // 1. Kiểm tra số lượng biến thể đang tồn tại của sản phẩm
  const variantCount = await productRepo.countVariantsByProductId(id);
  
  // 2. Nếu có biến thể (count > 0) -> Ném lỗi ra để Controller bắt
  if (variantCount > 0) {
    const error = new Error("PRODUCT_HAS_VARIANTS");
    error.code = "HAS_VARIANTS"; 
    throw error;
  }

  // 3. Đủ điều kiện (không còn biến thể nào) -> Tiến hành xóa
  return await productRepo.deleteProduct(id);
};

const createVariant = async (data) => {
  return await productRepo.createVariant(data);
};

const updateVariant = async (id, data) => {
  return await productRepo.updateVariant(id, data);
};

const deleteVariant = async (id) => {
  return await productRepo.deleteVariant(id);
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