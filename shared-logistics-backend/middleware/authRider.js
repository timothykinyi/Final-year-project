const jwt = require("jsonwebtoken");
const Rider = require("../models/Rider");

const protectRider = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await Rider.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "Rider not found" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized" });
  }
};


module.exports = { protectRider };
