const express = require("express");
const router = express.Router();

router.use("/admin/auth", require("./admin/auth.routes"));
router.use("/admin/shops", require("./admin/shops.routes"));
router.use("/admin/kiosks", require("./admin/kiosks.routes"));

router.use("/shop/auth", require("./shop/auth.routes"));
router.use("/shop/products", require("./shop/products.routes"));
router.use("/shop/categories", require("./shop/categories.routes"));
router.use("/shop/kiosks", require("./shop/kiosk.routes"));
router.use("/shop/staffs", require("./shop/staff.routes"));

router.use("/kiosk/auth", require("./kiosk/auth.routes"));
router.use("/kiosk", require("./kiosk/catalog.routes"));
router.use("/kiosk", require("./kiosk/tryon.routes"));
router.use("/kiosk", require("./kiosk/session.routes"));
router.use("/kiosk", require("./kiosk/cart.routes"));

router.use("/orders", require("./order/order.routes"));
router.use("/customers", require("./customer/customer.routes"));
router.use("/advertise", require("./advertise/advertise.routes"));

router.use("/user/auth", require("./user/auth.routes"));
router.use("/user/info", require("./user/info.route"));
router.use("/user/send", require("./user/send.routes"));

router.use("/album", require("./album/album.routes"));

router.use("/webhook",require("./webhooks/zalooa.routes"));
router.use("/webhook",require("./webhooks/payos.routes"));
module.exports = router;
