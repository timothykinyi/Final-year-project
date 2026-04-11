const express = require("express"); 
const router = express.Router();
const mpesaController = require("../controllers/mpesaController");
const { protectAll } = require("../middleware/authMiddleware");

router.get("/access_token",protectAll,  mpesaController.getAccessTokenHandler);
router.get("/stkpushold", protectAll, mpesaController.stkPushHandler);
router.post("/stkpush", protectAll, mpesaController.stkPushHandler);
router.post("/callback", protectAll, mpesaController.stkPushCallbackHandler);
router.get("/registerurl", protectAll, mpesaController.registerURLHandler);
router.get("/confirmation", protectAll, mpesaController.confirmURLHandler);
router.get("/validation", protectAll, mpesaController.validateURLHandler);
router.get("/b2curlrequest", protectAll, mpesaController.b2cRequestHandlers);
router.get("/b2c/queue", protectAll, mpesaController.queue);
router.get("/b2c/result", protectAll, mpesaController.result);

module.exports = router; 
