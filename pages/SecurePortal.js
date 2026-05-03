import React, { useState } from "react";

function App() {
  const [page, setPage] = useState("login");
  const [form, setForm] = useState({});
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Regex validation (IMPORTANT FOR MARKS)
  const usernameRegex = /^[a-zA-Z0-9]{4,20}$/;
  const passwordRegex = /^(?=.[0-9])(?=.[!@#$%^&]).{8,}$/;
  const amountRegex = /^[0-9]+(.[0-9]{1,2})?$/;

  const handleSubmit = (e) => {
    e.preventDefault();

    // LOGIN / REGISTER VALIDATION
    if (page === "login" || page === "register") {
      if (!usernameRegex.test(form.username)) {
        return setMessage("Invalid username");
      }
      if (!passwordRegex.test(form.password)) {
        return setMessage("Weak password");
      }
      setMessage("Valid input (connect to API)");
    }

    // TRANSACTION VALIDATION
    if (page === "transaction") {
      if (!amountRegex.test(form.amount)) {
        return setMessage("Invalid amount");
      }
      setMessage("Transaction submitted (connect to API)");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Secure Payment Portal</h1>

      {/ Navigation /}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setPage("login")}>Login</button>
        <button onClick={() => setPage("register")}>Register</button>
        <button onClick={() => setPage("transaction")}>Transaction</button>
      </div>

      {/ LOGIN /}
      {page === "login" && (
        <form onSubmit={handleSubmit}>
          <h2>Login</h2>
          <input name="username" placeholder="Username" onChange={handleChange} /><br />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} /><br />
          <button type="submit">Login</button>
        </form>
      )}

      {/ REGISTER /}
      {page === "register" && (
        <form onSubmit={handleSubmit}>
          <h2>Register</h2>
          <input name="username" placeholder="Username" onChange={handleChange} /><br />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} /><br />
          <button type="submit">Register</button>
        </form>
      )}

      {/ TRANSACTION /}
      {page === "transaction" && (
        <form onSubmit={handleSubmit}>
          <h2>Transaction</h2>
          <input name="recipient" placeholder="Recipient" onChange={handleChange} /><br />
          <input name="amount" placeholder="Amount" onChange={handleChange} /><br />
          <input name="currency" placeholder="Currency" onChange={handleChange} /><br />
          <button type="submit">Send</button>
        </form>
      )}

      {/ Feedback */}
      <p>{message}</p>
    </div>
  );
}

export default App;