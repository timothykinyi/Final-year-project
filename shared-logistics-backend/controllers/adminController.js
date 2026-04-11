const User = require("../models/admin");
const Delivery = require("../models/Delivery");
const Transaction = require("../models/Transaction");
const Shop = require("../models/Shop");
const Rider = require("../models/Rider");
const {generateToken, generateAlphanumericVerificationCode} = require("../utils/generateToken");
const setTokenCookie = require("../utils/setTokenCookie.js");


// Admin registration
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if admin already exists
    let existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }
    const verificationCode = generateAlphanumericVerificationCode(6);
    // Create new admin
    const admin = new User({
      name,
      email,
      phone,
      verificationCode,
      password,
    });       
    await admin.save();

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}


// 🛡️ ADMIN LOGIN
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ FIX: pass ID
    const token = generateToken(admin._id);

    setTokenCookie(res, token);

    res.json({
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: "admin", // ✅ VERY IMPORTANT
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📊 GET ADMIN STATS
exports.getAdminStats = async (req, res) => {
  try {
    const totalDeliveries = await Delivery.countDocuments();
    const activeRiders = await Rider.countDocuments({ status: "active" });
    const totalShops = await Shop.countDocuments();

    const transactions = await Transaction.find({ status: "completed" });
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

    res.json({
      totalDeliveries,
      activeRiders,
      totalShops,
      totalRevenue,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 👥 GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    // 🔹 Get shops (exclude password)
    const shops = await Shop.find().select("-password");

    // 🔹 Get riders (exclude password)
    const riders = await Rider.find().select("-password");

    // 🔥 Normalize shops
    const formattedShops = shops.map((shop) => ({
      _id: shop._id,
      name: shop.name,
      email: shop.email,
      phone: shop.phone,
      role: "shop",
      isVerified: shop.isVerified,
      createdAt: shop.createdAt,
      active: shop.active,
    }));

    // 🔥 Normalize riders
    const formattedRiders = riders.map((rider) => ({
      _id: rider._id,
      name: rider.name,
      email: rider.email,
      phone: rider.phone,
      role: "rider",
      status: rider.status,
      isAvailable: rider.isAvailable,
      totalEarnings: rider.totalEarnings,
      createdAt: rider.createdAt,
      active: rider.active,
    }));

    // 🔥 Combine both
    const users = [...formattedShops, ...formattedRiders];

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔁 TOGGLE USER STATUS
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Toggling status for user ID:", id);
    // 🔍 Try finding user in both collections
    let shop = await Shop.findById(id);
    let rider = null;

    if (!shop) {
      rider = await Rider.findById(id);
    }

    // ❌ If not found anywhere
    if (!shop && !rider) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🏪 If it's a shop
    if (shop) {
      // Add active field if you don’t have it yet
      shop.active = !shop.active;
      await shop.save();

      return res.json({
        message: "Shop status updated",
        type: "shop",
        active: shop.active,
      });
    }

    // 🛵 If it's a rider
    if (rider) {
      // Toggle between active <-> suspended
      rider.status =
        rider.status === "active" ? "suspended" : "active";

      await rider.save();

      return res.json({
        message: "Rider status updated",
        type: "rider",
        status: rider.status,
      });
    }
  } catch (err) {
    console.error("Error toggling user status:", err);
    res.status(500).json({ message: err.message });
  }
};

// 📦 GET ALL DELIVERIES
exports.getAllDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find()
      .populate("shop", "name")
      .populate("rider", "name");

    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔄 REASSIGN DELIVERY
exports.reassignDelivery = async (req, res) => {
  try {
    const { riderId } = req.body;

    const delivery = await Delivery.findById(req.params.id);
    delivery.rider = riderId;

    await delivery.save();

    res.json({ message: "Delivery reassigned" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 💰 GET ALL TRANSACTIONS
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("user", "name");

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ APPROVE WITHDRAWAL
exports.approveWithdrawal = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    transaction.status = "completed";
    await transaction.save();

    res.json({ message: "Withdrawal approved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};