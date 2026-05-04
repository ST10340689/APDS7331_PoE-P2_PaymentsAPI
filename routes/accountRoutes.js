const express = require("express");
const router = express.Router();

const { getDashboard } = require("../controllers/dashboardController");
const { requireAuth } = require("../middleware/auth");

// Dashboard summary (Protected)
router.get("/dashboard", requireAuth, getDashboard);

module.exports = router;
