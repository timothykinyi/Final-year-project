const Shop = require("../models/Shop");
const Delivery = require("../models/Delivery");
const mongoose = require("mongoose");
const {generateToken, generateAlphanumericVerificationCode} = require("../utils/generateToken");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const sendEmail = require('../services/emailServiceold');

// @desc    Register a new shop
// @route   POST /api/shops/register
// Optional: replace with Winston later
const logError = (context, error) => {
  console.error(`[${new Date().toISOString()}] [${context}]`, {
    message: error.message,
    stack: error.stack,
  });
};

exports.registerShop = async (req, res) => {
  try {
    const {
      name,
      ownerName,
      email,
      phone,
      password,
      address,
      location,
    } = req.body;

    // -----------------------------
    // 1. VALIDATION
    // -----------------------------

    if (!name || !ownerName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Email validation
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Phone validation (Kenya format)
    const phoneRegex =  /^(?:\+254|0)(7\d{8}|1\d{8})$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format",
      });
    }

    // Password strength
    if (!validator.isStrongPassword(password, {
      minLength: 8,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 chars, include uppercase, special character and number",
      });
    }

    // -----------------------------
    // 2. SANITIZATION
    // -----------------------------
    const cleanEmail = validator.normalizeEmail(email);
    const cleanName = validator.escape(name.trim());
    const cleanOwnerName = validator.escape(ownerName.trim());

        // -----------------------------
    // 3. CHECK EXISTING SHOP
    // -----------------------------
    // check if shop exists using email OR phone number
    const existingShop = await Shop.findOne({
      $or: [{ email }, { phone, }]
    });

    if (existingShop) {
      return res.status(409).json({
        success: false,
        message: "A shop with this email or phone number already exists",
      });
    }

    // -----------------------------
    // 4. HASH PASSWORD
    // -----------------------------
    const hashedPassword = await bcrypt.hash(password, 10);


    const alphanumericCode = generateAlphanumericVerificationCode(6);
    const subject = `Verification - ${alphanumericCode}`;
    const vermessage = `Dear ${ownerName},

    Thank you for registering with Twende! Please use the following verification code to complete your registration:
    
    Verification Code: ${alphanumericCode}
    
    Best regards,
    Twende Support Team`;

    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.8; max-width: 600px; margin: auto; border: 1px solid #e1e1e1; padding: 25px; border-radius: 10px; background-color: #ffffff;">
        <h2 style="color: #1d4ed8; text-align: center; font-size: 26px; margin-bottom: 10px;">
          Welcome to Twende, ${ownerName}!
        </h2>
        <div style="margin: 25px 0; padding: 20px; background-color: #f0f5fc; border: 1px dashed #1d4ed8; text-align: center; border-radius: 8px;">
          <p style="font-size: 20px; font-weight: bold; color: #1d4ed8; letter-spacing: 1px;">
            Verification Code: <span style="color: #1d4ed8;">${alphanumericCode}</span>
          </p>
        </div>

        <p style="font-size: 16px; color: #333; text-align: center; margin-top: 30px;">
          Best regards,<br> Twende Support Team
        </p>
      </div>
    `;

    try {
      await sendEmail(email, subject, vermessage, htmlMessage);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ message: 'Error sending verification email' });
    }


    // -----------------------------
    // 5. CREATE SHOP
    // -----------------------------
    const shop = await Shop.create({
      name: cleanName,
      ownerName: cleanOwnerName,
      email: email,
      phone,    
      verificationCode: alphanumericCode,
      password: password,
      address,
      location,
    });

    // -----------------------------
    // 6. RESPONSE
    // -----------------------------
    return res.status(201).json({
      success: true,
      message: "Shop registered successfully",
      data: {
        _id: shop._id,
        name: shop.name,
        ownerName: shop.ownerName,
        email: shop.email,
        token: generateToken(shop._id),
      },
    });

  } catch (error) {
    // -----------------------------
    // 7. ERROR LOGGING
    // -----------------------------
    logError("REGISTER_SHOP", error);

    // Handle duplicate key error (Mongo)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate field value detected",
        error: error.keyValue,
      });
    }

    // Generic fallback
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && {
        error: error.message,
      }),
    });
  }
};

// @desc    Login shop & get token
// @route   POST /api/shops/login
exports.loginShop = async (req, res) => {
  try {
    const { email, password } = req.body;
    const shop = await Shop.findOne({ email });

    if (shop && (await shop.matchPassword(password))) {
      res.json({
        _id: shop._id,
        name: shop.name,
        ownerName: shop.ownerName,
        email: shop.email,
        token: generateToken(shop._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout shop (invalidate token on frontend)
// @route   POST /api/shops/logout
// @desc    Logout shop
// @route   POST /api/shops/logout
// @access  Private
exports.logoutShop = async (req, res) => {
  try {
    const shop = req.shop;

    if (!shop) {
      return res.status(400).json({ message: "No active shop session" });
    }

    // In a real system, we could push the token into a blacklist DB
    // For now, we just confirm logout with shop info
    res.json({
      message: "Logout successful",
      shop: {
        _id: shop._id,
        name: shop.name,
        email: shop.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc Get analytics for a shop
// @route GET /api/shops/:id/analytics
// @access Private (Shop only)
// @desc Get analytics for a shop
// @route GET /api/shops/:id/analytics
// @access Private (Shop only)
exports.getShopAnalytics = async (req, res) => {
  try {
    const shopId = req.params.id;
    const { startDate, endDate } = req.query;

    // Build flexible date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // === 1. Overview counts ===
    const totalDeliveries = await Delivery.countDocuments({
      shop: shopId,
      ...dateFilter,
    });

    const pendingDeliveries = await Delivery.countDocuments({
      shop: shopId,
      status: "pending",
      ...dateFilter,
    });

    const completedDeliveries = await Delivery.countDocuments({
      shop: shopId,
      status: "delivered",
      ...dateFilter,
    });

    const cancelledDeliveries = await Delivery.countDocuments({
      shop: shopId,
      status: "cancelled",
      ...dateFilter,
    });

    // === 2. Trends ===
    const matchStage = { shop: new mongoose.Types.ObjectId(shopId), ...dateFilter };

    // Per day
    const perDay = await Delivery.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Per week
    const perWeek = await Delivery.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $isoWeek: "$createdAt" },
          year: { $first: { $isoWeekYear: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { year: 1, _id: 1 } },
    ]);

    // Per month
    const perMonth = await Delivery.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Peak days
    const peakDays = perDay.length
      ? [perDay.reduce((a, b) => (b.count > a.count ? b : a))]
      : [];

    // === Final Response ===
    res.json({
      overview: {
        totalDeliveries,
        pendingDeliveries,
        completedDeliveries,
        cancelledDeliveries,
      },
      trends: {
        perDay,
        perWeek,
        perMonth,
        peakDays,
      },
      filters: { startDate: startDate || null, endDate: endDate || null },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => { 
  try {
    const { email } = req.body;
    const shop = await Shop.findOne({ email });

    if (!shop) {
      return res.status(404).json({ success: false, message: "No shop found with that email" });
    }

    // Generate a random passcode max 8 chars
    const passcode = Math.random().toString(36).slice(-8);

    // Save the passcode to the shop document
    shop.passcode = passcode;
    await shop.save();
    
    const subject = `Reset password - ${passcode}`;
    const vermessage = `
    Below is your password reset code. Use this code to reset your password on the app.

    Code: ${passcode}

    If you did not request a password reset, please ignore this email.

    Best regards,
    Twende Support Team`;


    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.8; max-width: 600px; margin: auto; border: 1px solid #e1e1e1; padding: 25px; border-radius: 10px; background-color: #ffffff;">
        <h2 style="color: #1d4ed8; text-align: center; font-size: 26px; margin-bottom: 10px;">
          Below is your password reset code. Use this code to reset your password on the app.
        </h2>
        <div style="margin: 25px 0; padding: 20px; background-color: #f0f5fc; border: 1px dashed #1d4ed8; text-align: center; border-radius: 8px;">
          <p style="font-size: 20px; font-weight: bold; color: #1d4ed8; letter-spacing: 1px;">
            Password Reset Code: <span style="color: #1d4ed8;">${passcode}</span>
          </p>
        </div>

        <p style="font-size: 16px; color: #333; text-align: center; margin-top: 30px;">
          If you did not request a password reset, please ignore this email. <br>
          Best regards,<br> Twende Support Team
        </p>
      </div>
    `;

    try {
      await sendEmail(shop.email, subject, vermessage, htmlMessage);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ message: 'Error sending verification email' });
    }

    res.json({ success: true, message: "Passcode sent to your email", passcode });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const shop = await Shop.findOne({ email });

    if (!shop) {
      return res.status(404).json({ success: false, message: "No shop found with that email" });
    }

    if (shop.passcode !== code) {
      return res.status(400).json({ success: false, message: "Invalid reset code" });
    }


    shop.password = newPassword;
    shop.passcode = undefined; // Clear the passcode after use
    await shop.save();

    const subject = `Changed password`;
    const vermessage = `
    Your password has been successfully reset. If you did not perform this action, please contact our support immediately.

    Best regards,
    Twende Support Team`;


    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.8; max-width: 600px; margin: auto; border: 1px solid #e1e1e1; padding: 25px; border-radius: 10px; background-color: #ffffff;">

        <p style="font-size: 16px; color: #333; text-align: center; margin-top: 30px;">
          Your password has been successfully reset. If you did not perform this action, please contact our support immediately.<br>
          Best regards,<br> Twende Support Team
        </p>
      </div>
    `;

    try {
      await sendEmail(shop.email, subject, vermessage, htmlMessage);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ message: 'Error sending verification email' });
    }

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- UPDATE SHOP PROFILE ----------------
exports.updateShopProfile = async (req, res) => {
  try {

    const shopId = req.shop.id;

    const { name, ownerName, address } = req.body;
    const user = await Shop.findById(shopId);

    if (!user) {
      return res.status(404).json({ message: "Shop not found" });
    }


    user.name = name || user.name;
    user.ownerName = ownerName || user.ownerName;
    user.address = address || user.address;

    const updatedUser = await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        name: updatedUser.name,
        ownerName: updatedUser.ownerName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server error while updating profile" });
  }
};

// ---------------- UPDATE NOTIFICATIONS ----------------
/* exports.updateShopNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderAlerts, deliveryUpdates, paymentAlerts, emailNotifications } =
      req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Shop not found" });
    }

    user.notifications = {
      orderAlerts: orderAlerts ?? user.notifications?.orderAlerts ?? true,
      deliveryUpdates:
        deliveryUpdates ?? user.notifications?.deliveryUpdates ?? true,
      paymentAlerts:
        paymentAlerts ?? user.notifications?.paymentAlerts ?? true,
      emailNotifications:
        emailNotifications ??
        user.notifications?.emailNotifications ??
        false,
    };

    await user.save();

    res.status(200).json({
      message: "Notification settings updated",
      notifications: user.notifications,
    });
  } catch (error) {
    console.error("Update Notifications Error:", error);
    res.status(500).json({ message: "Server error while updating notifications" });
  }
};
 */

// ---------------- UPDATE PASSWORD ----------------
exports.updateShopPassword = async (req, res) => {
  try {
    const shopId = req.shop.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    const user = await Shop.findById(shopId).select("+password");

    if (!user) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password

    user.password = newPassword;

    await user.save();

    res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update Password Error:", error);
    res.status(500).json({ message: "Server error while updating password" });
  }
};

