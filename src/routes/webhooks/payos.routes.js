const express = require("express");
const router = express.Router();
const paymentController = require("../../controllers/kiosk/payment.controller");

router.post("/payos", paymentController.handlePayOSWebhook);

module.exports = router;