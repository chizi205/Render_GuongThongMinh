const { pool } = require("../../config/database");
const productRepo = require("../../repositories/product/product.repo"); 

const getMyCategories = async (kioskId) => {
  const categories = await productRepo.listKioskCategories(kioskId);
  const defaultCategory = categories.find((c) => c.is_default) || null;
  return { categories, default_category_id: defaultCategory ? defaultCategory.id : null };
};

const getProductsByCategory = async ({ kioskId, shopId, categoryId }) => {
  if (!categoryId) {
    const err = new Error("MISSING_CATEGORY_ID");
    err.status = 400;
    throw err;
  }

  const allowed = await productRepo.kioskHasCategory(kioskId, categoryId);
  if (!allowed) {
    const err = new Error("CATEGORY_NOT_ALLOWED_FOR_KIOSK");
    err.status = 403;
    throw err;
  }

  const rows = await productRepo.listProductsByCategory(shopId, categoryId);

  // Logic map dữ liệu thuộc về Service
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.product_id)) {
      map.set(r.product_id, {
        id: r.product_id,
        name: r.product_name,
        description: r.description,
        variants: [],
      });
    }
    if (r.variant_id) {
      map.get(r.product_id).variants.push({
        id: r.variant_id,
        sku: r.sku,
        size: r.size,
        color: r.color,
        price: r.price,
        stock: r.stock,
        model_3d_url: r.model_3d_url,
        image_urls: r.image_urls,
      });
    }
  }
  return Array.from(map.values());
};

const createProductWithImage = async (data) => {
  if (!data.shop_id || !data.category_id || !data.name) {
    const err = new Error("MISSING_REQUIRED_FIELDS");
    err.status = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Truyền client xuống Repo để chạy Transaction
    const productId = await productRepo.insertProduct(client, {
      shop_id: data.shop_id,
      category_id: data.category_id,
      name: data.name,
      description: data.description || null,
    });

    const variant = await productRepo.insertVariant(client, {
      product_id: productId,
      sku: data.sku,
      size: data.size,
      color: data.color,
      price: data.price,
      stock: data.stock || 0,
      model_3d_url: data.model_3d_url || null,
      image_urls: data.image_urls || []
    });

    await client.query("COMMIT");
    return { product_id: productId, variant };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getAllProducts = async (shopId, limit, cursor) => {
  return await productRepo.listAllProducts(shopId, limit, cursor);
};

const getProductDetail = async (productId) => {
  const product = await productRepo.getProductById(productId);
  if (!product) return null;

  const variants = await productRepo.getVariantsByProductId(productId);
  product.variants = variants;
  
  return product;
};

module.exports = {
  getMyCategories,
  getProductsByCategory,
  createProductWithImage,
  getAllProducts,
  getProductDetail
};