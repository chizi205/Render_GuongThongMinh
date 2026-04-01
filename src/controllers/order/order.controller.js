const service = require("../../services/order/order.service"); // Lưu ý: trỏ đúng path service order
const { ok, serverError, badRequest } = require("../../utils/response");

const createOrder = async (req, res) => {
  try {
    const { kiosk_id, shop_id } = req.kiosk;
    const { user_id, kiosk_session_id, items, total_amount, payment_method } =
      req.body;

    if (!items?.length) return badRequest(res, "Đơn hàng trống");

    const data = await service.createOrder({
      shop_id,
      kiosk_id,
      user_id,
      kiosk_session_id,
      items,
      total_amount: parseFloat(total_amount) || 0,
      payment_method,
    });

    return ok(res, 201, { message: "Tạo đơn hàng thành công", data });
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
};

const getShopOrders = async (req, res) => {
  try {
    const shopId = req.kiosk?.shop_id || req.query.shopId;
    const { limit, cursor } = req.query;
    if (!shopId) return badRequest(res, "Thiếu shopId");

    const result = await service.getShopOrders(
      shopId,
      parseInt(limit) || 20,
      cursor,
    );
    return ok(res, 200, { nextCursor: result.nextCursor, data: result.data });
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
};

const getOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;
    const data = await service.getOrderDetail(orderId);

    if (!data)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy" });

    res.setHeader("Cache-Control", "no-store");

    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const updatedData = await service.updateOrderStatus(orderId, status);
    return ok(res, 200, updatedData);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { payment_status } = req.body;
    const shopId = req.kiosk?.shop_id;

    const updatedOrder = await service.updatePaymentStatus(
      orderId,
      shopId,
      payment_status,
    );
    return ok(res, 200, updatedOrder);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
};

const checkOrderStatus = async (req, res) => {
  try {
    const data = await service.checkOrderStatus(req.params.orderId);
    return ok(res, 200, data);
  } catch (err) {
    return serverError(res);
  }
};

const filterOrders = async (req, res) => {
  try {
    const shopId = req.kiosk?.shop_id || req.query.shopId;
    const {
      status,
      payment_status,
      payment_method,
      start_date,
      end_date,
      limit,
      cursor,
    } = req.query;
    const result = await service.filterOrders(
      shopId,
      { status, payment_status, payment_method, start_date, end_date },
      parseInt(limit) || 20,
      cursor,
    );
    return ok(res, 200, result);
  } catch (err) {
    return serverError(res);
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { limit, cursor } = req.query;

    // Gọi Service
    const result = await service.getAllOrders(parseInt(limit) || 20, cursor);

    return ok(res, 200, {
      data: result.data,
      nextCursor: result.nextCursor,
    });
  } catch (err) {
    console.error(err);
    return serverError(res, "Lỗi khi lấy danh sách đơn hàng toàn hệ thống");
  }
};

module.exports = {
  createOrder,
  getShopOrders,
  getOrderDetail,
  updateOrderStatus,
  updatePaymentStatus,
  checkOrderStatus,
  filterOrders,
  getAllOrders,
};
