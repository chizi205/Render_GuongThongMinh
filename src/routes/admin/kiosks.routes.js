const express = require("express");
const router = express.Router();

// TODO: GET /kiosks
router.get("/", (req, res) => {
  res.json({ success: true, message: "ADMIN_KIOSKS_TODO" });
});

module.exports = router;
