const express = require("express");
const router = express.Router();
const kioskAuth = require("../../middleware/authKiosk");
const controller = require("../../controllers/kiosk/session.controller");

router.get("/sessions", kioskAuth, controller.createSession);
router.patch("/sessions/:sessionId", kioskAuth, controller.endSession);
module.exports = router;
