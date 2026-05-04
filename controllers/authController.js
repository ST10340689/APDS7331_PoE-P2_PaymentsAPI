const bcrypt = require("bcryptjs");
const User = require("../models/user");

/* ============================================================
   LOGIN (SESSION-BASED)
============================================================ */
const loginUser = async (req, res) => {
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
      return res
        .status(401)
        .json({ error: "Invalid account number or password." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ error: "Invalid account number or password." });
    }

    user.lastLogin = new Date();
    await user.save();

    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({ error: "Session error" });
      }

      req.session.user = {
        id: user._id,
        accountNumber: user.accountNumber,
        role: user.role,
      };

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Session error" });
        }

        return res.status(200).json({
          message: "Login successful!",
          role: user.role,
        });
      });
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
};

/* ============================================================
   LOGOUT
============================================================ */
const logoutUser = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    return res.json({ message: "Logged out successfully" });
  });
};

/* ============================================================
   CHECK SESSION
============================================================ */
const checkSession = (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ loggedIn: false });
  }

  return res.json({
    loggedIn: true,
    user: req.session.user,
  });
};

/* ============================================================
   REGISTER (BANKING-GRADE, ALIGNED WITH FRONTEND)
============================================================ */
const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      surname,
      accountNumber,
      email,
      idNumber,
      phone,
      role,
      accountCategory,
      accountType,
      password,
    } = req.body;

    // Required fields
    if (
      !fullName ||
      !surname ||
      !accountNumber ||
      !email ||
      !idNumber ||
      !phone ||
      !password
    ) {
      return res.status(400).json({ error: "All required fields are required." });
    }

    // Account number validation
    const accountRegex = /^[0-9]{6,12}$/;
    if (!accountRegex.test(accountNumber)) {
      return res
        .status(400)
        .json({ error: "Account number must be 6–12 digits." });
    }

    // ID number validation
    const idRegex = /^[0-9]{13}$/;
    if (!idRegex.test(idNumber)) {
      return res.status(400).json({ error: "ID number must be 13 digits." });
    }

    // Phone number validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: "Phone number must be 10 digits." });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    // Strong password validation
    const strongPassword =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!strongPassword.test(password)) {
      return res.status(400).json({
        error:
          "Password must be 8+ characters, include uppercase, lowercase, number, and symbol.",
      });
    }

    // Uniqueness checks
    const existingAcc = await User.findOne({
      accountNumber: accountNumber.trim(),
    });
    if (existingAcc) {
      return res.status(400).json({ error: "Account number already exists." });
    }

    const existingEmail = await User.findOne({
      email: email.trim().toLowerCase(),
    });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already registered." });
    }

    const existingID = await User.findOne({ idNumber: idNumber.trim() });
    if (existingID) {
      return res.status(400).json({ error: "ID number already registered." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Role resolution
    const resolvedRole = ["admin", "staff", "customer"].includes(role)
      ? role
      : "customer";

    // Create user
    await User.create({
      fullName: fullName.trim(),
      surname: surname.trim(),
      accountNumber: accountNumber.trim(),
      email: email.trim().toLowerCase(),
      idNumber: idNumber.trim(),
      phone: phone.trim(),
      role: resolvedRole,
      accountCategory: accountCategory || "Adult",
      accountType: accountType || "Cheque",
      status: "Active",
      balance: 25000,
      passwordHash,
      lastLogin: null,
    });

    return res.status(201).json({
      message: "Account created successfully. You may now log in.",
    });
  } catch (err) {
    console.error("Registration error:", err.message);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
};

/* ============================================================
   EXPORTS
============================================================ */
module.exports = {
  loginUser,
  logoutUser,
  registerUser,
  checkSession,
};
