const express = require("express");
const router = express.Router();
const {
  registerRider,
  loginRider,
  getAvailableDeliveries,
  getMyDeliveries,
  getRiderAnalytics,
  acceptDelivery,
  Deliveryintransit, 
  Deliveryarrival,
  updateRiderLocation,
  trackDelivery,
  forgotPassword,
  resetPassword,
  updateRiderProfile,
  updateRiderPassword,

} = require("../controllers/riderController");


const { protectRider } = require("../middleware/authRider");


// Auth routes
router.post("/register", registerRider);
router.post("/login", loginRider);

// Rider-only routes (need JWT)
router.get("/available-deliveries", protectRider, getAvailableDeliveries);
router.get("/my-deliveries", protectRider, getMyDeliveries);
router.get("/analytics", protectRider, getRiderAnalytics);
router.put("/accept-delivery/:id", protectRider, acceptDelivery);
router.put("/Deliveryintransit/:id", protectRider, Deliveryintransit);
router.put("/Deliveryarrival/:id", protectRider, Deliveryarrival);

router.post("/update-location/:deliveryId", protectRider, updateRiderLocation);
router.get("/track/:id", trackDelivery);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword); 
router.put("/profile", protectRider, updateRiderProfile);
router.put("/update-password", protectRider, updateRiderPassword);
module.exports = router;
