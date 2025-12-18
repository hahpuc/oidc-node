import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = () => {
    authService.login();
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🔐 Admin Dashboard</h1>
          <p>Sign in with OpenID Connect (PKCE)</p>
        </div>

        <button className="login-button" onClick={handleLogin}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"
              fill="currentColor"
            />
            <path
              d="M10 5v5l3 3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Sign in with OpenID Connect
        </button>

        <div className="login-info">
          <p>Secure authentication using PKCE flow</p>
          <p className="pkce-info">✅ No client_secret required</p>
        </div>

        <div className="login-footer">
          <div className="feature">
            <span className="icon">🔒</span>
            <span>PKCE Flow</span>
          </div>
          <div className="feature">
            <span className="icon">⚡</span>
            <span>Pure React</span>
          </div>
          <div className="feature">
            <span className="icon">🌐</span>
            <span>Single Sign-On</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
