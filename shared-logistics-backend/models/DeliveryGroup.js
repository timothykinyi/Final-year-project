// models/DeliveryGroup.js
const mongoose = require("mongoose");

const DeliveryGroupSchema = new mongoose.Schema(
  {
    deliveries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Delivery",
      },
    ],
    vehicleType: {
      type: String,
      enum: ["boda", "tuktuk", "car", "van", "truck"],
      required: true,
    },
    status: { 
      type: String, 
      enum: [ "pending", "assigned"], 
      default: "pending" 
    },
    totalWeight: { type: Number, required: true }, // sum of delivery weights
    totalCost: { type: Number, required: true }, // computed cost for the group
    pickupLocation: {
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
    deliveryLocation: {
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
  },
  { timestamps: true }
);

DeliveryGroupSchema.index({ pickupLocation: "2dsphere" });
DeliveryGroupSchema.index({ deliveryLocation: "2dsphere" });

module.exports = mongoose.model("DeliveryGroup", DeliveryGroupSchema);
