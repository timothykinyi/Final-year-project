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
const { protectAll } = require("../middleware/authMiddleware");
const logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.json({ message: "Logged out" });
};

const router = express.Router();

// Auth routes
router.post("/register", registerShop);
router.post("/login", loginShop);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword); 
// Analytics route
router.get("/:id/analytics", getShopAnalytics);
router.put("/profile", protectAll, updateShopProfile);
router.put("/update-password", protectAll, updateShopPassword);
router.post("/logout", protectAll, logout);


module.exports = router;



