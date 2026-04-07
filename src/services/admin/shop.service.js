const ShopRepository = require("../../repositories/admin/shop.repository");

const generateSlug = (text) => {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, "") 
    .replace(/\s+/g, '-')           
    .replace(/[^\w\-]+/g, '')       
    .replace(/\-\-+/g, '-')         
    .replace(/^-+/, '')             
    .replace(/-+$/, '');            
};

class ShopService {
  static async getShops({ keyword, cursor, limit }) {
    return await ShopRepository.getList({ keyword, cursor, limit: parseInt(limit) || 10 });
  }

  static async getShopById(id) {
    const shop = await ShopRepository.findById(id);
    if (!shop) throw new Error("SHOP_NOT_FOUND");
    return shop;
  }

  static async createShop(data) {
    const slug = data.slug || generateSlug(data.name);
    const isExist = await ShopRepository.checkSlugExists(slug);
    if (isExist) throw new Error("SLUG_ALREADY_EXISTS");

    return await ShopRepository.create({ ...data, slug });
  }

  static async updateShop(id, data) {
    if (data.name && !data.slug) {
      data.slug = generateSlug(data.name);
    }
    
    if (data.slug) {
      const isExist = await ShopRepository.checkSlugExists(data.slug, id);
      if (isExist) throw new Error("SLUG_ALREADY_EXISTS");
    }

    const updatedShop = await ShopRepository.update(id, data);
    if (!updatedShop) throw new Error("SHOP_NOT_FOUND");
    return updatedShop;
  }

  static async deleteShop(id) {
    // 1. Kiểm tra tồn tại
    const shop = await ShopRepository.findById(id);
    if (!shop) throw new Error("SHOP_NOT_FOUND");

    // 2. Kiểm tra sản phẩm còn tồn tại không
    const productCount = await ShopRepository.countProducts(id);
    if (productCount > 0) {
      throw new Error("SHOP_HAS_PRODUCTS");
    }

    // 3. Thực hiện xóa mềm
    const deleted = await ShopRepository.softDelete(id);
    if (!deleted) throw new Error("DELETE_FAILED");
    
    return true;
  }
}

module.exports = ShopService;