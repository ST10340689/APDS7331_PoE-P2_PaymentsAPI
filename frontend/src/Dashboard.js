import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [payment, setPayment] = useState({
    recipient: "",
    amount: "",
    currency: "",
    description: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [fullHistory, setFullHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  const navigate = useNavigate();

  // Load dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/account/dashboard", {
          method: "GET",
          credentials: "include",
        });

        if (res.status === 401) {
          navigate("/");
          return;
        }

        const data = await res.json();
        setSummary(data.accountSummary);
        setTransactions(data.recentTransactions || []);
      } catch (err) {
        setError("Failed to load dashboard.");
      }
    };

    fetchDashboard();
  }, [navigate]);

  // Prevent crash while summary is null
  if (!summary) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Secure Payment Portal Dashboard</h1>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Handle payment form input
  const handlePaymentChange = (e) => {
    setPayment({ ...payment, [e.target.name]: e.target.value });
  };

  // Submit payment
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!payment.recipient || !payment.amount || !payment.currency) {
      setError("All payment fields are required.");
      return;
    }

    const amountRegex = /^[0-9]+(\.[0-9]{1,2})?$/;
    if (!amountRegex.test(payment.amount)) {
      setError("Invalid amount format.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/transactions/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payment),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Payment failed.");
        return;
      }

      setMessage(data.message);

      setPayment({
        recipient: "",
        amount: "",
        currency: "",
        description: "",
      });

      setSummary((prev) => ({
        ...prev,
        balance: data.newBalance,
      }));
    } catch (err) {
      setError("Unable to submit payment.");
    }
  };

  // Deposit handler
  const handleDeposit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/transactions/deposit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: depositAmount }),
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
      } else {
        alert("Deposit successful");

        setSummary((prev) => ({
          ...prev,
          balance: data.balance,
        }));

        setDepositAmount("");
      }
    } catch (err) {
      alert("Unable to process deposit.");
    }
  };

  // Logout
  const handleLogout = async () => {
    await fetch("http://localhost:5000/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    navigate("/");
  };

  // Load full transaction history
  const loadFullHistory = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
      });

      if (filterType) params.append("type", filterType);
      if (filterCategory) params.append("category", filterCategory);
      if (filterMinAmount) params.append("minAmount", filterMinAmount);
      if (filterMaxAmount) params.append("maxAmount", filterMaxAmount);
      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);
      if (filterSearch) params.append("search", filterSearch);
      if (sortField) params.append("sortField", sortField);
      if (sortOrder) params.append("sortOrder", sortOrder);

      const res = await fetch(
        `http://localhost:5000/api/transactions/history?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await res.json();
      setFullHistory(data.transactions || []);
      setHistoryPage(data.page);
      setHistoryTotalPages(data.totalPages);
    } catch (err) {
      setError("Failed to load full history.");
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }

    loadFullHistory(1);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Secure Payment Portal Dashboard</h1>

      {/* ACCOUNT SUMMARY */}
      <section style={{ marginBottom: 20 }}>
        <h2>Account Summary</h2>
        <p><strong>Account Number:</strong> {summary.accountNumber}</p>
        <p><strong>Role:</strong> {summary.role}</p>
        <p><strong>Balance:</strong> R {summary.balance}</p>
        <p><strong>Account Type:</strong> {summary.accountType}</p>
        <p><strong>Status:</strong> {summary.status}</p>
        <p><strong>Last Login:</strong> {new Date(summary.lastLogin).toLocaleString()}</p>
      </section>

      {/* RECENT TRANSACTIONS */}
      <section style={{ marginBottom: 20 }}>
        <h2>Recent Transactions</h2>
        {transactions.length === 0 ? (
          <p>No recent transactions.</p>
        ) : (
          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Recipient</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id}>
                  <td>{tx.date}</td>
                  <td>{tx.type}</td>
                  <td>{tx.amount}</td>
                  <td>{tx.currency}</td>
                  <td>{tx.recipient}</td>
                  <td>{tx.description}</td>
                  <td>{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <button onClick={() => loadFullHistory(1)}>
        View Full Transaction History
      </button>

      {fullHistory.length > 0 && (
        <section style={{ marginTop: 20 }}>
          <h2>Full Transaction History</h2>

          {/* FILTERS */}
          <div style={{ marginBottom: 20 }}>
            <h3>Filter Transactions</h3>

            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              <option value="Credit">Credit</option>
              <option value="Debit">Debit</option>
            </select>

            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="Deposit">Deposit</option>
              <option value="Payment">Payment</option>
            </select>

            <input type="number" placeholder="Min Amount" value={filterMinAmount} onChange={(e) => setFilterMinAmount(e.target.value)} />
            <input type="number" placeholder="Max Amount" value={filterMaxAmount} onChange={(e) => setFilterMaxAmount(e.target.value)} />

            <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
            <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />

            <input type="text" placeholder="Search (recipient, reference, description)" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />

            <button onClick={() => loadFullHistory(1)}>Apply Filters</button>
            <button onClick={() => {
              setFilterType("");
              setFilterCategory("");
              setFilterMinAmount("");
              setFilterMaxAmount("");
              setFilterStartDate("");
              setFilterEndDate("");
              setFilterSearch("");
              loadFullHistory(1);
            }}>
              Clear Filters
            </button>
          </div>

          {/* HISTORY TABLE */}
          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th onClick={() => handleSort("date")} style={{ cursor: "pointer" }}>
                  Date {sortField === "date" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th onClick={() => handleSort("type")} style={{ cursor: "pointer" }}>
                  Type {sortField === "type" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th onClick={() => handleSort("amount")} style={{ cursor: "pointer" }}>
                  Amount {sortField === "amount" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th>Currency</th>
                <th>Recipient</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {fullHistory.map((tx) => (
                <tr key={tx._id} style={{ backgroundColor: tx.type === "Credit" ? "#e8ffe8" : "#ffe8e8" }}>
                  <td>{tx.date}</td>
                  <td>{tx.type}</td>
                  <td>{tx.amount}</td>
                  <td>{tx.currency}</td>
                  <td>{tx.recipient}</td>
                  <td>{tx.description}</td>
                  <td>{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div style={{ marginTop: 10 }}>
            <button disabled={historyPage === 1} onClick={() => loadFullHistory(historyPage - 1)}>
              Previous
            </button>

            <span style={{ margin: "0 10px" }}>
              Page {historyPage} of {historyTotalPages}
            </span>

            <button disabled={historyPage === historyTotalPages} onClick={() => loadFullHistory(historyPage + 1)}>
              Next
            </button>
          </div>
        </section>
      )}

      {/* PAYMENT FORM */}
      <section style={{ marginBottom: 20 }}>
        <h2>Initiate Payment</h2>
        <form onSubmit={handlePaymentSubmit}>
          <input name="recipient" placeholder="Recipient" value={payment.recipient} onChange={handlePaymentChange} />
          <br />
          <input name="amount" placeholder="Amount" value={payment.amount} onChange={handlePaymentChange} />
          <br />
          <input name="currency" placeholder="Currency (e.g., ZAR)" value={payment.currency} onChange={handlePaymentChange} />
          <br />
          <input name="description" placeholder="Description (optional)" value={payment.description} onChange={handlePaymentChange} />
          <br />
          <button type="submit">Send Payment</button>
        </form>
      </section>

      {/* DEPOSIT FORM */}
      <section style={{ marginBottom: 20 }}>
        <h2>Deposit Money</h2>
        <form onSubmit={handleDeposit}>
          <input type="number" placeholder="Amount" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
          <br />
          <button type="submit">Deposit</button>
        </form>
      </section>

      {/* FEEDBACK */}
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* LOGOUT */}
      <button onClick={handleLogout} style={{ marginTop: 20 }}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;
