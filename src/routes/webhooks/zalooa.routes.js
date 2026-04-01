const express = require("express");
const router = express.Router();

router.post("/zalo", (req,res)=>{
    console.log("webhook zalo")
});

module.exports = router;