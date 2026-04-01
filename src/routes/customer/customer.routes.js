const express = require("express");
const router = express.Router();
const kioskAuth = require("../../middleware/authKiosk");
const controller = require("../../controllers/customer/customer.controller");

router.get("/", kioskAuth, controller.getCustomers);
router.get("/filter", kioskAuth, controller.filterCustomers);
router.get("/:id", kioskAuth, controller.getCustomerDetail);

module.exports = router;