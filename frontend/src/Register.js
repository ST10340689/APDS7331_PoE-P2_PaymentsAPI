import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [fullName, setFullName] = useState("");
  const [surname, setSurname] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [email, setEmail] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("customer");

  const [accountCategory, setAccountCategory] = useState("Adult");
  const [accountType, setAccountType] = useState("Cheque");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/check-session", {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();
        if (data.loggedIn) {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Session check failed:", err);
      }
    };

    checkSession();
  }, [navigate]);

  const handleRegister = async () => {
    setError("");
    setLoading(true);

    // Required fields
    if (
      !fullName ||
      !surname ||
      !accountNumber ||
      !email ||
      !idNumber ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    // Account number validation
    const accountRegex = /^[0-9]{6,12}$/;
    if (!accountRegex.test(accountNumber.trim())) {
      setError("Account number must be 6–12 digits.");
      setLoading(false);
      return;
    }

    // ID number validation
    const idRegex = /^[0-9]{13}$/;
    if (!idRegex.test(idNumber.trim())) {
      setError("ID number must be 13 digits.");
      setLoading(false);
      return;
    }

    // Phone number validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.trim())) {
      setError("Phone number must be 10 digits.");
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Invalid email format.");
      setLoading(false);
      return;
    }

    // Password match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    // Strong password validation
    const strongPassword =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!strongPassword.test(password)) {
      setError(
        "Password must be 8+ characters, include uppercase, lowercase, number, and symbol."
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: fullName.trim(),
          surname: surname.trim(),
          accountNumber: accountNumber.trim(),
          email: email.trim(),
          idNumber: idNumber.trim(),
          phone: phone.trim(),
          role,
          accountCategory,
          accountType,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }

      alert("Account created successfully!");
      navigate("/");
    } catch (err) {
      console.error("Registration error:", err);
      setError("Unable to connect to server.");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Create Account</h2>

      <input
        type="text"
        placeholder="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <br />

      <input
        type="text"
        placeholder="Surname"
        value={surname}
        onChange={(e) => setSurname(e.target.value)}
      />
      <br />

      <input
        type="text"
        placeholder="Account Number (6–12 digits)"
        value={accountNumber}
        onChange={(e) => setAccountNumber(e.target.value)}
      />
      <br />

      <input
        type="email"
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />

      <input
        type="text"
        placeholder="13‑Digit ID Number"
        value={idNumber}
        onChange={(e) => setIdNumber(e.target.value)}
      />
      <br />

      <input
        type="text"
        placeholder="Phone Number (10 digits)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <br />

      {/* ROLE */}
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="customer">Customer</option>
        <option value="staff">Staff</option>
        <option value="admin">Admin</option>
      </select>
      <br />

      {/* ACCOUNT CATEGORY */}
      <select
        value={accountCategory}
        onChange={(e) => setAccountCategory(e.target.value)}
      >
        <option value="Adult">Adult</option>
        <option value="Student">Student</option>
      </select>
      <br />

      {/* ACCOUNT TYPE */}
      <select
        value={accountType}
        onChange={(e) => setAccountType(e.target.value)}
      >
        <option value="Cheque">Cheque</option>
        <option value="Savings">Savings</option>
      </select>
      <br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />

      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <br />

      <button onClick={handleRegister} disabled={loading}>
        {loading ? "Creating account..." : "Register"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default Register;
