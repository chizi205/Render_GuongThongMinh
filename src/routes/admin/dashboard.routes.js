const express = require("express");
const router = express.Router();
const dashboardController = require("../../controllers/admin/dashboard.controller");
const authAdmin = require("../../middleware/authAdmin");

router.get("/", authAdmin, dashboardController.getDashboard);

module.exports = router;