const express = require("express");
const controller = require("../../controllers/user/auth.controller");
const router = express.Router();
const userAuth = require("../../middleware/authUser");
const kioskAuth = require("../../middleware/authKiosk");

router.post("/register", controller.register);
router.post("/login", controller.login);
router.get("/check-follow", kioskAuth, userAuth, controller.checkIsFollow);

module.exports = router;
