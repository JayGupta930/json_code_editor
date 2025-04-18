import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { visualizeAllGists } from "./utils/githubConfig";
import "./AdminPage.css";

function AdminPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const correctPassword = process.env.REACT_APP_ADMIN_PASSWORD;

    if (password === correctPassword) {
      setIsLoading(true);
      try {
        const data = await visualizeAllGists();
        navigate("/visualize", { 
          state: { 
            data,
            fromAdmin: true // Add this flag to indicate admin access
          } 
        });
      } catch (err) {
        setError("Something went wrong. Please try again later.");
        console.error("Error fetching gists:", err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("Incorrect password. Please try again.");
      setPassword("");
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  if (isLoading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Loading gists data...</h2>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <h1 className="admin-heading">Admin Panel</h1>

      <div className="login-container">
        <form onSubmit={handleSubmit} className="admin-form">
          <p className="admin-instructions">
            Please enter the admin password to continue:
          </p>

          <div className="input-group">
            <label htmlFor="password" className="admin-label">
              Password:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              className="admin-input"
              autoFocus
            />
          </div>

          {error && <p className="admin-error">{error}</p>}

          <div className="button-group">
            <button type="submit" className="admin-button">
              Login
            </button>
            <button
              type="button"
              onClick={handleBackToHome}
              className="admin-button secondary"
            >
              Back to Home
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminPage;
