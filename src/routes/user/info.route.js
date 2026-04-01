const express = require("express");
const controller = require("../../controllers/user/info.controller");
const userAuth = require("../../middleware/authUser");

const router = express.Router();

// thông tin user
router.get("/me", userAuth, controller.getProfile);//user/info/me 

// lịch sử ảnh
router.get("/me/photos", userAuth, controller.getPhotoHistory);

module.exports = router;