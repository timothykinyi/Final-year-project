const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ShopSchema = new mongoose.Schema(
  {
    name: {type: String, required: true, trim: true, },
    ownerName: { type: String, required: true, },
    email: { type: String, required: true, unique: true, lowercase: true, },
    phone: { type: String, required: true, unique: true, },
    password: { type: String, required: true, minlength: 6, },
    address: { type: String, },

    verificationCode: { type: String, required: true, },
    isVerified: { type: Boolean, default: false, }, 
    passcode: { type: String, }, // for password reset
    
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    deliveries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Delivery",
      },
    ],
    analytics: {
      totalDeliveries: { type: Number, default: 0 },
      completedDeliveries: { type: Number, default: 0 },
      pendingDeliveries: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 }, // for when payments are tracked
    },
    isVerified: { type: Boolean, default: false, },// later email/phone verification 
  },
  { timestamps: true }
);

// 🔑 Hash password before save
ShopSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔑 Method to compare password
ShopSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add geospatial index for location queries
ShopSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Shop", ShopSchema);
