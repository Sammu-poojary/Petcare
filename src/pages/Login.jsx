import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import './Login.css';

function Login({ onLogin, onGoogleLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showResend, setShowResend] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setShowResend(false);

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!normalizedEmail || !trimmedPassword) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (trimmedPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: trimmedPassword,
      });

      if (error) {
        console.error('Login error:', error);

        let friendly = error.message || 'Login failed. Please check your credentials.';

        if (error.message === 'Failed to fetch') {
          friendly = 'Network error: Unable to connect to server. Please check your internet connection.';
        } else if (error.message?.toLowerCase().includes('invalid login credentials') ||
          error.message?.toLowerCase().includes('invalid email or password')) {
          friendly = 'Invalid email or password. Please check and try again.';
        } else if (error.message?.toLowerCase().includes('email not confirmed')) {
          friendly = 'Please verify your email before logging in.';
          setShowResend(true);
        }

        setErrorMessage(friendly);
        setLoading(false);
        return;
      }

      // Wait a moment for session to be established
      if (data?.session) {
        // Inform parent App that login succeeded so it can update auth state
        if (typeof onLogin === 'function') {
          await onLogin();
        }

        // Decide destination based on profile completion
        const hasProfile = localStorage.getItem('hasProfile') === 'true';
        sessionStorage.setItem('justLoggedIn', 'true');
        navigate(hasProfile ? '/home' : '/pet-profile', { state: { fromLogin: true } });
      } else {
        // If no session, wait a bit and check again
        setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            if (typeof onLogin === 'function') {
              await onLogin();
            }
            const hasProfile = localStorage.getItem('hasProfile') === 'true';
            sessionStorage.setItem('justLoggedIn', 'true');
            navigate(hasProfile ? '/home' : '/pet-profile', { state: { fromLogin: true } });
          } else {
            setErrorMessage('Login successful but session not found. Please try again.');
          }
          setLoading(false);
        }, 500);
        return;
      }
    } catch (err) {
      console.error('Login exception:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setErrorMessage('Please enter your email address first.');
      return;
    }
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        }
      });
      if (error) {
        setErrorMessage('Resend failed: ' + error.message);
      } else {
        alert('Verification email resent! Please check your inbox and spam folder.');
        setShowResend(false);
      }
    } catch (err) {
      console.error('Resend exception:', err);
      setErrorMessage('An unexpected error occurred during resend.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`,
        },
      });

      if (error) {
        alert(error.message);
        return;
      }
      // OAuth will redirect to Google, then back to the app
    } catch (error) {
      console.error('Google login error:', error);
      alert('Failed to initiate Google login. Please try again.');
    }
  };


  return (
    <div className="login-container">
      <div className="login-card glass-morphism">
        <div className="login-header">
          <span className="paw-icon">🐾</span>
          <h1>Pawfect Care</h1>
          <p>Care for your furry friends</p>
        </div>

        {errorMessage && (
          <div className="error-banner">
            {errorMessage}
            {showResend && (
              <button 
                onClick={handleResendEmail} 
                disabled={resendLoading}
                className="resend-link-btn"
                style={{
                  display: 'block',
                  margin: '10px auto 0',
                  background: '#fff',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <div className="login-divider"><span>or</span></div>

        <div className="social-login">
          <button className="google-login-button" onClick={handleGoogleLogin}>
            <span className="google-icon">G</span> Login with Google
          </button>
        </div>

        <p className="register-link">
          Don't have an account?{' '}
          <span className="link" onClick={() => navigate('/register')}>
            Register here
          </span>
        </p>
      </div>
    </div>
  );
}


export default Login;
