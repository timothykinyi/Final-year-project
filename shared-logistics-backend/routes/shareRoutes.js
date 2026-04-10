const express = require("express");
const router = express.Router();
const {
  shareViaEmail,
  shareViaWhatsApp,
} = require("../controllers/shareController");

router.post("/email", shareViaEmail);
router.post("/whatsapp", shareViaWhatsApp);

module.exports = router;
