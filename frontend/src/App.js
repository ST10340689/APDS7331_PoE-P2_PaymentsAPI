import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";

function App() {
  const [authenticated, setAuthenticated] = useState(null);

  // Check session on page load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/check-session", {
          method: "GET",
          credentials: "include", // required for cookies
        });

        const data = await res.json();

        // Backend returns: { loggedIn: true/false }
        setAuthenticated(data.loggedIn);
      } catch (err) {
        console.error("Session check failed:", err);
        setAuthenticated(false);
      }
    };

    checkSession();
  }, []);

  // While checking session
  if (authenticated === null) {
    return <p>Loading...</p>;
  }

  return (
    <Router>
      <Routes>

        {/* LOGIN PAGE (REAL ROUTE) */}
        <Route
          path="/login"
          element={<Login setAuthenticated={setAuthenticated} />}
        />

        {/* DEFAULT ROUTE → redirect to /login */}
        <Route
          path="/"
          element={<Navigate to="/login" />}
        />

        {/* REGISTER PAGE */}
        <Route
          path="/register"
          element={<Register />}
        />

        {/* PROTECTED DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            authenticated ? <Dashboard /> : <Navigate to="/login" />
          }
        />

      </Routes>
    </Router>
  );
}

export default App;
