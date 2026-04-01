const express = require("express");
const router = express.Router();

// TODO: GET /shops
router.get("/", (req, res) => {
  res.json({ success: true, message: "ADMIN_SHOPS_TODO" });
});

module.exports = router;
