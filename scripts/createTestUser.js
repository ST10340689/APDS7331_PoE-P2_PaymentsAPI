const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("../config/db");

const run = async () => {
  try {
    await connectDB();

    const accountNumber = "123456";
    const password = "Password123!";

    const passwordHash = await bcrypt.hash(password, 10);

    const existing = await User.findOne({ accountNumber });
    if (existing) {
      console.log("User already exists:", existing.accountNumber);
      process.exit(0);
    }

    const user = await User.create({
      accountNumber,
      passwordHash,
    });

    console.log("Test user created:");
    console.log("Account Number:", accountNumber);
    console.log("Password:", password);

    process.exit(0);
  } catch (err) {
    console.error("Error creating test user:", err.message);
    process.exit(1);
  }
};

run();
