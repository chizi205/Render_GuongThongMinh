const express = require("express");
const router = express.Router();
const kioskAuth = require("../../middleware/authKiosk");
const controller = require("../../controllers/advertise/advertise.controller");

router.post("/random-images", kioskAuth, controller.generateRandomImages);
router.post("/selection-images", kioskAuth, controller.selectManualImages);

module.exports = router;