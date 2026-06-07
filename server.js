// =========================
//  SECURE HTTP BACKEND (PHASE 4 HARDENED)
// =========================

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const sanitizeHtml = require("sanitize-html");
require("dotenv").config();
const connectDB = require("./config/db");

// =========================
//  INITIALIZE APP
// =========================
const app = express();

// Hide framework fingerprint
app.disable("x-powered-by");

// =========================
//  CONNECT DATABASE
// =========================
connectDB();

// =========================
//  CORS (LOCKED TO FRONTEND)
// =========================
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
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

// Helmet (security headers + CSP + clickjacking protection)
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:"],
        "connect-src": ["'self'"],
      },
    },
    frameguard: { action: "deny" }, // Clickjacking protection
    noSniff: true,
    hidePoweredBy: true,
  })
);

// Global rate limiting (protects API from abuse / DDoS-style flooding)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // max requests per IP per window
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Login-specific brute-force protection
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

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
      secure: false, // HTTP ONLY (set true when using HTTPS)
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

// =========================
//  SANITIZATION LAYER
// =========================
app.use((req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === "string") {
        req.body[key] = sanitizeHtml(req.body[key], {
          allowedTags: [],
          allowedAttributes: {},
        });
      }
    }
  }
  next();
});

// =========================
//  ROUTES
// =========================

// Attach brute-force protection specifically to login endpoint
app.use("/api/auth/login", loginLimiter);

// Core routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/account", require("./routes/accountRoutes"));

// =========================
//  ERROR HANDLER (GENERIC)
// =========================
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.message);
  return res
    .status(500)
    .json({ message: "An unexpected error occurred. Please try again later." });
});

// =========================
//  START HTTP SERVER
// =========================
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Secure HTTP Server running on http://localhost:${PORT}`);
});
