const express = require("express");
const router = express.Router();
const shopController = require("../../controllers/admin/shop.controller");
const authAdmin = require("../../middleware/authAdmin"); 
const { uploadShopLogo } = require("../../middleware/multerUpload");

router.use(authAdmin);
router.get("/", shopController.getShops);
router.get("/:id", shopController.getShopDetail);
router.post("/", uploadShopLogo, shopController.createShop);
router.put("/:id", uploadShopLogo, shopController.updateShop);
router.delete("/:id", shopController.deleteShop);

module.exports = router;