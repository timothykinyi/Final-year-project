const express = require("express");
const {
  createDelivery,
  getDeliveriesByShop,
  filterDeliveries,
  cancelDelivery
} = require("../controllers/deliveryController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createDelivery);
router.get("/", protect, getDeliveriesByShop);
router.get("/filter", protect, filterDeliveries);
router.patch("/:id/cancel", protect, cancelDelivery);

module.exports = router;
