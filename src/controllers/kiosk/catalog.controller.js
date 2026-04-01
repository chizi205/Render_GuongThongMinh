const service = require("../../services/kiosk/catalog.service");
const { ok, serverError, badRequest } = require("../../utils/response");
const paymentService = require("../../services/external/payment.service");
const myCategories = async (req, res) => {
  try {
    const { kiosk_id } = req.kiosk;
    const data = await service.getMyCategories(kiosk_id);
    return ok(res, 200, data);
  } catch (err) {
    console.log(err);
    return serverError(res);
  }
};

const productsByCategory = async (req, res) => {
  try {
    const { kiosk_id, shop_id } = req.kiosk;
    const category_id = req.query.category_id;
    const data = await service.getProductsByCategory({
      kioskId: kiosk_id,
      shopId: shop_id,
      categoryId: category_id,
    });
    return ok(res, 200, data);
  } catch (err) {
    console.log(err);
    return serverError(res);
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { shopId, limit, cursor } = req.query;
    if (!shopId) {
      return badRequest(res, "Thiếu shopId để truy xuất sản phẩm");
    }
    const parsedLimit = limit ? parseInt(limit, 10) : 10;

    // Lưu ý: Gọi qua service thay vì gọi trực tiếp repo ở đây để đúng cấu hình layer
    const result = await service.getAllProducts(shopId, parsedLimit, cursor);

    return ok(res, 200, result);
  } catch (error) {
    console.error("Error in getAllProducts:", error);
    return serverError(res);
  }
};

// =========================================
// HÀM MỚI: Xử lý tạo sản phẩm gộp kèm Up ảnh
// =========================================
const createProductWithImage = async (req, res) => {
  try {
    // 1. Kiểm tra nếu không có file ảnh (do multer xử lý)
    if (!req.file) {
      return badRequest(res, "Vui lòng đính kèm ảnh sản phẩm (key: image)");
    }

    // 2. Lấy dữ liệu từ body (Postman gửi form-data)
    const {
      shop_id,
      category_id,
      name,
      description,
      sku,
      size,
      color,
      price,
      stock,
    } = req.body;

    // 4. Chuẩn bị object data để gửi xuống Service
    const productData = {
      shop_id,
      category_id,
      name,
      description,
      sku,
      size,
      color,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      model_3d_url: req.file.filename, // Đưa vào mảng như cấu trúc DB yêu cầu
    };

    // 5. Gọi service xử lý Transaction
    const result = await service.createProductWithImage(productData);

    return ok(res, 201, {
      message: "Tạo sản phẩm và lưu ảnh thành công",
      data: result,
    });
  } catch (err) {
    console.error("Error in createProductWithImage:", err);
    return serverError(res);
  }
};

const getProductDetail = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return badRequest(res, "Thiếu ID sản phẩm (productId)");
    }

    const data = await service.getProductDetail(productId);

    if (!data) {
      return ok(res, 404, { message: "Không tìm thấy sản phẩm" });
    }

    return ok(res, 200, data);
  } catch (err) {
    console.error("Error in getProductDetail:", err);
    return serverError(res);
  }
};

