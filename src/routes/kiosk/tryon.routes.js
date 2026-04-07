const express = require("express");
const router = express.Router();
const kioskAuth = require("../../middleware/authKiosk");
const controller = require("../../controllers/kiosk/tryons.controller");


const { uploadBodyRoot } = require("../../middleware/multerUpload"); 

// Sử dụng uploadBodyRoot thay vì upload.uploadBodyImage
router.post("/tryon/body", kioskAuth, uploadBodyRoot, controller.uploadBody);
router.post("/tryon/process", kioskAuth, controller.processTryOn);

module.exports = router;