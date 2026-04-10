const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Rider = require("../models/Rider");
const Delivery = require("../models/Delivery"); // we'll need this for later functions
const DeliveryGroup = require("../models/DeliveryGroup");
const { stkPushHandlerinternal } = require("../controllers/mpesaController"); //get stk
const sendEmail = require('../services/emailServiceold');
const {generateToken, generateAlphanumericVerificationCode} = require("../utils/generateToken");
const mongoose = require("mongoose");
const validator = require("validator");
const { checkPinById } = require('../services/KRA');

function formatPhoneNumber(phone) {
  if (!phone) return null;

  // Trim spaces just in case
  phone = phone.toString().trim();

  // If number starts with 0, replace with 254
  if (phone.startsWith("0")) {
    return "254" + phone.slice(1);
  }

  // If number already starts with 254, leave it as is
  if (phone.startsWith("254")) {
    return phone;
  }

  // If number starts with +254, strip the + 
  if (phone.startsWith("+254")) {
    return phone.slice(1);
  }

  // If it's in some unexpected format, return null (invalid)
  return null;
}

// =============================
// @desc    Register rider
// @route   POST /api/riders/register
// @access  Public
// =============================
exports.registerRider = async (req, res) => {
  try {
    const { name, phone, email, password, nationalId, vehicleType, baseLocation } = req.body;

    // Email validation
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }
    
    // Phone validation (Kenya format)
    const phoneRegex = /^(?:254|\+254|0)?(7|1)\d{8}$/;
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

// --- FIXED KRA PIN CHECK ---
    try {
        const output = await checkPinById('41789723'); // Wait for the result
        const data = output.Data || output; 
        const { ResponseCode, TaxpayerPIN, TaxpayerName } = data;

        if (ResponseCode !== "30000") {
          console.error(`KRA PIN check failed: ${data.ResponseMessage || 'Unknown error'}`);
          return res.status(400).json({
            success: false,
            message: "National ID verification failed. Please ensure your ID is correct.",
          });
        }
        console.log(`✔ KRA Verified: ${TaxpayerName} (PIN: ${TaxpayerPIN})`);
    } catch (err) {
        console.error("KRA Verification Error:", err.message);
        return res.status(400).json({
          success: false,
          message: "Could not verify ID with KRA. Please try again later.",
        });
    }

    // Check if rider already exists
    const existing = await Rider.findOne({ $or: [{ phone }, { nationalId }, { email }] });
    if (existing) return res.status(409).json({ message: "Phone or National ID or Email already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const alphanumericCode = generateAlphanumericVerificationCode(6);
    const subject = `Verification - ${alphanumericCode}`;
    const vermessage = `Dear ${name},

    Thank you for registering with Twende! Please use the following verification code to complete your registration:
    
    Verification Code: ${alphanumericCode}
    
    Best regards,
    Twende Support Team`;

    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.8; max-width: 600px; margin: auto; border: 1px solid #e1e1e1; padding: 25px; border-radius: 10px; background-color: #ffffff;">
        <h2 style="color: #1d4ed8; text-align: center; font-size: 26px; margin-bottom: 10px;">
          Welcome to Twende, ${name}!
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

    // Create new rider
    const rider = await Rider.create({
      name,
      phone,
      email,
      verificationCode: alphanumericCode,
      password: hashedPassword,
      nationalId,
      vehicleType,
      baseLocation,
    });

    res.status(201).json({
      message: "Rider registered successfully",
      rider: {
        id: rider._id,
        name: rider.name,
        phone: rider.phone,
        email: rider.email,
        vehicleType: rider.vehicleType,
      },
      token: generateToken(rider._id),
    });
  } catch (error) {
    
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
// @desc    Login rider
// @route   POST /api/riders/login
// @access  Public
// =============================
exports.loginRider = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const rider = await Rider.findOne({ phone });
    if (!rider) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, rider.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.json({
      message: "Login successful",
      rider: {
        id: rider._id,
        name: rider.name,
        phone: rider.phone,
        email: rider.email,
        vehicleType: rider.vehicleType,
        isAvailable: rider.isAvailable,
      },
      token: generateToken(rider._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
// @desc    Get available deliveries (nearby or on route)
// @route   GET /api/riders/available-deliveries
// @access  Private
// =============================
exports.getAvailableDeliveries = async (req, res) => {
  try {
    const rider = await Rider.findById(req.user.id);
    if (!rider) {
      console.log(":::Rider not found::::")
      return res.status(404).json({ message: "Rider not found" });
    }

    if (!rider.baseLocation || !rider.baseLocation.coordinates) {
      console.log(":::gracefully return none::::")
      return res.status(200).json({ available: [] }); // ✅ gracefully return none

    }

    // Find groups near rider's base location
    const groups = await DeliveryGroup.find({
      status: "pending",
      vehicleType: rider.vehicleType, 
      pickupLocation: {
        $near: {
          $geometry: rider.baseLocation,
          $maxDistance: 10000, // 10 km
        },
      },
    }).populate({
      path: "deliveries",
      populate: { path: "shop rider" }, // populate details for each delivery
    });

    console.log(":::gracefully  none::::")
    console.log(groups)
    console.log(":::gracefully  none::::")
    res.json({ available: groups || [] }); // ✅ fallback to empty array
  } catch (error) {
    console.error("❌ Error fetching available delivery groups:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};



// =============================
// @desc    Get my deliveries
// @route   GET /api/riders/my-deliveries
// @access  Private
// =============================
exports.getMyDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find({ rider: req.user.id });
    res.json({ deliveries });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
// @desc    Rider analytics
// @route   GET /api/riders/analytics
// @access  Private
// =============================
exports.getRiderAnalytics = async (req, res) => {
  try {
    const riderId = req.user.id;
    const rider = await Rider.findById(riderId);
    if (!rider) return res.status(404).json({ message: "Rider not found" });
    // Optional date filters
    const { startDate, endDate } = req.query;
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter = {
        createdAt: {
          ...(startDate ? { $gte: new Date(startDate) } : {}),
          ...(endDate ? { $lte: new Date(endDate) } : {}),
        },
      };
    }

    // Apply filter for all queries
    const baseFilter = { rider: riderId, ...dateFilter };

    const totalDeliveries = await Delivery.countDocuments(baseFilter);
    const completedDeliveries = await Delivery.countDocuments({
      ...baseFilter,
      status: "delivered",
    });
    const pendingDeliveries = await Delivery.countDocuments({
      ...baseFilter,
      status: { $in: ["assigned", "in_transit"] },
    });

    const earningsAgg = await Delivery.aggregate([
      { $match: { rider: new mongoose.Types.ObjectId(riderId), status: "delivered", paymentStatus: "paid", ...dateFilter } },
      { $group: { _id: null, total: { $sum: "$deliveryFee" } } }
    ]);
    const totalEarnings = rider.totalEarnings || 0; // fallback to stored earnings if aggregation fails

    res.json({
      overview: {
        totalDeliveries,
        completedDeliveries,
        pendingDeliveries,
        totalEarnings,
      },
      filters: { startDate, endDate },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.acceptDelivery = async (req, res) => {
  try {
    const riderId = req.user.id;
    const { id } = req.params;


    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid groupId" });
    }


    const rider = await Rider.findById(riderId);
    if (!rider) return res.status(404).json({ message: "Rider not found" });

    // 1️⃣ Check if rider already has pending deliveries
    const pendingDeliveries = await Delivery.find({
      rider: riderId,
      status: { $in: ["assigned", "in_transit"] },
    });
    if (pendingDeliveries.length > 0) {
      return res.status(400).json({
        message: "Finish your pending deliveries before accepting a new group.",
        pendingDeliveriesCount: pendingDeliveries.length,
      });
    }

    // 2️⃣ Fetch delivery group **without populate**
    const group = await DeliveryGroup.findById(id);
    if (!group) return res.status(404).json({ message: "Delivery group not found" });



    // 3️⃣ Fetch deliveries separately
    const deliveries = await Delivery.find({ _id: { $in: group.deliveries } })
      .populate("shop")
      .populate("rider");

    if (!deliveries.length) {
      return res.status(400).json({ message: "No deliveries found in this group." });
    }

    // 4️⃣ Filter only pending deliveries
    const assignableDeliveries = deliveries.filter(d => d.status === "pending");
    if (!assignableDeliveries.length) {
      return res.status(400).json({ message: "No pending deliveries to assign in this group." });
    }

    // 5️⃣ Assign deliveries to rider
    const assignedDeliveries = [];
    for (const delivery of assignableDeliveries) {
      delivery.rider = riderId;
      delivery.status = "assigned";
      await delivery.save();
      assignedDeliveries.push(delivery);
    }

    group.status = 'assigned';
    await group.save();
    res.json({
      message: `Group accepted! ${assignedDeliveries.length} deliveries assigned.`,
      deliveries: assignedDeliveries,
    });
  } catch (err) {
    console.error("❌ Error accepting delivery group:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.Deliveryintransit = async (req, res) => {
  try {
    const riderId = req.user.id;
    const deliveryId = req.params.id;

    const rider = await Rider.findById(riderId);
    if (!rider) return res.status(404).json({ message: "Rider not found" });

    let delivery = await Delivery.findById(deliveryId);
    if (!delivery) return res.status(404).json({ message: "Delivery not found" });

    if (delivery.status !== "assigned") {
      return res.status(400).json({ message: "Delivery is not in 'assigned' state" });
    }

    if (delivery.rider.toString() !== riderId) {
      return res.status(400).json({ message: "Delivery is not assigned to this rider" });
    }

    delivery.status = "in_transit";
    await delivery.save();

    res.json({ message: "Delivery marked as in transit", delivery });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.Deliveryarrival = async (req, res) => {
  try {
    const riderId = req.user.id;
    const deliveryId = req.params.id;

    const rider = await Rider.findById(riderId);
    if (!rider) return res.status(404).json({ message: "Rider not found" });

    let delivery = await Delivery.findById(deliveryId);
    if (!delivery) return res.status(404).json({ message: "Delivery not found" });

    if (delivery.status !== "in_transit") {
      return res.status(400).json({ message: "Delivery is not in 'in_transit' state" });
    }

    if (delivery.rider.toString() !== riderId) {
      return res.status(400).json({ message: "Delivery is not assigned to this rider" });
    }

    // Example usage in your function
    const formattedPhone = formatPhoneNumber(delivery.customerPhone);

    if (!formattedPhone) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    if (delivery.paymentStatus === "unpaid") {
      const result = await stkPushHandlerinternal(
        delivery.deliveryFee,
        formattedPhone,
        deliveryId
      );

      if (!result.success) {
        console.error("❌ M-Pesa STK Push failed:", result.error);

        return res.status(500).json({
          message: "Failed to initiate payment",
          error: result.error,
        });
      }

      console.log("✅ STK Push initiated:", result.data);
    }

    rider.totalEarnings += delivery.deliveryFee * 0.8;
    await rider.save();

    delivery.status = "delivered";
    await delivery.save();

    res.json({ message: "Delivery marked as delivered", delivery });
  } catch (error) {
    console.error("❌ Error marking delivery as delivered:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update rider’s live location
exports.updateRiderLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const { deliveryId } = req.params;

    // validate numbers (0 should be allowed, so check against null/undefined)
    if (latitude == null || longitude == null) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const delivery = await Delivery.findByIdAndUpdate(
      deliveryId,
      {
        currentLocation: {
          type: "Point",
          coordinates: [longitude, latitude], // GeoJSON expects [lng, lat]
        },
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    // Prepare payload
    const payload = {
      deliveryId: delivery._id.toString(),
      status: delivery.status,
      location: delivery.currentLocation,       // rider live location
      customerLocation: delivery.customerLocation, // customer destination
    };

    // Emit live update to all clients in this delivery room
    const io = req.app.get("io");
    io.to(`delivery_${deliveryId}`).emit("deliveryLocationUpdate", payload);

    console.log(`✅ Location updated for delivery ${deliveryId}: [${latitude}, ${longitude}]`);

    res.json({
      message: "Location updated successfully",
      delivery,
    });
  } catch (err) {
    console.error("❌ Error updating location:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Get latest location of a delivery
exports.trackDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    const currentLocation = delivery.currentLocation || null;

    res.json({
      deliveryId: delivery._id,
      status: delivery.status,
      location: currentLocation,              // rider’s live location
      customerLocation: delivery.customerLocation, // destination
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.forgotPassword = async (req, res) => { 
  console.log("Received forgot password request:", req.body);
  try {
    const { phone } = req.body;
    const rider = await Rider.findOne({ phone });

    if (!rider) {
      return res.status(404).json({ success: false, message: "No rider found with that phone number" });
    }

    // Generate a random passcode max 8 chars
    const passcode = Math.random().toString(36).slice(-8);

    // Save the passcode to the rider document
    rider.passcode = passcode;
    await rider.save();
    
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
      await sendEmail(rider.email, subject, vermessage, htmlMessage);
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
    const { phone, code, newPassword } = req.body;
    const rider = await Rider.findOne({ phone });

    if (!rider) {
      return res.status(404).json({ success: false, message: "No rider found with that phone number" });
    }

    if (rider.passcode !== code) {
      return res.status(400).json({ success: false, message: "Invalid reset code" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    rider.password = hashedPassword;
    rider.passcode = undefined; // Clear the passcode after use
    await rider.save();

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
      await sendEmail(rider.email, subject, vermessage, htmlMessage);
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

// ---------------- UPDATE RIDER PROFILE ----------------
exports.updateRiderProfile = async (req, res) => {
  try {

    const riderId = req.user.id;


    const { name, email, phone, vehicleType } = req.body;
    const user = await Rider.findById(riderId);

    if (!user) {
      return res.status(404).json({ message: "Rider not found" });
    }


    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.vehicleType = vehicleType || user.vehicleType;

    const updatedUser = await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        vehicleType: user.vehicleType,
        isAvailable: user.isAvailable,
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
exports.updateRiderPassword = async (req, res) => {
  try {
    const riderId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    const user = await Rider.findById(riderId).select("+password");

    if (!user) {
      return res.status(404).json({ message: "Rider not found" });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }


    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update Password Error:", error);
    res.status(500).json({ message: "Server error while updating password" });
  }
};

