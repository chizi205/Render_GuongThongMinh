const customerService = require("../../services/admin/customer.service");
const { ok, serverError } = require("../../utils/response");

const getAllCustomers = async (req, res) => {
  try {
    const { search, limit = 20, cursor } = req.query;
    const customers = await customerService.getAllCustomers(limit, cursor, search);
    return ok(res, 200, customers); 
  } catch (error) {
    console.error("Get All Customers Error:", error);
    return serverError(res);
  }
};

const getCustomerDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const customerDetail = await customerService.getCustomerDetail(id);
    
    if (!customerDetail) {
      return ok(res, 404, { message: "Khách hàng không tồn tại hoặc đã bị xóa" });
    }

    return ok(res, 200, customerDetail);
  } catch (error) {
    console.error("Get Customer Detail Error:", error);
    return serverError(res);
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      full_name: req.body.full_name,
      phone: req.body.phone,
      email: req.body.email,
      gender: req.body.gender,
      address: req.body.address,
      zalo_user_id: req.body.zalo_user_id,
      avatar_url: req.body.avatar_url
    };

    const updated = await customerService.updateCustomer(id, updateData);

    if (!updated) {
      return res.status(404).json({ success: false, message: "Khách hàng không tồn tại" });
    }

    return ok(res, 200, updated);
  } catch (error) {
    console.error("Update Customer Error:", error);
    return serverError(res);
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await customerService.deleteCustomer(id);
    
    if (!result) {
      return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng để xóa" });
    }

    return ok(res, 200, { message: "Xóa thành công" });
  } catch (error) {
    console.error("Delete Customer Error:", error);
    return serverError(res);
  }
};

module.exports = {
  getAllCustomers,
  getCustomerDetail,
  updateCustomer,
  deleteCustomer
};