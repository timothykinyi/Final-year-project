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


const { protectAll } = require("../middleware/authMiddleware");
const logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.json({ message: "Logged out" });
};

// Auth routes
router.post("/register", registerRider);
router.post("/login", loginRider);

// Rider-only routes (need JWT)
router.get("/available-deliveries", protectAll, getAvailableDeliveries);
router.get("/my-deliveries", protectAll, getMyDeliveries);
router.get("/analytics", protectAll, getRiderAnalytics);
router.put("/accept-delivery/:id", protectAll, acceptDelivery);
router.put("/Deliveryintransit/:id", protectAll, Deliveryintransit);
router.put("/Deliveryarrival/:id", protectAll, Deliveryarrival);

router.post("/update-location/:deliveryId", protectAll, updateRiderLocation);
router.get("/track/:id", trackDelivery);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword); 
router.put("/profile", protectAll, updateRiderProfile);
router.put("/update-password", protectAll, updateRiderPassword);
router.post("/logout", protectAll, logout);


module.exports = router;
