const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AdminSchema = new mongoose.Schema(
  {
    name: {type: String, required: true, trim: true, },
    email: { type: String, required: true, unique: true, lowercase: true, },
    phone: { type: String, required: true, unique: true, },
    password: { type: String, required: true, minlength: 6, },
    active: { type: Boolean, default: true, },
    verificationCode: { type: String, required: false, },
    isVerified: { type: Boolean, default: false, }, 
    passcode: { type: String, }, // for password reset
    role: { type: String, default: "admin" }, // for role-based access control
    },
  { timestamps: true }
);

// 🔑 Hash password before save
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔑 Method to compare password
AdminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add geospatial index for location queries
AdminSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("admin", AdminSchema);
