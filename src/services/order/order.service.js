const { pool } = require("../../config/database");
const orderRepo = require("../../repositories/order/order.repo");

const createOrder = async (orderData) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Đúng tên repo: insertOrder
    const newOrder = await orderRepo.insertOrder(client, orderData);

    for (const item of orderData.items) {
      // Đúng tên repo: insertOrderItem
      await orderRepo.insertOrderItem(client, newOrder.id, item);
    }

    await client.query("COMMIT");
    return newOrder;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const checkOrderStatus = async (orderId) => {
  // Sửa từ getOrderById -> findOrderById
  return await orderRepo.findOrderById(orderId);
};

const getShopOrders = async (shopId, limit = 50, cursor = null) => {
  // Sửa từ getOrdersList -> findOrders
  // Repo findOrders(shopId, limit, cursor, filters = {})
  const orders = await orderRepo.findOrders(shopId, limit, cursor);
  
  if (orders.length === 0) return { data: [], nextCursor: null };

  const orderIds = orders.map(o => o.id);
  // Sửa từ getItemsByOrderIds -> findOrderItemsByOrderIds
  const items = await orderRepo.findOrderItemsByOrderIds(orderIds);

  const itemsByOrderId = {};
  for (const item of items) {
    if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
    itemsByOrderId[item.order_id].push(item);
  }

  for (const order of orders) {
    order.items = itemsByOrderId[order.id] || [];
  }

  let nextCursor = null;
  if (orders.length === limit) {
    nextCursor = orders[orders.length - 1].created_at.toISOString();
  }

  return { data: orders, nextCursor };
};

// ... các hàm createOrder, getAllOrders giữ nguyên

const getOrderDetail = async (orderId) => {
  // 1. Lấy thông tin chung (dùng hàm findOrderById đã có)
  const order = await orderRepo.findOrderById(orderId);
  if (!order) return null;

  // 2. Lấy danh sách sản phẩm có đầy đủ Tên/Ảnh (dùng hàm đã sửa ở trên)
  const items = await orderRepo.findOrderItemsWithDetails(orderId);
  
  // 3. Gắn vào object trả về
  order.items = items; 
  
  return order;
};


const updateOrderStatus = async (orderId, status) => {
  // Sửa từ updateOrderStatus -> updateOrderStatusInDb
  return await orderRepo.updateOrderStatusInDb(orderId, status);
};

const filterOrders = async (shopId, filters, limit = 50, cursor = null) => {
  // Sửa từ filterOrdersList -> findOrders (Vì hàm findOrders trong Repo đã cân luôn filter)
  // LƯU Ý: Thứ tự tham số trong repo của bạn là: (shopId, limit, cursor, filters)
  const orders = await orderRepo.findOrders(shopId, limit, cursor, filters);
  
  if (orders.length === 0) return { data: [], nextCursor: null };

  const orderIds = orders.map(o => o.id);
  const items = await orderRepo.findOrderItemsByOrderIds(orderIds);

  const itemsByOrderId = {};
  for (const item of items) {
    if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
    itemsByOrderId[item.order_id].push(item);
  }

  for (const order of orders) {
    order.items = itemsByOrderId[order.id] || [];
  }

  let nextCursor = null;
  if (orders.length === limit) {
    nextCursor = orders[orders.length - 1].created_at.toISOString();
  }

  return { data: orders, nextCursor };
};

const updatePaymentStatus = async (orderId, shopId, payment_status) => {
  // Sửa từ updatePaymentStatus -> updatePaymentStatusInDb
  return await orderRepo.updatePaymentStatusInDb(orderId, shopId, payment_status);
};


const getAllOrders = async (limit, cursor) => {
  try {
    // Gọi sang Repository
    const orders = await orderRepo.findAllOrdersForAdmin(limit, cursor);

    // Tạo cursor tiếp theo để Frontend load more
    let nextCursor = null;
    if (orders.length === limit) {
      nextCursor = orders[orders.length - 1].created_at;
    }

    return { data: orders, nextCursor };
  } catch (err) {
    throw new Error("Lỗi Service khi lấy đơn hàng Admin: " + err.message);
  }
};

module.exports = {
  createOrder,
  checkOrderStatus,
  getShopOrders,
  getOrderDetail,
  updateOrderStatus,
  filterOrders,
  updatePaymentStatus,
  getAllOrders
};