// =========================================
// 2. Tạo đơn hàng mới từ Kiosk
// =========================================
const createOrder = async (req, res) => {
  try {
    const { kiosk_id, shop_id } = req.kiosk;
    const user_id = req.user?.user_id || null;

    const { kiosk_session_id, items, total_amount, payment_method } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return badRequest(res, "Đơn hàng phải có ít nhất 1 sản phẩm");
    }

    for (const item of items) {
      if (!item.product_variant_id || !item.unit_price) {
        return badRequest(res, "Dữ liệu sản phẩm không hợp lệ");
      }
    }

    // 1. tạo order
    const order = await service.createOrder({
      shop_id,
      kiosk_id,
      user_id,
      kiosk_session_id: kiosk_session_id || null,
      total_amount: parseFloat(total_amount) || 0,
      payment_method,
      items,
    });
    // 2. tạo payment nếu là payos
    /*if (payment_method === "payos") {
      payment = await paymentService.createPaymentLink(order);

      // lưu orderCode
      await service.updatePayosCode(order.id, payment.orderCode);
    }*/
    const payment = await paymentService.createPaymentLink(order);
    return ok(res, 201, {
      message: "Tạo đơn hàng thành công",
      data: {
        order_id: order.id,
        order_code:order.order_code,
        payment_url: payment?.checkoutUrl || null,
        qr_code: payment?.qrCode || null,
      },
    });
  } catch (err) {
    console.error("Error in createOrder:", err);
    return serverError(res);
  }
};
// =========================================
// 3. Kiểm tra trạng thái đơn hàng
// =========================================
const checkOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return badRequest(res, "Thiếu ID đơn hàng (orderId)");
    }

    const data = await service.checkOrderStatus(orderId);

    if (!data) {
      return ok(res, 404, { message: "Không tìm thấy thông tin đơn hàng" });
    }

    return ok(res, 200, data);
  } catch (err) {
    console.error("Error in checkOrderStatus:", err);
    return serverError(res);
  }
};
// =========================================
// 4. Lấy danh sách toàn bộ đơn hàng (Cursor Pagination)
// =========================================
const getAllOrders = async (req, res) => {
  try {
    const shopId = req.kiosk?.shop_id || req.query.shopId;

    // Đọc limit và cursor từ query URL
    const limit = parseInt(req.query.limit, 10) || 20; // Trả 20 đơn 1 lần
    const cursor = req.query.cursor || null;

    if (!shopId) {
      return badRequest(res, "Thiếu shopId để lấy danh sách đơn hàng");
    }

    const result = await service.getAllOrders(shopId, limit, cursor);

    return ok(res, 200, {
      message: "Lấy danh sách đơn hàng thành công",
      nextCursor: result.nextCursor, // Client sẽ dùng cái này cho lần gọi tiếp theo
      data: result.data,
    });
  } catch (err) {
    console.error("Error in getAllOrders:", err);
    return serverError(res);
  }
};
// =========================================
// 5. Lấy chi tiết 1 đơn hàng cụ thể
// =========================================
const getOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return badRequest(res, "Thiếu ID đơn hàng (orderId)");
    }

    const data = await service.getOrderDetail(orderId);

    if (!data) {
      return ok(res, 404, { message: "Không tìm thấy thông tin đơn hàng" });
    }

    return ok(res, 200, {
      message: "Lấy chi tiết đơn hàng thành công",
      data: data,
    });
  } catch (err) {
    console.error("Error in getOrderDetail:", err);
    return serverError(res);
  }
};
// =========================================
// 6. Cập nhật trạng thái đơn hàng
// =========================================
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; // Frontend sẽ gửi status (ví dụ: 'paid', 'completed', 'cancelled') qua body json

    if (!orderId) {
      return badRequest(res, "Thiếu ID đơn hàng (orderId)");
    }
    if (!status) {
      return badRequest(res, "Thiếu trạng thái cần cập nhật (status)");
    }

    const updatedData = await service.updateOrderStatus(orderId, status);

    if (!updatedData) {
      return ok(res, 404, {
        message: "Không tìm thấy đơn hàng hoặc cập nhật thất bại",
      });
    }

    return ok(res, 200, {
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: updatedData,
    });
  } catch (err) {
    console.error("Error in updateOrderStatus:", err);
    return serverError(res);
  }
};

// =========================================
// 7. Lọc / Tìm kiếm đơn hàng (Cursor Pagination)
// =========================================
const filterOrders = async (req, res) => {
  try {
    const shopId = req.kiosk?.shop_id || req.query.shopId;
    if (!shopId) {
      return badRequest(res, "Thiếu shopId để lọc đơn hàng");
    }

    // Lấy các tham số lọc và phân trang từ URL
    const {
      status,
      payment_status,
      payment_method,
      start_date,
      end_date,
      limit,
      cursor,
    } = req.query;

    const filters = {
      status,
      payment_status,
      payment_method,
      start_date,
      end_date,
    };
    const parsedLimit = parseInt(limit, 10) || 20; // Lấy mặc định 20 đơn 1 lần

    const result = await service.filterOrders(
      shopId,
      filters,
      parsedLimit,
      cursor,
    );

    return ok(res, 200, {
      message: "Lọc đơn hàng thành công",
      nextCursor: result.nextCursor,
      data: result.data,
    });
  } catch (err) {
    console.error("Error in filterOrders:", err);
    return serverError(res);
  }
};

