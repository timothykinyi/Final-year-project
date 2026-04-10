const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rider",
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },

    type: {
      type: String,
      enum: ["withdrawal"],
      default: "withdrawal",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);