const bcrypt = require("bcryptjs");
const User = require("../models/user");

exports.loginUser = async (req, res) => {
  try {
    const { accountNumber, password } = req.body;

    if (!accountNumber || !password) {
      return res.status(400).json({ error: "Both fields are required." });
    }

    const accountRegex = /^[0-9]{6,12}$/;
    if (!accountRegex.test(accountNumber)) {
      return res.status(400).json({ error: "Invalid account number format." });
    }

    const user = await User.findOne({ accountNumber: accountNumber.trim() });

    if (!user) {
      // Don't reveal whether account exists
      return res.status(401).json({ error: "Invalid account number or password." });
    }

    // Check if account is currently locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const secondsLeft = Math.ceil((user.lockUntil - Date.now()) / 1000);
      return res.status(429).json({ error: `Account locked. Try again in ${secondsLeft} seconds.` });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (isMatch) {
      // Reset failed attempts on successful login
      if (user.failedLoginAttempts && user.failedLoginAttempts > 0) {
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
      }

      if (user.balance == null) {
        user.balance = 0;
      }
      if (!user.currency) {
        user.currency = accountNumber.trim().slice(-1) % 2 === 0 ? "USD" : "ZAR";
      }

      await user.save();

      return res.status(200).json({
        message: "Login successful!",
        accountNumber: user.accountNumber,
        balance: user.balance,
        currency: user.currency,
      });
    }

    // Wrong password: increment failed attempts and possibly lock
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    const MAX_ATTEMPTS = 5;
    const LOCK_DURATION_MS = 2 * 60 * 1000; // 2 minutes

    if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
      user.lockUntil = Date.now() + LOCK_DURATION_MS;
      await user.save();
      return res.status(429).json({ error: `Too many failed attempts. Account locked for ${Math.ceil(LOCK_DURATION_MS/1000)} seconds.` });
    }

    await user.save();
    return res.status(401).json({ error: "Invalid account number or password." });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
};

exports.registerUser = async (req, res) => {
  try {
    console.log("Register request body:", req.body);
    const { accountNumber, password } = req.body;

    if (!accountNumber || !password) {
      return res.status(400).json({ error: "Both fields are required." });
    }

    const accountRegex = /^[0-9]{6,12}$/;
    if (!accountRegex.test(accountNumber)) {
      return res.status(400).json({ error: "Invalid account number format." });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters." });
    }

    const existing = await User.findOne({ accountNumber: accountNumber.trim() });
    if (existing) {
      return res.status(409).json({ error: "Account number already registered." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const currency = parseInt(accountNumber.trim().slice(-1), 10) % 2 === 0 ? "USD" : "ZAR";
    const balance = Math.floor(Math.random() * 9000) + 1000;

    const newUser = new User({
      accountNumber: accountNumber.trim(),
      passwordHash,
      balance,
      currency,
    });
    await newUser.save();

    return res.status(201).json({ message: "Registration successful.", balance, currency });
  } catch (err) {
    console.error("Register error:", err.message);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
};

exports.withdrawMoney = async (req, res) => {
  try {
    const { accountNumber, amount } = req.body;

    if (!accountNumber || amount == null) {
      return res.status(400).json({ error: "Account number and amount are required." });
    }

    const withdrawAmount = Number(amount);
    if (Number.isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ error: "Enter a valid withdrawal amount." });
    }

    const user = await User.findOne({ accountNumber: accountNumber.trim() });
    if (!user) {
      return res.status(404).json({ error: "Account not found." });
    }

    const balance = user.balance ?? 0;
    if (withdrawAmount > balance) {
      return res.status(400).json({ error: "Insufficient balance." });
    }

    user.balance = balance - withdrawAmount;
    await user.save();

    return res.status(200).json({
      message: "Withdrawal successful.",
      balance: user.balance,
      currency: user.currency || "USD",
    });
  } catch (err) {
    console.error("Withdraw error:", err.message);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
};

exports.depositMoney = async (req, res) => {
  try {
    const { accountNumber, amount } = req.body;

    if (!accountNumber || amount == null) {
      return res.status(400).json({ error: "Account number and amount are required." });
    }

    const depositAmount = Number(amount);
    if (Number.isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ error: "Enter a valid deposit amount." });
    }

    const user = await User.findOne({ accountNumber: accountNumber.trim() });
    if (!user) {
      return res.status(404).json({ error: "Account not found." });
    }

    user.balance = (user.balance ?? 0) + depositAmount;
    await user.save();

    return res.status(200).json({
      message: "Deposit successful.",
      balance: user.balance,
      currency: user.currency || "USD",
    });
  } catch (err) {
    console.error("Deposit error:", err.message);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
};
