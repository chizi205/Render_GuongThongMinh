const express = require("express");
const router = express.Router();

const controller = require("../../controllers/staff/staff.auth");

router.post("/login", controller.login);

module.exports = router;
