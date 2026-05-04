const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middleware/auth");

const {
  createPayment,
  depositMoney,
  getTransactionHistory
} = require("../controllers/dashboardController");

// CREATE PAYMENT
router.post("/pay", requireAuth, createPayment);

// DEPOSIT MONEY
router.post("/deposit", requireAuth, depositMoney);

// FULL TRANSACTION HISTORY
router.get("/history", requireAuth, getTransactionHistory);

module.exports = router;
