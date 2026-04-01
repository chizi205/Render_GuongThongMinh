const { pool } = require("../../config/database"); // Đảm bảo đường dẫn tới file config db của bạn đúng
const repo = require("../../repositories/kiosk/catalog.repo");

const getMyCategories = async (kioskId) => {
  const categories = await repo.listKioskCategories(kioskId);
  const defaultCategory = categories.find((c) => c.is_default) || null;
  return {
    categories,
    default_category_id: defaultCategory ? defaultCategory.id : null,
  };
};

const getProductsByCategory = async ({ kioskId, shopId, categoryId }) => {
  if (!categoryId) {
    const err = new Error("MISSING_CATEGORY_ID");
    err.status = 400;
    throw err;
  }

  const allowed = await repo.kioskHasCategory(kioskId, categoryId);
  if (!allowed) {
    const err = new Error("CATEGORY_NOT_ALLOWED_FOR_KIOSK");
    err.status = 403;
    throw err;
  }

  const rows = await repo.listProductsByCategory(shopId, categoryId);

  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.product_id)) {
      map.set(r.product_id, {
        id: r.product_id,
        name: r.product_name,
        description: r.description,
        variants: [],
      });
    }
    if (r.variant_id) {
      map.get(r.product_id).variants.push({
        id: r.variant_id,
        sku: r.sku,
        size: r.size,
        color: r.color,
        price: r.price,
        stock: r.stock,
        model_3d_url: r.model_3d_url,
        image_urls: r.image_urls,
      });
    }
  }
  return Array.from(map.values());
};