// =========================================
// API: Lấy danh sách khách hàng
// =========================================
const getCustomers = async (req, res) => {
  try {
    // Ưu tiên lấy shop_id từ token của Kiosk (nếu đang đứng ở app Kiosk)
    // Hoặc lấy từ query nếu là admin web đang xem
    const shopId = req.kiosk?.shop_id || req.query.shopId;
    if (!shopId) {
      return badRequest(res, "Thiếu shopId để lấy danh sách khách hàng");
    }

    const limit = parseInt(req.query.limit, 10) || 20;
    const cursor = req.query.cursor;

    const result = await service.getCustomers(shopId, limit, cursor);

    return ok(res, 200, {
      message: "Lấy danh sách khách hàng thành công",
      nextCursor: result.nextCursor,
      data: result.data,
    });
  } catch (err) {
    console.error("Error in getCustomers:", err);
    return serverError(res);
  }
};
// =========================================
// API: Xem chi tiết 1 khách hàng
// =========================================
const getCustomerDetail = async (req, res) => {
  try {
    const shopId = req.kiosk?.shop_id || req.query.shopId;
    const { id } = req.params; // Lấy ID khách hàng từ URL

    if (!shopId) {
      return badRequest(res, "Thiếu shopId để xem chi tiết khách hàng");
    }
    if (!id) {
      return badRequest(res, "Thiếu ID khách hàng (id)");
    }

    const customer = await service.getCustomerDetail(shopId, id);

    if (!customer) {
      return ok(res, 404, {
        message: "Không tìm thấy khách hàng này trong hệ thống cửa hàng",
      });
    }

    return ok(res, 200, {
      message: "Lấy chi tiết khách hàng thành công",
      data: customer,
    });
  } catch (err) {
    console.error("Error in getCustomerDetail:", err);
    return serverError(res);
  }
};

// =========================================
// API: Lọc / Tìm kiếm khách hàng
// =========================================
const filterCustomers = async (req, res) => {
  try {
    const shopId = req.kiosk?.shop_id || req.query.shopId;
    if (!shopId) {
      return badRequest(res, "Thiếu shopId để lọc khách hàng");
    }

    // Lấy các tham số lọc từ URL
    const { search, min_sessions, start_date, end_date, limit, cursor } =
      req.query;

    const filters = { search, min_sessions, start_date, end_date };
    const parsedLimit = parseInt(limit, 10) || 20;

    const result = await service.filterCustomers(
      shopId,
      filters,
      parsedLimit,
      cursor,
    );

    return ok(res, 200, {
      message: "Lọc khách hàng thành công",
      nextCursor: result.nextCursor,
      data: result.data,
    });
  } catch (err) {
    console.error("Error in filterCustomers:", err);
    return serverError(res);
  }
};

const generateRandomImages = async (req, res) => {
  try {
    const shopId = req.kiosk?.shop_id || req.body.shopId;
    const limit = parseInt(req.body.limit, 10) || 5;

    if (!shopId) {
      return res.status(400).json({ message: "Thiếu shopId" });
    }

    const result = await service.generateRandomAdImages(shopId, limit);

    if (result.images.length === 0) {
      return res
        .status(404)
        .json({ message: "Shop chưa có sản phẩm nào có ảnh để random" });
    }

    return res.status(201).json({
      message: "Phát sinh ảnh quảng cáo ngẫu nhiên thành công",
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi hệ thống khi tạo quảng cáo" });
  }
};

const selectManualImages = async (req, res) => {
  try {
    const shopId = req.kiosk?.shop_id || req.body.shopId;
    const { name, variantIds } = req.body;

    if (!shopId) return res.status(400).json({ message: "Thiếu shopId" });
    if (!variantIds || !Array.isArray(variantIds) || variantIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Danh sách sản phẩm chọn (variantIds) không hợp lệ" });
    }

    const result = await service.saveManualSelection(shopId, name, variantIds);

    return res.status(201).json({
      message: "Lưu cấu hình quảng cáo thủ công thành công",
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

module.exports = {
  myCategories,
  productsByCategory,
  getAllProducts,
  createProductWithImage,
  getProductDetail,
  createOrder,
  checkOrderStatus,
  getAllOrders,
  getOrderDetail,
  updateOrderStatus,
  filterOrders,
  getCustomers,
  getCustomerDetail,
  filterCustomers,
  generateRandomImages,
  selectManualImages,
};
