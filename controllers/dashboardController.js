const User = require("../models/User");
const Transaction = require("../models/Transaction");

/* ============================================================
   LOAD USER FROM SESSION
============================================================ */
const loadUser = async (req) => {
  if (!req.session || !req.session.user) {
    return { error: "Not authenticated.", status: 401 };
  }

  const { accountNumber } = req.session.user;

  const user = await User.findOne({ accountNumber });
  if (!user) return { error: "User not found.", status: 404 };
  if (user.status === "Deactivated")
    return { error: "Account is deactivated.", status: 403 };

  return { user };
};

/* ============================================================
   GET DASHBOARD
============================================================ */
exports.getDashboard = async (req, res) => {
  try {
    const { user, error, status } = await loadUser(req);
    if (!user) return res.status(status).json({ error });

    const transactions = await Transaction.find({
      accountNumber: user.accountNumber,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({
      accountSummary: {
        fullName: user.fullName,
        surname: user.surname,
        email: user.email,
        phone: user.phone,
        accountNumber: user.accountNumber,
        role: user.role,
        balance: user.balance,
        accountCategory: user.accountCategory,
        accountType: user.accountType,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
      recentTransactions: transactions.map((tx) => ({
        id: tx._id,
        date: tx.createdAt.toISOString().split("T")[0],
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        currency: tx.currency,
        recipient: tx.recipient,
        description: tx.description,
        reference: tx.reference,
        status: tx.status,
      })),
    });
  } catch (err) {
    console.error("Dashboard error:", err.message);
    return res.status(500).json({ error: "Failed to load dashboard." });
  }
};

/* ============================================================
   CREATE PAYMENT
============================================================ */
exports.createPayment = async (req, res) => {
  try {
    const { user, error, status } = await loadUser(req);
    if (!user) return res.status(status).json({ error });

    const { recipient, amount, currency, description } = req.body;

    if (!recipient || !amount || !currency)
      return res.status(400).json({ error: "All fields are required." });

    if (recipient === user.accountNumber)
      return res
        .status(400)
        .json({ error: "You cannot send money to yourself." });

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0)
      return res.status(400).json({ error: "Invalid amount." });

    if (user.balance < numericAmount)
      return res.status(400).json({ error: "Insufficient funds." });

    user.balance -= numericAmount;
    await user.save();

    const reference =
      "TX-" + Math.floor(100000000 + Math.random() * 900000000);

    const tx = await Transaction.create({
      accountNumber: user.accountNumber,
      type: "Debit",
      category: "Payment",
      amount: numericAmount,
      currency,
      recipient,
      description: description || `Payment to ${recipient}`,
      reference,
      status: "Completed",
    });

    return res.status(201).json({
      message: "Payment successful.",
      newBalance: user.balance,
      transactionId: tx._id,
      reference,
    });
  } catch (err) {
    console.error("Payment error:", err.message);
    return res.status(500).json({ error: "Payment failed." });
  }
};

/* ============================================================
   DEPOSIT MONEY
============================================================ */
exports.depositMoney = async (req, res) => {
  try {
    const { user, error, status } = await loadUser(req);
    if (!user) return res.status(status).json({ error });

    const numericAmount = Number(req.body.amount);
    if (!numericAmount || numericAmount <= 0)
      return res.status(400).json({ error: "Invalid deposit amount." });

    user.balance += numericAmount;
    await user.save();

    const tx = await Transaction.create({
      accountNumber: user.accountNumber,
      type: "Credit",
      category: "Deposit",
      amount: numericAmount,
      currency: "ZAR",
      recipient: user.fullName,
      description: "Account Deposit",
      reference:
        "DEP-" + Math.floor(100000000 + Math.random() * 900000000),
      status: "Completed",
    });

    return res.json({
      message: "Deposit successful.",
      balance: user.balance,
      transaction: tx,
    });
  } catch (err) {
    console.error("Deposit error:", err.message);
    return res.status(500).json({ error: "Deposit failed." });
  }
};

/* ============================================================
   TRANSACTION HISTORY
============================================================ */
exports.getTransactionHistory = async (req, res) => {
  try {
    const { user, error, status } = await loadUser(req);
    if (!user) return res.status(status).json({ error });

    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const skip = (page - 1) * limit;

    const filter = { accountNumber: user.accountNumber };

    if (req.query.type) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category;

    if (req.query.minAmount || req.query.maxAmount) {
      filter.amount = {};
      if (req.query.minAmount) filter.amount.$gte = Number(req.query.minAmount);
      if (req.query.maxAmount) filter.amount.$lte = Number(req.query.maxAmount);
    }

    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate)
        filter.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate)
        filter.createdAt.$lte = new Date(req.query.endDate);
    }

    if (req.query.search) {
      filter.$or = [
        { recipient: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
        { reference: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    return res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      transactions,
    });
  } catch (err) {
    console.error("Transaction history error:", err.message);
    return res
      .status(500)
      .json({ error: "Failed to load transaction history." });
  }
};