const createProductWithImage = async (data) => {
  if (!data.shop_id || !data.category_id || !data.name) {
    const err = new Error("MISSING_REQUIRED_FIELDS");
    err.status = 400;
    throw err;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const productId = await repo.insertProduct(client, {
      shop_id: data.shop_id,
      category_id: data.category_id,
      name: data.name,
      description: data.description || null,
    });

    const variant = await repo.insertVariant(client, {
      product_id: productId,
      sku: data.sku,
      size: data.size,
      color: data.color,
      price: data.price,
      stock: data.stock || 0,
      model_3d_url: data.model_3d_url,
    });

    await client.query("COMMIT");

    return {
      product_id: productId,
      variant,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getAllProducts = async (shopId, limit, cursor) => {
  return await repo.listAllProducts(shopId, limit, cursor);
};

// =========================================
// 1. LẤY CHI TIẾT SẢN PHẨM (MỚI)
// =========================================
const getProductDetail = async (productId) => {
  // Lấy thông tin chung của sản phẩm
  const productQuery = `
    SELECT id, shop_id, category_id, name, description, status 
    FROM products 
    WHERE id = $1 AND deleted_at IS NULL
  `;
  const productRes = await pool.query(productQuery, [productId]);
  if (productRes.rowCount === 0) return null;

  const product = productRes.rows[0];

  // Lấy tất cả biến thể (variants) của sản phẩm đó
  const variantQuery = `
    SELECT id, sku, size, color, price, stock, model_3d_url, image_urls
    FROM product_variants
    WHERE product_id = $1
  `;
  const variantRes = await pool.query(variantQuery, [productId]);

  product.variants = variantRes.rows;
  return product;
};

// =========================================
// 2. TẠO ĐƠN HÀNG TỪ KIOSK (MỚI)
// =========================================
const createOrder = async (orderData) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 🔥 1. tạo order_code (number)
    const order_code = Number(Date.now()); // hoặc dùng sequence nếu muốn chuẩn hơn

    // 2.1 Insert vào bảng orders
    const insertOrderQuery = `
      INSERT INTO orders (
        shop_id, kiosk_id, user_id, kiosk_session_id,
        total_amount, payment_method,
        status, payment_status,
        order_code
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', 'unpaid', $7)
      RETURNING id, order_code, status, payment_status, created_at, total_amount
    `;

    const orderValues = [
      orderData.shop_id,
      orderData.kiosk_id,
      orderData.user_id,
      orderData.kiosk_session_id,
      orderData.total_amount,
      orderData.payment_method,
      order_code, // ✅ thêm vào
    ];

    const orderRes = await client.query(insertOrderQuery, orderValues);
    const newOrder = orderRes.rows[0];

    // 2.2 Insert order_items
    const insertItemQuery = `
      INSERT INTO order_items (order_id, product_variant_id, quantity, unit_price, subtotal)
      VALUES ($1, $2, $3, $4, $5)
    `;

    for (const item of orderData.items) {
      await client.query(insertItemQuery, [
        newOrder.id,
        item.product_variant_id,
        item.quantity || 1,
        item.unit_price,
        item.subtotal,
      ]);
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

// =========================================
// 3. KIỂM TRA TRẠNG THÁI ĐƠN HÀNG (MỚI)
// =========================================
const checkOrderStatus = async (orderId) => {
  const query = `
    SELECT id, status, payment_status, payment_method, total_amount, created_at
    FROM orders
    WHERE id = $1
  `;
  const res = await pool.query(query, [orderId]);
  if (res.rowCount === 0) return null;
  return res.rows[0];
};

// =========================================
// 4. LẤY TOÀN BỘ DANH SÁCH ĐƠN HÀNG (PHÂN TRANG CURSOR)
// =========================================
const getAllOrders = async (shopId, limit = 50, cursor = null) => {
  // 1. Xây dựng câu query cơ bản
  let orderQuery = `
    SELECT id, shop_id, kiosk_id, user_id, kiosk_session_id, total_amount, status, payment_status, payment_method, created_at
    FROM orders
    WHERE shop_id = $1
  `;
  const queryParams = [shopId, limit];

  // Nếu có cursor (thời gian của đơn hàng cuối cùng ở trang trước), ta chỉ lấy các đơn cũ hơn (<)
  if (cursor) {
    orderQuery += ` AND created_at < $3`;
    queryParams.push(cursor);
  }

  // Luôn sắp xếp mới nhất lên đầu
  orderQuery += ` ORDER BY created_at DESC LIMIT $2`;

  const orderRes = await pool.query(orderQuery, queryParams);
  const orders = orderRes.rows;

  if (orders.length === 0) {
    return { data: [], nextCursor: null };
  }

  // 2. Lấy chi tiết các món hàng (order_items)
  const orderIds = orders.map((o) => o.id);
  const itemsQuery = `
    SELECT id, order_id, product_variant_id, quantity, unit_price, subtotal
    FROM order_items
    WHERE order_id = ANY($1::uuid[])
  `;
  const itemsRes = await pool.query(itemsQuery, [orderIds]);

  // Nhóm các món hàng vào đơn hàng tương ứng
  const itemsByOrderId = {};
  for (const item of itemsRes.rows) {
    if (!itemsByOrderId[item.order_id]) {
      itemsByOrderId[item.order_id] = [];
    }
    itemsByOrderId[item.order_id].push(item);
  }

  for (const order of orders) {
    order.items = itemsByOrderId[order.id] || [];
  }

  // 3. Xác định nextCursor cho trang tiếp theo
  // Nếu số lượng trả về bằng đúng limit, khả năng cao là vẫn còn data -> Lấy created_at của đơn cuối làm cursor
  let nextCursor = null;
  if (orders.length === limit) {
    const lastOrder = orders[orders.length - 1];
    nextCursor = lastOrder.created_at.toISOString(); // Chuyển thành chuỗi ISO chuẩn
  }

  return {
    data: orders,
    nextCursor: nextCursor,
  };
};

// =========================================
// 5. LẤY CHI TIẾT 1 ĐƠN HÀNG (MỚI)
// =========================================
const getOrderDetail = async (orderId) => {
  // 1. Lấy thông tin chung của đơn hàng
  const orderQuery = `
    SELECT id, shop_id, kiosk_id, user_id, kiosk_session_id, total_amount, status, payment_status, payment_method, created_at
    FROM orders
    WHERE id = $1
  `;
  const orderRes = await pool.query(orderQuery, [orderId]);

  if (orderRes.rowCount === 0) return null; // Không tìm thấy đơn
  const order = orderRes.rows[0];

  // 2. Lấy danh sách sản phẩm trong đơn hàng đó
  const itemsQuery = `
    SELECT id, product_variant_id, quantity, unit_price, subtotal
    FROM order_items
    WHERE order_id = $1
  `;
  const itemsRes = await pool.query(itemsQuery, [orderId]);

  // Gắn danh sách sản phẩm vào object order
  order.items = itemsRes.rows;

  return order;
};
// =========================================
// 6. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (MỚI)
// =========================================
const updateOrderStatus = async (orderId, status) => {
  // Cập nhật trạng thái đơn hàng và trả về thông tin sau khi cập nhật
  const query = `
    UPDATE orders 
    SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, shop_id, status, payment_status, total_amount, updated_at, kiosk_session_id
  `;
  const res = await pool.query(query, [status, orderId]);

  if (res.rowCount === 0) return null; // Không tìm thấy đơn hàng
  return res.rows[0];
};

const updateOrderStatusByOrderCode = async (orderCode, status) => {
  const query = `
    UPDATE orders 
    SET payment_status = $1, updated_at = NOW()
    WHERE order_code = $2
    RETURNING id, order_code, shop_id, status, payment_status, total_amount, updated_at, kiosk_session_id
  `;

  const res = await pool.query(query, [status, orderCode]);

  if (res.rowCount === 0) return null;
  return res.rows[0];
};
// =========================================
// 7. LỌC / TÌM KIẾM ĐƠN HÀNG (PHÂN TRANG CURSOR)
// =========================================
const filterOrders = async (shopId, filters, limit = 50, cursor = null) => {
  let query = `
    SELECT id, shop_id, kiosk_id, user_id, kiosk_session_id, total_amount, status, payment_status, payment_method, created_at
    FROM orders
    WHERE shop_id = $1
  `;
  const params = [shopId];
  let paramIndex = 2; // Bắt đầu từ $2

  // --- THÊM ĐIỀU KIỆN LỌC ---
  if (filters.status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(filters.status);
  }
  if (filters.payment_status) {
    query += ` AND payment_status = $${paramIndex++}`;
    params.push(filters.payment_status);
  }
  if (filters.payment_method) {
    query += ` AND payment_method = $${paramIndex++}`;
    params.push(filters.payment_method);
  }
  if (filters.start_date) {
    query += ` AND created_at >= $${paramIndex++}`;
    params.push(filters.start_date);
  }
  if (filters.end_date) {
    query += ` AND created_at <= $${paramIndex++}`;
    params.push(filters.end_date);
  }

  // --- XỬ LÝ CURSOR ---
  // Nếu có truyền cursor (thời gian của đơn cuối trang trước), lấy các đơn cũ hơn
  if (cursor) {
    query += ` AND created_at < $${paramIndex++}`;
    params.push(cursor);
  }

  // Luôn sắp xếp mới nhất lên đầu và giới hạn số lượng
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++}`;
  params.push(limit);

  // Thực thi truy vấn lấy đơn hàng
  const orderRes = await pool.query(query, params);
  const orders = orderRes.rows;

  if (orders.length === 0) {
    return { data: [], nextCursor: null };
  }

  // Lấy chi tiết món hàng của các đơn đó
  const orderIds = orders.map((o) => o.id);
  const itemsQuery = `
    SELECT id, order_id, product_variant_id, quantity, unit_price, subtotal
    FROM order_items
    WHERE order_id = ANY($1::uuid[])
  `;
  const itemsRes = await pool.query(itemsQuery, [orderIds]);

  const itemsByOrderId = {};
  for (const item of itemsRes.rows) {
    if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
    itemsByOrderId[item.order_id].push(item);
  }

  for (const order of orders) {
    order.items = itemsByOrderId[order.id] || [];
  }

  // Xác định nextCursor
  let nextCursor = null;
  if (orders.length === limit) {
    const lastOrder = orders[orders.length - 1];
    nextCursor = lastOrder.created_at.toISOString();
  }

  return {
    data: orders,
    nextCursor: nextCursor,
  };
};

// =========================================
// LẤY DANH SÁCH KHÁCH HÀNG (CURSOR PAGINATION)
// =========================================
const getCustomers = async (shopId, limit = 20, cursor = null) => {
  let query = `
    SELECT 
      u.id AS user_id, 
      u.phone, 
      u.full_name, 
      u.zalo_user_id, 
      u.avatar_url,
      su.first_seen_at, 
      su.last_seen_at, 
      su.total_sessions, 
      su.source
    FROM shop_users su
    JOIN users u ON su.user_id = u.id
    WHERE su.shop_id = $1
  `;

  const params = [shopId];
  let paramIndex = 2;

  // Xử lý Cursor: Lấy những khách hàng cũ hơn mốc thời gian truyền vào
  if (cursor) {
    query += ` AND su.first_seen_at < $${paramIndex++}`;
    params.push(cursor);
  }

  // Sắp xếp khách hàng mới nhất (first_seen_at) lên đầu
  query += ` ORDER BY su.first_seen_at DESC LIMIT $${paramIndex++}`;
  params.push(limit);

  const res = await pool.query(query, params);
  const customers = res.rows;

  if (customers.length === 0) {
    return { data: [], nextCursor: null };
  }

  // Xác định nextCursor cho lần tải tiếp theo
  let nextCursor = null;
  if (customers.length === limit) {
    const lastCustomer = customers[customers.length - 1];
    // Dùng first_seen_at của người cuối cùng trong danh sách làm mốc
    nextCursor = lastCustomer.first_seen_at.toISOString();
  }

  return {
    data: customers,
    nextCursor: nextCursor,
  };
};

// =========================================
// LẤY CHI TIẾT 1 KHÁCH HÀNG
// =========================================
const getCustomerDetail = async (shopId, customerId) => {
  const query = `
    SELECT 
      u.id AS user_id, 
      u.phone, 
      u.full_name, 
      u.zalo_user_id, 
      u.avatar_url,
      u.created_at AS system_joined_at,
      su.first_seen_at, 
      su.last_seen_at, 
      su.total_sessions, 
      su.consent_marketing,
      su.source
    FROM shop_users su
    JOIN users u ON su.user_id = u.id
    WHERE su.shop_id = $1 AND u.id = $2
  `;

  const res = await pool.query(query, [shopId, customerId]);

  if (res.rowCount === 0) return null; // Không tìm thấy khách hàng trong shop này
  return res.rows[0];
};

// =========================================
// LỌC / TÌM KIẾM KHÁCH HÀNG (CURSOR PAGINATION)
// =========================================
const filterCustomers = async (shopId, filters, limit = 20, cursor = null) => {
  let query = `
    SELECT 
      u.id AS user_id, 
      u.phone, 
      u.full_name, 
      u.avatar_url,
      su.first_seen_at, 
      su.last_seen_at, 
      su.total_sessions,
      su.consent_marketing
    FROM shop_users su
    JOIN users u ON su.user_id = u.id
    WHERE su.shop_id = $1
  `;

  const params = [shopId];
  let paramIndex = 2; // Bắt đầu từ $2 vì $1 là shopId

  // --- 1. LỌC THEO TỪ KHÓA (Tên hoặc Số điện thoại) ---
  if (filters.search) {
    // Dùng ILIKE để tìm kiếm không phân biệt hoa thường
    query += ` AND (u.full_name ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  // --- 2. LỌC THEO SỐ LẦN ĐẾN QUÁN (Ví dụ: Khách VIP có total_sessions > 5) ---
  if (filters.min_sessions) {
    query += ` AND su.total_sessions >= $${paramIndex++}`;
    params.push(filters.min_sessions);
  }

  // --- 3. LỌC THEO THỜI GIAN GIA NHẬP ---
  if (filters.start_date) {
    query += ` AND su.first_seen_at >= $${paramIndex++}`;
    params.push(filters.start_date);
  }
  if (filters.end_date) {
    query += ` AND su.first_seen_at <= $${paramIndex++}`;
    params.push(filters.end_date);
  }

  // --- 4. XỬ LÝ CURSOR ---
  if (cursor) {
    query += ` AND su.first_seen_at < $${paramIndex++}`;
    params.push(cursor);
  }

  // Luôn sắp xếp khách hàng mới nhất lên đầu
  query += ` ORDER BY su.first_seen_at DESC LIMIT $${paramIndex++}`;
  params.push(limit);

  const res = await pool.query(query, params);
  const customers = res.rows;

  if (customers.length === 0) {
    return { data: [], nextCursor: null };
  }

  // Xác định nextCursor cho lần tải tiếp theo
  let nextCursor = null;
  if (customers.length === limit) {
    const lastCustomer = customers[customers.length - 1];
    nextCursor = lastCustomer.first_seen_at.toISOString();
  }

  return {
    data: customers,
    nextCursor: nextCursor,
  };
};

const generateRandomAdImages = async (shopId, limit = 5) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Lấy ngẫu nhiên các sản phẩm có ảnh của shop này
    const randomQuery = `
      SELECT pv.id, pv.image_urls, p.name
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE p.shop_id = $1 AND p.status = 'active'
        AND pv.image_urls IS NOT NULL AND array_length(pv.image_urls, 1) > 0
      ORDER BY RANDOM() LIMIT $2
    `;
    const productRes = await client.query(randomQuery, [shopId, limit]);

    if (productRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return { eventId: null, images: [] };
    }

    // 2. Tạo record sự kiện quảng cáo (type: auto_random)
    const eventName = `Tự động - ${new Date().toLocaleDateString("vi-VN")} ${new Date().toLocaleTimeString()}`;
    const eventQuery = `
      INSERT INTO advertise_events (shop_id, name, type, status)
      VALUES ($1, $2, 'auto_random', 'active')
      RETURNING id, name, created_at
    `;
    const eventRes = await client.query(eventQuery, [shopId, eventName]);
    const eventData = eventRes.rows[0];

    // 3. Lưu chi tiết các ảnh vào bảng advertise_event_images
    const insertImgQuery = `
      INSERT INTO advertise_event_images (advertise_event_id, image_url, product_variant_id, sort_order)
      VALUES ($1, $2, $3, $4)
    `;

    const imagesResult = [];
    for (let i = 0; i < productRes.rows.length; i++) {
      const row = productRes.rows[i];
      const img = row.image_urls[0]; // Lấy ảnh đầu tiên của variant
      await client.query(insertImgQuery, [eventData.id, img, row.id, i]);
      imagesResult.push({ product_name: row.name, image_url: img });
    }

    await client.query("COMMIT");
    return {
      event_id: eventData.id,
      event_name: eventData.name,
      created_at: eventData.created_at,
      images: imagesResult,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const saveManualSelection = async (shopId, name, variantIds) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Tạo sự kiện quảng cáo mới (type: manual_selection)
    const eventQuery = `
      INSERT INTO advertise_events (shop_id, name, type, status)
      VALUES ($1, $2, 'manual_selection', 'active')
      RETURNING id, name, created_at
    `;
    const eventRes = await client.query(eventQuery, [
      shopId,
      name || "Quảng cáo thủ công",
    ]);
    const eventData = eventRes.rows[0];

    // 2. Lấy thông tin ảnh của các variant đã chọn để lưu vào bảng chi tiết
    const selectVariantsQuery = `
      SELECT id, image_urls 
      FROM product_variants 
      WHERE id = ANY($1)
    `;
    const variantRes = await client.query(selectVariantsQuery, [variantIds]);

    const insertImgQuery = `
      INSERT INTO advertise_event_images (advertise_event_id, image_url, product_variant_id, sort_order)
      VALUES ($1, $2, $3, $4)
    `;

    const savedImages = [];
    for (let i = 0; i < variantRes.rows.length; i++) {
      const row = variantRes.rows[i];
      const img =
        row.image_urls && row.image_urls.length > 0 ? row.image_urls[0] : null;

      if (img) {
        await client.query(insertImgQuery, [eventData.id, img, row.id, i]);
        savedImages.push({
          variant_id: row.id,
          image_url: img,
        });
      }
    }

    await client.query("COMMIT");
    return {
      event_id: eventData.id,
      name: eventData.name,
      created_at: eventData.created_at,
      images: savedImages,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const getOrderByOrderCode = async (orderCode) => {
  const query = `
    SELECT 
      id,
      order_code,
      shop_id,
      kiosk_id,
      user_id,
      kiosk_session_id,
      status,
      payment_status,
      total_amount,
      created_at,
      updated_at
    FROM orders
    WHERE order_code = $1
    LIMIT 1
  `;

  const res = await pool.query(query, [orderCode]);

  if (res.rowCount === 0) return null;

  return res.rows[0];
};
module.exports = {
  getMyCategories,
  getProductsByCategory,
  createProductWithImage,
  getAllProducts,
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
  generateRandomAdImages,
  saveManualSelection,
  updateOrderStatusByOrderCode,
  getOrderByOrderCode,
};
