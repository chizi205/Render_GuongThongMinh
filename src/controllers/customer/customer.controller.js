const service = require("../../services/customer/customer.service"); // Trỏ đúng path
const { ok, serverError, badRequest } = require("../../utils/response");

const getCustomers = async (req, res) => {
  try {
    const shopId = req.kiosk?.shop_id || req.query.shopId;
    const result = await service.getCustomers(shopId, parseInt(req.query.limit) || 20, req.query.cursor);
    return ok(res, 200, result);
  } catch (err) {
    return serverError(res);
  }
};

const getCustomerDetail = async (req, res) => {
  try {
    const shopId = req.kiosk?.shop_id || req.query.shopId;
    const customerId = req.params.id;

    const customer = await service.getCustomerDetail(shopId, customerId);
    
    // Nếu service trả về null, phải trả về success: false
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khách hàng trong hệ thống của cửa hàng này."
      });
    }

    // Nếu có dữ liệu, bọc vào cục 'data'
    return res.status(200).json({
      success: true,
      data: customer
    });

  } catch (err) {
    console.error("Controller Error:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ."
    });
  }
};

const filterCustomers = async (req, res) => {
  try {
    const shopId = req.kiosk?.shop_id || req.query.shopId;
    const { search, min_sessions, start_date, end_date, limit, cursor, sortOrder } = req.query;
    const filters = { search, min_sessions, start_date, end_date, sortOrder };
    const result = await service.filterCustomers(
      shopId, 
      filters, 
      parseInt(limit) || 20, 
      cursor
    );
    
    return ok(res, 200, result);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
};

module.exports = { getCustomers, getCustomerDetail, filterCustomers };