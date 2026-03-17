import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSignInAlt, 
  faSpinner, 
  faExclamationTriangle,
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import '../../assets/css/login.css';

const Login = () => {
  const { login, loading, error, _handleLogin } = useAuth();
  const [loginError, setLoginError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFormLogin, setIsFormLogin] = useState(false);

  useEffect(() => {
    // Add classes to enable scrolling on login page
    document.documentElement.classList.add('login-page');
    document.body.classList.add('login-page');
    const root = document.getElementById('root');
    if (root) {
      root.classList.add('login-page');
    }

    // --- JWT login callback handler ---
    // Check for JWT token and user data in URL params (from Okta or backend redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userData = urlParams.get('user');
    if (token && userData) {
      try {
        _handleLogin(token, JSON.parse(userData));
        window.location.href = '/dashboard'; // Redirect after login
      } catch (e) {
        setLoginError('Failed to process login callback.');
      }
    }

    // Cleanup function to remove classes when component unmounts
    return () => {
      document.documentElement.classList.remove('login-page');
      document.body.classList.remove('login-page');
      if (root) {
        root.classList.remove('login-page');
      }
    };
  }, []);

  useEffect(() => {
    // Check for error in URL params (from auth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const authError = urlParams.get('error');
    
    if (authError) {
      switch (authError) {
        case 'auth_failed':
          setLoginError('Authentication failed. Please try again.');
          break;
        case 'callback_failed':
          setLoginError('Authentication callback failed. Please contact support.');
          break;
        case 'access_denied':
          setLoginError('Access denied. You may not have permission to access this system.');
          break;
        default:
          setLoginError('An authentication error occurred. Please try again.');
      }
    }
  }, []);

  const handleLogin = () => {
    setLoginError(null);
    login();
  };

  const handleFormLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError('Please enter both email and password');
      return;
    }
    setLoginError(null);
    // Here you would typically call a different login method for form-based auth
    // For now, we'll just call the existing Okta login
    login();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      {/* AMD Logo */}
      <div className="login-logo-header">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/7/7c/AMD_Logo.svg" 
          alt="AMD Logo" 
          className="amd-logo"
        />
      </div>

      <div className="login-card">
        <div className="login-header">
          <h1>PDQ Dashboard</h1>
          <p>Sign in to access your account</p>
        </div>

        <div className="login-content">
          {(error || loginError) && (
            <div className="login-error">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <span>{error || loginError}</span>
            </div>
          )}

          {!isFormLogin ? (
            <>
              <form onSubmit={handleFormLogin} className="login-form">
                <div className="input-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-wrapper">
                    <FontAwesomeIcon icon={faLock} className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={togglePasswordVisibility}
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="login-button primary"
                  disabled={loading}
                >
                  {loading ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <FontAwesomeIcon icon={faSignInAlt} />
                  )}
                  Sign In
                </button>
              </form>

              <div className="login-divider">
                <span>or</span>
              </div>
            </>
          ) : null}

          <button 
            className="login-button okta"
            onClick={handleLogin}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faSignInAlt} />
            Sign in with Okta
          </button>

          <div className="login-info">
            <div className="first-time-user-info" style={{ marginTop: '18px', fontSize: '0.98em', color: '#555' }}>
              <span>For access, please contact <a href="mailto:iqadashboard.support@amd.com" style={{ color: '#007bff', textDecoration: 'underline' }}>iqadashboard.support@amd.com</a>.</span>
            </div>
          </div>
        </div>

        <div className="login-footer">
          <p>&copy; 2025 AMD Inc. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
