const User = require("../models/User");

/* ============================================================
   REQUIRE AUTH (SESSION + ACCOUNT STATUS CHECK)
============================================================ */
exports.requireAuth = async (req, res, next) => {
  try {
    // No session → not logged in
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "Not authenticated." });
    }

    const { accountNumber } = req.session.user;

    // Fetch user from DB
    const user = await User.findOne({ accountNumber });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Prevent access if account is deactivated
    if (user.status === "Deactivated") {
      return res.status(403).json({
        error: "Your account is deactivated. Please contact support.",
      });
    }

    // Attach user to request for downstream controllers
    req.user = user;

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(500).json({ error: "Authentication error." });
  }
};

/* ============================================================
   REQUIRE ROLE (ADMIN / STAFF / CUSTOMER)
============================================================ */
exports.requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Not authenticated." });
      }

      const { accountNumber } = req.session.user;

      const user = await User.findOne({ accountNumber });
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      if (user.status === "Deactivated") {
        return res.status(403).json({
          error: "Your account is deactivated. Please contact support.",
        });
      }

      // Check if user role is allowed
      if (!roles.includes(user.role)) {
        return res.status(403).json({
          error: "You do not have permission to access this resource.",
        });
      }

      req.user = user;

      next();
    } catch (err) {
      console.error("Role middleware error:", err.message);
      return res.status(500).json({ error: "Authorization error." });
    }
  };
};
