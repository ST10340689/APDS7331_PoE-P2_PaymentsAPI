import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Login({ setAuthenticated }) {
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/check-session", {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();
        if (data.loggedIn) {
          setAuthenticated(true);
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Session check failed:", err);
      }
    };

    checkSession();
  }, [navigate, setAuthenticated]);

  // Countdown timer for lockout
  useEffect(() => {
    let interval;
    if (remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setError(""); // Clear error when timer expires
            return 0;
          }
          // Update error message with current remaining time
          setError(`Too many failed attempts. Please wait ${newTime} seconds before trying again.`);
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [remainingTime]);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    // Prevent login attempts during lockout
    if (remainingTime > 0) {
      setError(`Too many failed attempts. Please wait ${remainingTime} seconds before trying again.`);
      setLoading(false);
      return;
    }

    if (!accountNumber || !password) {
      setError("Both fields are required.");
      setLoading(false);
      return;
    }

    const accountRegex = /^[0-9]{6,12}$/;
    if (!accountRegex.test(accountNumber)) {
      setError("Account number must be 6–12 digits.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          accountNumber: accountNumber.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429 && data.lockoutUntil) {
          // Handle lockout with countdown
          const lockoutTime = new Date(data.lockoutUntil);
          const now = new Date();
          const remainingSeconds = Math.ceil((lockoutTime - now) / 1000);
          if (remainingSeconds > 0) {
            setRemainingTime(remainingSeconds);
            setError(`Too many failed attempts. Please wait ${remainingSeconds} seconds before trying again.`);
          } else {
            setError("Login failed.");
          }
        } else {
          // Handle other errors
          let errorMessage = "Login failed.";
          if (data.error) {
            if (typeof data.error === 'string') {
              errorMessage = data.error;
            } else if (data.error.text) {
              errorMessage = data.error.text;
            }
          }
          setError(errorMessage);
        }
        setLoading(false);
        return;
      }

      // Mark user as authenticated
      setAuthenticated(true);
      setRemainingTime(0); // Clear any remaining lockout time

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Unable to connect to server.");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>

      <input
        type="text"
        placeholder="Account Number (6–12 digits)"
        value={accountNumber}
        onChange={(e) => setAccountNumber(e.target.value)}
      />
      <br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />

      <button onClick={handleLogin} disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>

      <p style={{ marginTop: 10 }}>
        Don’t have an account? <a href="/register">Register here</a>
      </p>

      {error && (
        <p style={{ color: "red", marginTop: "10px" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default Login;
