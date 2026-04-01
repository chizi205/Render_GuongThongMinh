const express = require("express");
const router = express.Router();

// TODO: CRUD categories
router.get("/", (req, res) => {
  res.json({ success: true, message: "SHOP_CATEGORIES_TODO" });
});

module.exports = router;
