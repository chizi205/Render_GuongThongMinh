const customerRepo = require("../../repositories/customer/customer.repo");

const getCustomers = async (shopId, limit = 20, cursor = null) => {
  const customers = await customerRepo.getCustomersList(shopId, limit, cursor);
  
  if (customers.length === 0) return { data: [], nextCursor: null };

  let nextCursor = null;
  if (customers.length === limit) {
    nextCursor = customers[customers.length - 1].first_seen_at.toISOString();
  }

  return { data: customers, nextCursor };
};

const getCustomerDetail = async (shopId, customerId) => {
  const customerInfo = await customerRepo.getCustomerProfile(shopId, customerId);
  if (!customerInfo) return null;
  customerInfo.recent_orders = await customerRepo.getRecentOrders(shopId, customerId);
  return customerInfo;
};

const filterCustomers = async (shopId, filters, limit = 20, cursor = null) => {
  const customers = await customerRepo.findCustomers(
    shopId, 
    limit, 
    cursor, 
    filters
  );

  if (customers.length === 0) return { data: [], nextCursor: null };

  let nextCursor = null;
  if (customers.length === limit) {
    nextCursor = customers[customers.length - 1].first_seen_at?.toISOString() || null;
  }
  return { data: customers, nextCursor };
};

module.exports = {
  getCustomers,
  getCustomerDetail,
  filterCustomers
};