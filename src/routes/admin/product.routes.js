const express = require("express");
const router = express.Router();
const productController = require("../../controllers/admin/product.controller");
const adminAuth = require("../../middleware/authAdmin");

// IMPORT middleware chúng ta vừa cấu hình
const { uploadProductSingle, uploadVariantSingle } = require("../../middleware/multerUpload");

// API Sản phẩm chính (Dùng uploadProductSingle cho key "image")
router.get("/", adminAuth, productController.getProducts);
router.post("/", adminAuth, uploadProductSingle, productController.createProduct);
router.put("/:id", adminAuth, uploadProductSingle, productController.updateProduct);
router.delete("/:id", adminAuth, productController.deleteProduct);

// API Biến thể (Dùng uploadVariantSingle cho key "images")
router.post("/:productId/variants", adminAuth, uploadVariantSingle, productController.createVariant);
router.put("/variants/:variantId", adminAuth, uploadVariantSingle, productController.updateVariant);
router.delete("/variants/:variantId", adminAuth, productController.deleteVariant);

module.exports = router;