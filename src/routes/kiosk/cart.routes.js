const express = require("express");
const router = express.Router();

const kioskAuth = require("../../middleware/authKiosk");
const userAuth = require("../../middleware/authUser");
const controller = require("../../controllers/kiosk/cart.controller");

router.post("/cart/items", kioskAuth, userAuth, controller.addItem);

router.get("/cart/:sessionId", kioskAuth, userAuth, controller.getCart);

router.patch("/cart/items/:itemId", kioskAuth, userAuth, controller.updateItem);

router.delete("/cart/items/:itemId", kioskAuth, userAuth, controller.removeItem);

module.exports = router;