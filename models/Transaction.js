// payments-api/models/Transaction.js
const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    accountNumber: {
      type: String,
      required: true,
    },

    // Debit (money out) or Credit (money in)
    type: {
      type: String,
      enum: ["Debit", "Credit"],
      required: true,
    },

    // Payment, Transfer, Deposit, Withdrawal, etc.
    category: {
      type: String,
      enum: ["Payment", "Transfer", "Deposit", "Withdrawal"],
      default: "Payment",
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "ZAR",
    },

    recipient: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    // Unique reference number (TX-XXXXXXXXX)
    reference: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Reversed"],
      default: "Completed",
    },
  },
  { timestamps: true } // adds createdAt + updatedAt
);

module.exports = mongoose.model("Transaction", TransactionSchema);
