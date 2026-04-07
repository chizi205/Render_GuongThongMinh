const express = require("express");
const router = express.Router();
const kioskController = require("../../controllers/admin/kiosk.controller");
const authAdmin = require("../../middleware/authAdmin");

router.use(authAdmin);

router.get("/", kioskController.getKiosks);
router.get("/:id", kioskController.getKioskById);
router.post("/", kioskController.createKiosk);
router.put("/:id", kioskController.updateKiosk);
router.delete("/:id", kioskController.deleteKiosk);

module.exports = router;