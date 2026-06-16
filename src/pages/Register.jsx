import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import './Register.css';

function Register({ onRegister }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setErrorMessage('');
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErrorMessage('');
    setSuccessMessage('');
    
    // Password validation
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Confirm Password do not match');
      window.scrollTo(0, 0);
      return;
    }

    if (!(formData.username && formData.email && formData.phone && formData.password)) {
      setErrorMessage('Please fill in all fields');
      window.scrollTo(0, 0);
      return;
    }

    const phoneRegex = /^[1-9][0-9]{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setErrorMessage('Please enter a valid 10-digit phone number (cannot start with 0)');
      window.scrollTo(0, 0);
      return;
    }

    setLoading(true);

    try {
      // Create auth user in Supabase with email confirmation
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            username: formData.username,
            phone: formData.phone
          }
        }
      });

      if (error) {
        console.error('Supabase signUp error:', error);
        if (error.message?.toLowerCase().includes('rate limit')) {
          setErrorMessage('Registration limit reached. Please wait 15-20 minutes or try "Register with Google" below.');
        } else {
          setErrorMessage(error.message || 'Registration failed');
        }
        window.scrollTo(0, 0);
        setLoading(false);
        return;
      }

      // If email confirmation is ON, user might be null or session might not be established
      if (data?.user) {
        try {
          // Try to insert a user profile (username) into `profiles`.
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: formData.email,
              name: formData.username,
              phone: formData.phone
            });

          if (profileError) {
            console.error('Profile table insert failed:', profileError.message, profileError);
          } else {
            console.log('Profile saved successfully for:', data.user.id);
          }
        } catch (dbErr) {
          console.error('Database insertion error:', dbErr);
        }
      }

      const isEmailConfRequired = data?.session === null;

      if (typeof onRegister === 'function') {
        await onRegister();
      }

      if (data?.user || !error) {
        setIsRegistered(true);
        setSuccessMessage('Registration request accepted! A verification email is on its way.');
        window.scrollTo(0, 0);
      }
    } catch (err) {
      console.error('SignUp exception:', err);
      if (err.message && err.message.includes('Failed to fetch')) {
        setErrorMessage('Network error: Unable to connect to server. Check your connection.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/pet-profile`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }
    } catch (error) {
      console.error('Google register error:', error);
      setErrorMessage('Failed to initiate Google registration.');
    }
  };

  const handleResendInPlace = async () => {
    if (!formData.email) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        }
      });
      if (error) {
        setErrorMessage('Resend failed: ' + error.message);
      } else {
        alert('Verification email resent! Please check your inbox and spam folder.');
      }
    } catch (err) {
      console.error('Resend exception:', err);
      setErrorMessage('An unexpected error occurred.');
    } finally {
      setResendLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="register-container">
        <div className="register-card glass-morphism success-view" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="success-icon" style={{ fontSize: '60px', marginBottom: '20px' }}>📧</div>
          <h1>Verify Your Email</h1>
          <p style={{ color: '#555', marginBottom: '20px', lineHeight: '1.6' }}>
            We've sent a verification link to: <br />
            <strong style={{ color: '#667eea', fontSize: '1.1rem' }}>{formData.email}</strong>
          </p>
          <div className="instructions" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', color: '#666' }}>
            <p>1. Check your <strong>Inbox</strong> or <strong>Spam</strong> folder.</p>
            <p>2. Click the verification link in the email.</p>
            <p>3. Once verified, you can log in below.</p>
          </div>

          {errorMessage && <div className="error-banner" style={{ background: '#fff1f1', color: '#e53e3e', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.85rem' }}>{errorMessage}</div>}

          <div className="success-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="login-button" onClick={() => navigate('/login')} style={{ width: '100%', padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              Go to Login Page
            </button>
            
            <button 
              className="resend-btn-inline" 
              onClick={handleResendInPlace} 
              disabled={resendLoading}
              style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #667eea', color: '#667eea', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              {resendLoading ? 'Resending...' : 'Didn\'t get the email? Resend'}
            </button>

            <button 
              className="back-btn-inline" 
              onClick={() => setIsRegistered(false)} 
              style={{ border: 'none', background: 'none', color: '#999', fontSize: '0.85rem', cursor: 'pointer', marginTop: '10px' }}
            >
              ← Back to Registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <span className="paw-icon">🐾</span>
          <h1>Create Account</h1>
          <p>Join Pawfect Care today</p>
        </div>
        {errorMessage && (
          <div className="error-message" style={{ color: '#d32f2f', background: '#ffebee', padding: '10px', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="10-digit phone number"
              pattern="[1-9][0-9]{9}"
              maxLength="10"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>
          <button 
            type="submit" 
            className="register-button" 
            disabled={loading}
          >
            {loading ? 'Processing…' : 'Register'}
          </button>
          
          <div className="register-divider" style={{ margin: '20px 0', textAlign: 'center', color: '#999', position: 'relative' }}>
            <span style={{ background: 'white', padding: '0 10px', position: 'relative', zIndex: 1 }}>or</span>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#eee' }}></div>
          </div>

          <button 
            type="button" 
            className="google-register-button" 
            onClick={handleGoogleRegister}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              color: '#555'
            }}
          >
            <span style={{ fontSize: '20px' }}>G</span> Register with Google
          </button>
        </form>
        <p className="login-link">
          Already have an account? <span className="link" onClick={() => navigate('/login')}>Login here</span>
        </p>
      </div>
    </div>
  );
}

export default Register;
