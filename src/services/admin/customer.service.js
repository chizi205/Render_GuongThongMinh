const adminCustomerRepo = require("../../repositories/admin/customer.repository");

const getAllCustomers = async (limit, cursor, search) => {
  // Trả về trực tiếp mảng customers
  return await adminCustomerRepo.findAllCustomers(parseInt(limit), cursor, { search });
};

const getCustomerDetail = async (id) => {
  const profile = await adminCustomerRepo.getAdminCustomerDetail(id);
  if (!profile) return null; // Trả về null nếu không tìm thấy

  const orders = await adminCustomerRepo.getCustomerOrdersAllShops(id);
  
  // Trả về dữ liệu đã được gộp chung
  return { 
    ...profile, 
    recent_orders: orders 
  };
};

const updateCustomer = async (id, data) => {
  // Có thể thêm logic validation phức tạp tại đây nếu cần
  return await adminCustomerRepo.updateCustomer(id, data);
};

const deleteCustomer = async (id) => {
  return await adminCustomerRepo.softDeleteCustomer(id);
};

module.exports = {
  getAllCustomers,
  getCustomerDetail,
  updateCustomer,
  deleteCustomer
};