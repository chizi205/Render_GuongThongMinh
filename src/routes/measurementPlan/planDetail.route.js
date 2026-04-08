const express = require("express");
const router = express.Router();

const controller = require("../../controllers/measurementPlan/planDetail.controller");
const staffAuth = require("../../middleware/authStaff");

router.get("/:plan_id/customers", staffAuth, controller.getCustomers);//api/plans/:plan_id/customers

module.exports = router;