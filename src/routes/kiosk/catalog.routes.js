const express = require("express");
const router = express.Router();
const kioskAuth = require("../../middleware/authKiosk");
const controller = require("../../controllers/kiosk/catalog.controller");
const { uploadLocal } = require("../../middleware/multerUpload");
const userAuth = require("../../middleware/authUser");
router.get("/me/categories", kioskAuth, controller.myCategories);
router.get("/me/products", kioskAuth, controller.productsByCategory);
router.get("/products/all", controller.getAllProducts);
router.post(
  "/products-full",
  uploadLocal.single("bodyImage"),
  controller.createProductWithImage,
);


router.get("/products/:productId", controller.getProductDetail);


router.post(
  "/orders",
  kioskAuth, 
  userAuth, 
  controller.createOrder,
);


router.get("/orders/:orderId/status", controller.checkOrderStatus);

router.get("/orders", kioskAuth, controller.getAllOrders);

router.get("/orders/:orderId", kioskAuth, controller.getOrderDetail);

router.patch(
  "/orders/:orderId/status",
  kioskAuth,
  controller.updateOrderStatus,
);

router.get("/orders/filter", kioskAuth, controller.filterOrders);

router.get("/customers", kioskAuth, controller.getCustomers);

router.get("/customers/:id", kioskAuth, controller.getCustomerDetail);

router.get("/customers/filter", kioskAuth, controller.filterCustomers);

router.post(
  "/advertise/random-images",
  kioskAuth,
  controller.generateRandomImages,
);

router.post(
  "/advertise/selection-images",
  kioskAuth,
  controller.selectManualImages,
);

module.exports = router;
