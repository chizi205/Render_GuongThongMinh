const productRepo = require("../../repositories/admin/product.repository");

const getProducts = async (filters) => {
  const limit = parseInt(filters.limit) || 10;
  
  // Mẹo: Lấy dư 1 bản ghi (limit + 1) để biết xem còn trang tiếp theo không
  const products = await productRepo.getProductsByCategory({
    ...filters,
    limit: limit + 1
  });

  let nextCursor = null;
  
  // Nếu số lượng trả về thực sự lớn hơn limit -> Vẫn còn dữ liệu ở trang sau
  if (products.length > limit) {
    products.pop(); // Cắt bỏ bản ghi dư thừa đi
    nextCursor = products[products.length - 1].id; // Lấy ID của bản ghi cuối cùng làm cursor
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