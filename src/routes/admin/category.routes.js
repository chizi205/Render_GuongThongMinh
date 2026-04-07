const express = require("express");
const router = express.Router();
const categoryController = require("../../controllers/admin/category.controller");
const adminAuth = require("../../middleware/authAdmin");

// Quản lý danh mục (Bắt buộc phải có token Admin)
router.get("/", adminAuth, categoryController.getCategories);
router.post("/", adminAuth, categoryController.createCategory);
router.put("/:id", adminAuth, categoryController.updateCategory);
router.delete("/:id", adminAuth, categoryController.deleteCategory);

module.exports = router;