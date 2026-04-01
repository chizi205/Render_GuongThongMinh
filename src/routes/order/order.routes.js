const express = require("express");
const router = express.Router();
const kioskAuth = require("../../middleware/authKiosk");
const userAuth = require("../../middleware/authUser");
const controller = require("../../controllers/order/order.controller"); // Dùng controller order

router.post("/", kioskAuth, userAuth, controller.createOrder);
router.get("/shop", kioskAuth, controller.getShopOrders);
router.get("/filter", kioskAuth, controller.filterOrders);
router.get("/:orderId", kioskAuth, controller.getOrderDetail);
router.get("/:orderId/status", controller.checkOrderStatus);
router.patch("/:orderId/status", kioskAuth, controller.updateOrderStatus);
router.patch("/:orderId/payment-status", kioskAuth, controller.updatePaymentStatus);
router.get("/", kioskAuth, controller.getAllOrders);
module.exports = router;