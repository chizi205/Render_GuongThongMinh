const express = require("express");
const router = express.Router();

// TODO: manage kiosks + kiosk_categories config
router.get("/", (req, res) => {
  res.json({ success: true, message: "SHOP_KIOSK_TODO" });
});

module.exports = router;
