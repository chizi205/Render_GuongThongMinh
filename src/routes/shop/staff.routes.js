const express = require("express");
const router = express.Router();

// TODO: manage shop_staffs
router.get("/", (req, res) => {
  res.json({ success: true, message: "SHOP_STAFF_TODO" });
});

module.exports = router;
