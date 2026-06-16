import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./AdminSplash.css";

function AdminSplash() {
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowOptions(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="admin-splash-container">
      <div className="bg-glow glow-1"></div>
      <div className="bg-glow glow-2"></div>

      <div className={`admin-splash-card ${showOptions ? "visible" : "hidden"}`}>
        <div className="admin-logo-ring">
          <span className="admin-emoji">🐾</span>
        </div>

        <h1 className="admin-title">PetCare Admin</h1>
        <p className="admin-sub">
          Welcome to the control center. <br />
          Manage users, pets, and appointments with ease.
        </p>

        <div className="admin-splash-actions">
          {showOptions ? (
            <button
              className="admin-btn login"
              onClick={() => navigate("/admin/login")}
            >
              Access Admin Terminal
            </button>
          ) : (
            <div className="splash-loader" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminSplash;
