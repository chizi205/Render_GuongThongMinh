const express = require("express");
const router = express.Router();
const controller = require("../../controllers/kiosk/auth.controller");

router.post("/login", controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);
module.exports = router;
