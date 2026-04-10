const express = require("express");
const {
  registerShop,
  loginShop,
  logoutShop,
  getShopAnalytics,
  forgotPassword,
  resetPassword,
  updateShopProfile,
  updateShopPassword,
} = require("../controllers/shopController");
const { protect } = require("../middleware/authMiddleware");


const router = express.Router();

// Auth routes
router.post("/register", registerShop);
router.post("/login", loginShop);
router.post("/logout", protect, logoutShop);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword); 
// Analytics route
router.get("/:id/analytics", getShopAnalytics);
router.put("/profile", protect, updateShopProfile);
router.put("/update-password", protect, updateShopPassword);

module.exports = router;



