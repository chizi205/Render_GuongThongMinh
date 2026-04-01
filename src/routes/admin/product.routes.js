const express = require("express");
const router = express.Router();
const productController = require("../../controllers/admin/product.controller");
const adminAuth = require("../../middleware/authAdmin");
const multer = require("multer");

// Config Multer để lưu ảnh
const upload = multer({ dest: 'public/uploads/' }); 

// API Sản phẩm chính
router.get("/", adminAuth, productController.getProducts);
router.post("/", adminAuth, upload.single("image"), productController.createProduct);
router.put("/:id", adminAuth, upload.single("image"), productController.updateProduct);
router.delete("/:id", adminAuth, productController.deleteProduct);

// API Biến thể
router.post("/:productId/variants", adminAuth, upload.single("images"), productController.createVariant);
router.put("/variants/:variantId", adminAuth, upload.single("images"), productController.updateVariant);
router.delete("/variants/:variantId", adminAuth, productController.deleteVariant);

module.exports = router;