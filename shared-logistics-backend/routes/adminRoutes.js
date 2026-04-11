const express = require("express");
const router = express.Router();

const {
  getAdminStats,
  getAllUsers,
  toggleUserStatus,
  getAllDeliveries,
  reassignDelivery,
  getAllTransactions,
  approveWithdrawal,
  registerAdmin,
  adminLogin,
} = require("../controllers/adminController");

const { protectAll } = require("../middleware/adminMiddleware");
const logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.json({ message: "Logged out" });
};


const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};
// Public routes
router.post("/register", registerAdmin);
router.post("/login", adminLogin);


// 📊 Stats
router.get("/stats", getAdminStats);

// 👥 Users
router.get("/users",protectAll, requireAdmin,  getAllUsers);
router.patch("/users/:id/status", protectAll, requireAdmin, toggleUserStatus);

// 📦 Deliveries
router.get("/deliveries",  protectAll, requireAdmin, getAllDeliveries);
router.patch("/deliveries/:id/reassign",  protectAll, requireAdmin, reassignDelivery);

// 💰 Transactions
router.get("/transactions",  protectAll, getAllTransactions);
router.patch("/transactions/:id/approve",  protectAll, approveWithdrawal);
router.post("/logout", protectAll, logout);


module.exports = router;