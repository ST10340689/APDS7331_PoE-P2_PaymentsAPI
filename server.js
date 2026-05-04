// =========================
//  SECURE HTTPS BACKEND
// =========================

const fs = require("fs");
const https = require("https");
const http = require("http");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const ExpressBrute = require("express-brute");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const hpp = require("hpp");
const sanitizeHtml = require("sanitize-html");
const path = require("path");
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
//  CORS — MUST COME FIRST
// =========================
app.use(
  cors({
    origin: "https://localhost:3000",
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

// Cookie + Session security
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // HTTPS ONLY
      httpOnly: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60, // 1 hour
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
//  HTTPS SERVER
// =========================
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, "localhost-key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "localhost.pem")),
};

https.createServer(sslOptions, app).listen(5000, () => {
  console.log("🔐 HTTPS Server running on https://localhost:5000");
});

// =========================
//  HTTP → HTTPS REDIRECT
// =========================
http
  .createServer((req, res) => {
    res.writeHead(301, { Location: "https://localhost:5000" + req.url });
    res.end();
  })
  .listen(5001, () => {
    console.log("➡ Redirecting HTTP (5001) → HTTPS (5000)");
  });
