import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabase";
import "./AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear fields on mount to be absolutely sure
  useEffect(() => {
    setEmail("");
    setPassword("");
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const performNavigation = () => {
      // Clear inputs as requested by user
      setEmail("");
      setPassword("");
      navigate("/admin/dashboard");
    };

    // Dev hack: quick login for local testing
    if (email === "admin" && password === "admin@123") {
      try {
        localStorage.setItem("isAdminLocal", "true");
      } catch (err) {
        console.warn('Could not set local admin flag', err);
      }
      performNavigation();
      setLoading(false);
      return;
    }

    // Authenticate via Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // Double check if user is actually an admin
    const { data: profile, error: roleError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (roleError || profile.role !== "admin") {
      alert("Access denied: Not an admin");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    performNavigation();
    setLoading(false);
  };

  return (
    <div className="admin-login-container">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>

      <div className="admin-login-card">
        <h1>Admin Control</h1>
        <p>Enter your credentials to manage PetCare</p>

        <form onSubmit={handleLogin} className="login-form" autoComplete="off">
          <div className="input-group">
            <label className="input-label">Username / Email</label>
            <input
              className="login-input"
              type="text"
              placeholder="admin@petcare.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              className="login-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button className="login-submit-btn" type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Access Dashboard"}
          </button>
        </form>

        <div className="admin-footer-link">
          <Link to="/home">Return to User Site</Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
