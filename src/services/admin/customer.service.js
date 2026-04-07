const adminCustomerRepo = require("../../repositories/admin/customer.repository");

const getAllCustomers = async (limit, cursor, search) => {
  return await adminCustomerRepo.findAllCustomers(parseInt(limit), cursor, { search });
};

const getCustomerDetail = async (id) => {
  const profile = await adminCustomerRepo.getAdminCustomerDetail(id);
  if (!profile) return null;

  const orders = await adminCustomerRepo.getCustomerOrdersAllShops(id);
  
  return { 
    ...profile, 
    recent_orders: orders 
  };
};

const updateCustomer = async (id, data) => {
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