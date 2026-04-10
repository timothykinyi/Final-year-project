const express = require("express");
const router = express.Router();

const {
  withdrawMoney,
  getTransactions,
} = require("../controllers/riderWalletController");

const { protectRider } = require("../middleware/authRider");

// Withdraw
router.post("/withdraw", protectRider, withdrawMoney);

// Get transactions
router.get("/transactions", protectRider, getTransactions);

module.exports = router;