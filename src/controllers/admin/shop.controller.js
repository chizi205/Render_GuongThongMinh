const ShopService = require("../../services/admin/shop.service");

const getShops = async (req, res) => {
  try {
    const { keyword, cursor, limit } = req.query;
    const result = await ShopService.getShops({ keyword, cursor, limit });

    if (result.data.length === 0 && !cursor) {
      return res.status(204).send(); 
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      paging: { next_cursor: result.nextCursor }
    });
  } catch (error) {
    console.error("Lỗi getShops:", error);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

const getShopDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const shop = await ShopService.getShopById(id);
    return res.status(200).json({ success: true, data: shop });
  } catch (error) {
    console.error("Lỗi getShopDetail:", error);
    if (error.message === "SHOP_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Không tìm thấy shop" });
    }
    return res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

const createShop = async (req, res) => {
  try {
    const { name, slug, zalo_oa_id, status } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Tên shop là bắt buộc" });

    const shopIdentifier = slug || 'default_shop'; 
    const logo_url = req.file ? `/uploads/shops/${shopIdentifier}/logo/${req.file.filename}` : null;

    const newShop = await ShopService.createShop({ name, slug, zalo_oa_id, logo_url, status });
    return res.status(201).json({ success: true, data: newShop });
  } catch (error) {
    console.error("Lỗi createShop:", error);
    if (error.message === "SLUG_ALREADY_EXISTS") {
      return res.status(400).json({ success: false, message: "Slug đã tồn tại" });
    }
    return res.status(500).json({ success: false, message: "Lỗi tạo shop" });
  }
};

const updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body; 

    if (req.file) {
      const shopIdentifier = req.body.slug || id || 'default_shop';
      updateData.logo_url = `/uploads/shops/${shopIdentifier}/logo/${req.file.filename}`;
    }
    
    const updatedShop = await ShopService.updateShop(id, updateData);
    return res.status(200).json({ success: true, data: updatedShop });
  } catch (error) {
    console.error("Lỗi updateShop:", error);
    if (error.message === "SHOP_NOT_FOUND") return res.status(404).json({ success: false, message: "Không tìm thấy shop" });
    if (error.message === "SLUG_ALREADY_EXISTS") return res.status(400).json({ success: false, message: "Slug đã tồn tại" });
    return res.status(500).json({ success: false, message: "Lỗi cập nhật shop" });
  }
};

const deleteShop = async (req, res) => {
  try {
    const { id } = req.params;
    await ShopService.deleteShop(id);
    
    return res.status(200).json({ success: true, message: "Xóa shop thành công" });
  } catch (error) {
    console.error("Lỗi deleteShop:", error);
    if (error.message === "SHOP_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Không tìm thấy shop" });
    }
    if (error.message === "SHOP_HAS_PRODUCTS") {
      return res.status(400).json({ 
        success: false, 
        message: "Không thể xóa shop vì vẫn còn sản phẩm và danh mục. Vui lòng xóa hết sản phẩm và danh mục trước khi thực hiện." 
      });
    }
    return res.status(500).json({ success: false, message: "Lỗi máy chủ khi xóa shop" });
  }
};

module.exports = {
  getShops,
  getShopDetail,
  createShop,
  updateShop,
  deleteShop
};