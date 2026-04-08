const express = require("express");
const router = express.Router();

const controller = require("../../controllers/measurementPlan/measurementPlan.controller");
const staffAuth = require("../../middleware/authStaff");

router.get("/", staffAuth, controller.getPlans);

module.exports = router;
