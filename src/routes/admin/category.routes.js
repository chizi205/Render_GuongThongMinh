const express = require("express");
const router = express.Router();
const categoryController = require("../../controllers/admin/category.controller");
const adminAuth = require("../../middleware/authAdmin");

router.get("/", adminAuth, categoryController.getAllCategories);

module.exports = router;