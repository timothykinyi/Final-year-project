const mongoose = require("mongoose");

const DeliverySchema = new mongoose.Schema(
  {
    shop: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Shop", 
      required: true 
    },

    rider: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Rider", 
      default: null 
    }, // rider assigned later

    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String, required: true },
    CheckoutRequestID: { type: String },
    customerLocation: { 
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

    // 🚀 new field for tracking rider’s live location
    currentLocation: { 
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [0, 0], // initially no location
      },
      updatedAt: { 
        type: Date,
        default: Date.now 
      }
    },

    status: { 
      type: String, 
      enum: ["un_grouped", "pending", "assigned", "in_transit", "delivered", "cancelled"], 
      default: "un_grouped" 
    },

    paymentStatus: { 
      type: String, 
      enum: ["unpaid", "paid"], 
      default: "unpaid" 
    },

    deliveryFee: { type: Number, default: 0 },
    deliveryweight: { type: Number, default: 0 },
    CheckoutRequestID: { type: String},
  },
  { timestamps: true }
);

DeliverySchema.index({ customerLocation: "2dsphere" });
DeliverySchema.index({ currentLocation: "2dsphere" }); // ✅ spatial index for live tracking

module.exports = mongoose.model("Delivery", DeliverySchema);
