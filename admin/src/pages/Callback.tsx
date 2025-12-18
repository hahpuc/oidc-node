import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../services/authService";
import "./Callback.css";

const Callback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let hasRun = false;

    const handleCallback = async () => {
      if (hasRun) return;
      hasRun = true;

      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (!code || !state) {
        setStatus("error");
        setError("Missing code or state parameter");
        return;
      }

      try {
        const success = await authService.handleCallback(code, state);
        if (success) {
          setStatus("success");
          setTimeout(() => navigate("/dashboard"), 1000);
        } else {
          setStatus("error");
          setError("Failed to authenticate");
        }
      } catch (err) {
        setStatus("error");
        setError("Authentication failed");
        console.error(err);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="callback-container">
      <div className="callback-card">
        {status === "processing" && (
          <>
            <div className="spinner"></div>
            <h2>Processing authentication...</h2>
            <p>Please wait while we complete your login</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="success-icon">✓</div>
            <h2>Authentication successful!</h2>
            <p>Redirecting to dashboard...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="error-icon">✗</div>
            <h2>Authentication failed</h2>
            <p>{error}</p>
            <button onClick={() => navigate("/login")} className="retry-button">
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Callback;
