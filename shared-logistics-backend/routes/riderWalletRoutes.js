const express = require("express");
const router = express.Router();

const {
  withdrawMoney,
  getTransactions,
} = require("../controllers/riderWalletController");

const { protectAll } = require("../middleware/authMiddleware");

// Withdraw
router.post("/withdraw", protectAll, withdrawMoney);

// Get transactions
router.get("/transactions", protectAll, getTransactions);

module.exports = router;