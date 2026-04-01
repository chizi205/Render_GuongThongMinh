const paymentService = require("../../services/kiosk/catalog.service");
const { verifyPayOSSignature } = require("../../utils/payos.util");
const { getIO } = require("../../socket");
const { sessionRoom } = require("../../socket/rooms");

exports.handlePayOSWebhook = async (req, res) => {
  try {
    const webhookPayload = req.body;
    console.log("🔥 PayOS Webhook received:", webhookPayload);

    // 1. Kiểm tra cấu trúc cơ bản
    if (!webhookPayload?.data?.orderCode) {
      console.warn("Invalid PayOS payload structure");
      return res.status(400).send("Invalid payload");
    }

    // 2. Verify signature (bắt buộc - PayOS yêu cầu)
    /*const isValid = verifyPayOSSignature(req); // hàm của bạn đã có sẵn
    if (!isValid) {
      console.warn("Invalid signature");
      return res.status(400).send("Invalid signature");
    }*/

    const orderCode = webhookPayload.data.orderCode;
    const isPaid = webhookPayload.success && webhookPayload.data.code === "00";


    const order = await paymentService.getOrderByOrderCode(orderCode);
    if (!order) {
      console.log(`Order ${orderCode} not found (có thể là test webhook)`);
      return res.status(200).json({ message: "OK - acknowledged" });
    }

    if (order.payment_status === "paid") {
      return res.status(200).json({ message: "Already processed" });
    }

    const io = getIO(); 

    if (isPaid) {
      await paymentService.updateOrderStatusByOrderCode(orderCode, "paid");
      console.log(order.kiosk_session_id)

      io.to(sessionRoom(order.kiosk_session_id)).emit("payment-update", {
        session_id: order.kiosk_session_id,
        orderId: orderCode,
        status: "SUCCESS",
      });

    } else {
      await paymentService.updateOrderStatusByOrderCode(orderCode, "failed");
      console.log(order.kiosk_session_id)
      io.to(sessionRoom(order.kiosk_session_id)).emit("payment-update", {
        session_id: order.kiosk_session_id,
        orderId: orderCode,
        status: "FAILED",
      });

    }

    return res.status(200).json({ message: "OK" });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).send("Server error");
  }
};