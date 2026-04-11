const express = require("express");
const router = express.Router();
const { protectAll } = require("../middleware/authMiddleware");
const logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.json({ message: "Logged out" });
};

const getMe = async (req, res) => {
  res.json(req.user);
};

router.post("/logout", protectAll, logout);
router.get("/me", protectAll, getMe);


module.exports = router;
