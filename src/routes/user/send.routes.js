const express = require("express");
const router = express.Router();
const controller = require("../../controllers/user/send.controller");
const userAuth = require("../../middleware/authUser");
const kioskAuth = require("../../middleware/authKiosk");

router.post("/send-images", kioskAuth, userAuth, controller.sendImages);
router.post("/send-text", kioskAuth, userAuth, controller.sendText);

module.exports = router;
