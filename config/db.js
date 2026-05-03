const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://Admin:Admin123!@darshan.slre7n1.mongodb.net/DarshanPayments?retryWrites=true&w=majority&appName=Darshan"
    );

    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
