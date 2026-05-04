const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    surname: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    idNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["admin", "staff", "customer"],
      default: "customer",
    },

    passwordHash: {
      type: String,
      required: true,
    },

    balance: {
      type: Number,
      default: 0,
    },
    accountCategory: {
      type: String,
      enum: ["Student", "Adult"],
      default: "Adult",
    },
    accountType: {
      type: String,
      enum: ["Savings", "Cheque"],
      default: "Cheque",
    },
    status: {
      type: String,
      enum: ["Active", "Deactivated"],
      default: "Active",
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// FIX: Prevent OverwriteModelError
module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
