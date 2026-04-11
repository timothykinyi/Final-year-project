const Rider = require("../models/Rider");
const Transaction = require("../models/Transaction");
const bcrypt = require("bcryptjs");
const { b2cRequestHandler } = require("./mpesaController");
// =======================
// Withdraw Money
// =======================
exports.withdrawMoney = async (req, res) => {
  try {
    const riderId = req.user._id; // from auth middleware
    const { phone, amount, password } = req.body;

    // Basic validation
    if (!phone || !amount || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const rider = await Rider.findById(riderId);

    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, rider.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Check balance
    if (rider.totalEarnings < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct balance
    rider.totalEarnings -= amount;
    await rider.save();

    // Create transaction
    const transaction = await Transaction.create({
      rider: riderId,
      phone,
      amount,
      status: "pending",
    });

    const b2cResponse = await b2cRequestHandler(phone, amount);
    // ⚠️ Later: trigger MPESA here
    if (b2cResponse.success) {
      transaction.status = "completed";
      await transaction.save();  

      res.status(200).json({
      message: "Withdrawal request successful",
      transaction,
      b2cResponse,
    });
    } else {
      transaction.status = "failed";
      await transaction.save();  

      res.status(500).json({
        message: "Withdrawal request failed",
        error: b2cResponse.error,
      });
    }
    


  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// Get Transactions
// =======================
exports.getTransactions = async (req, res) => {
  try {
    const riderId = req.user._id;

    const transactions = await Transaction.find({ rider: riderId })
      .sort({ createdAt: -1 });

    res.status(200).json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};