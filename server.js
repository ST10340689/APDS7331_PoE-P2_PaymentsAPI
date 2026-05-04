// =========================
//  SIMPLE HTTP BACKEND
// =========================

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const ExpressBrute = require("express-brute");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const hpp = require("hpp");
const sanitizeHtml = require("sanitize-html");
require("dotenv").config();
const connectDB = require("./config/db");

// =========================
//  INITIALIZE APP
// =========================
const app = express();

// =========================
//  CONNECT DATABASE
// =========================
connectDB();

// =========================
//  CORS
// =========================
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// =========================
//  BODY PARSER
// =========================
app.use(express.json());

// =========================
//  SECURITY MIDDLEWARE
// =========================

// Helmet (security headers)
app.use(
  helmet({
    contentSecurityPolicy: false, // React compatibility
  })
);

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Rate limiting (global)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: "Too many requests, please try again later.",
  })
);

// Brute force protection (login)
const store = new ExpressBrute.MemoryStore();
const bruteforce = new ExpressBrute(store);

// =========================
//  SESSION + COOKIES
// =========================
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // HTTP ONLY
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60,
    },
  })
);

// =========================
//  SANITIZATION MIDDLEWARE
// =========================
app.use((req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === "string") {
        req.body[key] = sanitizeHtml(req.body[key]);
      }
    }
  }
  next();
});

// =========================
//  ROUTES
// =========================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/account", require("./routes/accountRoutes"));

// =========================
//  START HTTP SERVER
// =========================
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 HTTP Server running on http://localhost:${PORT}`);
});
