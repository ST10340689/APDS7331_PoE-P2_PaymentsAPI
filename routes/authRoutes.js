const express = require("express");
const router = express.Router();
const ExpressBrute = require("express-brute");

const {
  registerUser,
  loginUser,
  logoutUser
} = require("../controllers/authController");

// Brute force protection
const store = new ExpressBrute.MemoryStore();
const bruteforce = new ExpressBrute(store);

/* ============================================================
   REGISTER
============================================================ */
router.post("/register", registerUser);

/* ============================================================
   LOGIN (with brute-force protection)
============================================================ */
router.post("/login", bruteforce.prevent, loginUser);

/* ============================================================
   CHECK SESSION
============================================================ */
router.get("/check-session", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ loggedIn: false });
  }

  return res.json({
    loggedIn: true,
    user: req.session.user
  });
});

/* ============================================================
   LOGOUT
============================================================ */
router.post("/logout", logoutUser);

module.exports = router;
