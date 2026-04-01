const express = require("express");
const router = express.Router();

// TODO: CRUD products
router.get("/", (req, res) => {
  res.json({ success: true, message: "SHOP_PRODUCTS_TODO" });
});

module.exports = router;
