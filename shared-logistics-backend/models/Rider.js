const mongoose = require("mongoose");

const riderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, },
    phone: { type: String, required: true, unique: true, match: [/^(07|01)\d{8}$/, "Phone number must be a valid Kenyan number"],},
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true, }, // allow some riders without email
    password: { type: String, required: true, minlength: 6, },
    nationalId: { type: String, required: true, unique: true, },
    vehicleType: { type: String, enum: ["boda", "tuktuk", "car", "van", "truck"], default: "boda", },
    baseLocation: { 
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },

    verificationCode: { type: String, required: false, },
    isVerified: { type: Boolean, default: false, }, 
    passcode: { type: String, }, // for password reset
    
    isAvailable: { type: Boolean, default: true, },// rider can toggle this in app
    totalEarnings: { type: Number, default: 0,},
    completedDeliveries: { type: Number, default: 0, },
    status: { type: String, enum: ["active", "inactive", "suspended"], default: "active", },
  },
  { timestamps: true }
);

// Create 2dsphere index for geospatial queries (finding nearby orders)
riderSchema.index({ baseLocation: "2dsphere" });

module.exports = mongoose.model("Rider", riderSchema);
