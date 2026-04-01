const express = require("express");
const router = express.Router();
const authController = require("../../controllers/admin/auth.controller");

// POST /api/admin/auth/register
router.post("/register", authController.register);

// POST /api/admin/auth/login
router.post("/login", authController.login);

module.exports = router;