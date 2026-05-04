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

    // ROLE: admin / staff / customer
    role: {
      type: String,
      enum: ["admin", "staff", "customer"],
      default: "customer",
    },

    // AUTH
    passwordHash: {
      type: String,
      required: true,
    },

    // BANKING
    balance: {
      type: Number,
      default: 0,
    },
    accountCategory: {
      // Student or Adult
      type: String,
      enum: ["Student", "Adult"],
      default: "Adult",
    },
    accountType: {
      // Savings or Cheque
      type: String,
      enum: ["Savings", "Cheque"],
      default: "Cheque",
    },
    status: {
      type: String,
      enum: ["Active", "Deactivated"],
      default: "Active",
    },

    // AUDIT
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
