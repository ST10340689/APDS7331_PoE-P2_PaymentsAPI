const express = require("express");
const router = express.Router();

const { loginUser, registerUser, withdrawMoney, depositMoney } = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/withdraw", withdrawMoney);
router.post("/deposit", depositMoney);

module.exports = router;