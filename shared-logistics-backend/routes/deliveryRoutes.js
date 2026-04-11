const express = require("express");
const {
  createDelivery,
  getDeliveriesByShop,
  filterDeliveries,
  cancelDelivery
} = require("../controllers/deliveryController");
const { protectAll } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protectAll, createDelivery);
router.get("/", protectAll, getDeliveriesByShop);
router.get("/filter", protectAll, filterDeliveries);
router.patch("/:id/cancel", protectAll, cancelDelivery);

module.exports = router;
