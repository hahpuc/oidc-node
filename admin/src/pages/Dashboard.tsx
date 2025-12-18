import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import "./Dashboard.css";

interface UserInfo {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(
    authService.getUserInfoFromStorage()
  );
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchUser = async () => {
      if (!user && authService.isAuthenticated()) {
        try {
          setLoading(true);
          const userInfo = await authService.fetchUserInfo();
          setUser(userInfo);
          setError("");
        } catch (err) {
          console.error("Failed to fetch user info:", err);
          setError("Failed to load user information");
          // Token might be expired, redirect to login
          navigate("/login");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading user information...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="dashboard">
        <div className="error-container">
          <p>{error || "Failed to load user information"}</p>
          <button onClick={() => navigate("/login")}>Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <h1>🎯 Admin Dashboard - PKCE</h1>
          </div>
          <div className="navbar-user">
            <span className="user-email">{user.email}</span>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="welcome-section">
          <h2>Welcome back, {user.given_name || user.email}! 👋</h2>
          <p>
            You are successfully authenticated with OpenID Connect (PKCE Flow)
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👤</div>
            <div className="stat-content">
              <h3>User ID</h3>
              <p>{user.sub}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📧</div>
            <div className="stat-content">
              <h3>Email</h3>
              <p>{user.email}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Status</h3>
              <p>Authenticated</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔐</div>
            <div className="stat-content">
              <h3>Auth Method</h3>
              <p>PKCE (S256)</p>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h3>🎉 PKCE Authentication Successful!</h3>
          <p>
            You have successfully authenticated using the OpenID Connect
            Authorization Code Flow with PKCE. This is a secure authentication
            method designed for Single Page Applications (SPAs) that doesn't
            require a client_secret!
          </p>

          <div className="user-details">
            <h4>User Information:</h4>
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </div>

          <div className="flow-explanation pkce">
            <h4>🔐 What is PKCE?</h4>
            <p>
              <strong>PKCE (Proof Key for Code Exchange)</strong> is an OAuth
              2.0 extension that makes the authorization code flow secure for
              public clients like SPAs and mobile apps.
            </p>
            <h4>How it works:</h4>
            <ol>
              <li>
                Generate random <code>code_verifier</code>
              </li>
              <li>
                Create <code>code_challenge</code> = SHA256(code_verifier)
              </li>
              <li>
                Send <code>code_challenge</code> to auth server
              </li>
              <li>Receive authorization code</li>
              <li>
                Exchange code + <code>code_verifier</code> for tokens
              </li>
              <li>
                Server validates: SHA256(code_verifier) === code_challenge
              </li>
            </ol>
            <div className="security-note">
              <strong>🛡️ Security:</strong> Even if the authorization code is
              intercepted, it's useless without the original code_verifier which
              never leaves the browser!
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
