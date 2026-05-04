const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Secure headers
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests, try again later."
});
app.use(limiter);

// Other middleware
app.use(cors());
app.use(express.json());

connectDB();

app.use("/api", authRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("API running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`HTTP server running on port ${PORT}`));