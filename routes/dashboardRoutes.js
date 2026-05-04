// payments-api/routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middleware/auth");
const {
  getDashboard,
  createPayment,
  depositMoney,
  getTransactionHistory,   // ⬅ add this
} = require("../controllers/dashboardController");

/* ============================================================
   DASHBOARD ROUTES (PROTECTED)
============================================================ */

// GET ACCOUNT DASHBOARD (Summary + Transactions)
router.get("/dashboard", requireAuth, getDashboard);

// CREATE PAYMENT (Debit Transaction)
router.post("/payments", requireAuth, createPayment);

// DEPOSIT MONEY (Credit Transaction)
router.post("/deposit", requireAuth, depositMoney);

// ⬅ NEW: full transaction history
router.get("/transactions", requireAuth, getTransactionHistory);

module.exports = router;
