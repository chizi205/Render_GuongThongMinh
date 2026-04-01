const express = require("express");
const router = express.Router();
const kioskAuth = require("../../middleware/authKiosk");
const controller = require("../../controllers/kiosk/tryons.controller");
const upload = require("../../middleware/multerUpload"); 

router.post("/tryon/body", kioskAuth, upload.uploadBodyImage, controller.uploadBody);
router.post("/tryon/process", kioskAuth, controller.processTryOn);

module.exports = router;
