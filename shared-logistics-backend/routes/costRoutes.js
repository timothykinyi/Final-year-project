// routes/costRoutes.js
const express = require("express");
const router = express.Router();
const { calculateDeliveryCost } = require("../controllers/costController");

// POST calculate costs
router.get("/calc-cost/:deliveryId", calculateDeliveryCost);
module.exports = router;
