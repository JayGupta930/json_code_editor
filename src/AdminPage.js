import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { visualizeAllGists, validateGithubToken } from "./utils/githubConfig";

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
      if (!validateGithubToken()) {
        setError("GitHub token is not configured. Please check your environment variables.");
        return;
      }

      setIsLoading(true);
      try {
        const data = await visualizeAllGists();
        navigate("/visualize", { state: { data } });
      } catch (err) {
        setError("Something went wrong. Please try again later.");
        console.error("Error fetching gists:", err);
        // navigate("/visualize", { state: { data: [] } });
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
    <div className="admin-container" style={styles.container}>
      <h1 style={styles.heading}>Admin Panel</h1>

      <div style={styles.loginContainer}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <p style={styles.instructions}>
            Please enter the admin password to continue:
          </p>

          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>
              Password:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              style={styles.input}
              autoFocus
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <div style={styles.buttonGroup}>
            <button type="submit" style={styles.button}>
              Login
            </button>
            <button
              type="button"
              onClick={handleBackToHome}
              style={{ ...styles.button, backgroundColor: "#6c757d" }}
            >
              Back to Home
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Inline styles
const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "2rem",
    fontFamily: "Arial, sans-serif",
  },
  heading: {
    color: "#333",
    marginBottom: "1.5rem",
    textAlign: "center",
  },
  subheading: {
    color: "#444",
    marginBottom: "1rem",
  },
  loginContainer: {
    backgroundColor: "#f8f9fa",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  instructions: {
    margin: "0 0 1rem 0",
    color: "#555",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontWeight: "bold",
    color: "#444",
  },
  input: {
    padding: "0.75rem",
    borderRadius: "4px",
    border: "1px solid #ced4da",
    fontSize: "16px",
  },
  error: {
    color: "#dc3545",
    margin: "0.5rem 0",
  },
  buttonGroup: {
    display: "flex",
    gap: "1rem",
    marginTop: "1rem",
  },
  button: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#0275d8",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background-color 0.2s",
  },
  adminContent: {
    backgroundColor: "#f8f9fa",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  adminSection: {
    margin: "2rem 0",
    padding: "1rem",
    backgroundColor: "white",
    borderRadius: "4px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  featureList: {
    paddingLeft: "1.5rem",
    margin: "1rem 0",
    lineHeight: "1.6",
  },
};

export default AdminPage;
