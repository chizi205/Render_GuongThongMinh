const express = require("express");
const router = express.Router();
const customerController = require("../../controllers/admin/customer.controller");
const adminAuth = require("../../middleware/authAdmin");

router.get("/",adminAuth, customerController.getAllCustomers);
router.get("/:id",adminAuth, customerController.getCustomerDetail);
router.put("/:id", adminAuth, customerController.updateCustomer);
router.delete("/:id", adminAuth, customerController.deleteCustomer);


module.exports = router;