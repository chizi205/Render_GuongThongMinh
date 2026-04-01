const express = require("express");
const router = express.Router();

router.post("/zalo", (req, res) => {
  console.log("Zalo webhook:", req.body);
  res.status(200).send("OK");
});

module.exports = router;
