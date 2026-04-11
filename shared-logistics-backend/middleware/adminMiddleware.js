const jwt = require("jsonwebtoken");
const Shop = require("../models/Shop");
const Rider = require("../models/Rider");
const Admin = require("../models/admin");

const protectAll = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔍 ADMIN
    let user = await Admin.findById(decoded.id).select("-password");
    if (user) {
      req.user = { ...user.toObject(), role: "admin" };
      return next();
    }

    // 🔍 SHOP
    user = await Shop.findById(decoded.id).select("-password");
    if (user) {
      req.user = { ...user.toObject(), role: "shop" };
      return next();
    }

    // 🔍 RIDER
    user = await Rider.findById(decoded.id).select("-password");
    if (user) {
      req.user = { ...user.toObject(), role: "rider" };
      return next();
    }

    return res.status(401).json({ message: "User not found" });

  } catch (error) {
    return res.status(401).json({ message: "Not authorized" });
  }
};

module.exports = { protectAll };