const express = require("express");
const router = express.Router();

// TODO: POST /login
router.post("/login", (req, res) => {
  res.json({ success: true, message: "SHOP_LOGIN_TODO" });
});

module.exports = router;
