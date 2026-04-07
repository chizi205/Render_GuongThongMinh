const express = require("express");
const router = express.Router();
const sendMarketingTryOnController = require("../../controllers/admin/sendMarketingTryOn.controller");
const adminAuth = require("../../middleware/authAdmin");

router.post("/", adminAuth, sendMarketingTryOnController.sendMarketingTryOn);
module.exports = router;