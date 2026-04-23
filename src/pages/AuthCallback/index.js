import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { _handleLogin } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const userParam = urlParams.get('user');

        if (!token || !userParam) {
          throw new Error('Missing authentication parameters');
        }

        // Parse user data
        const userData = JSON.parse(decodeURIComponent(userParam));

        // Handle login with token and user data
        _handleLogin(token, userData);

        // Show success message briefly then redirect
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);

      } catch (error) {
        console.error('Auth callback error:', error);
        // Redirect to login with error
        navigate('/login?error=callback_failed', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate, _handleLogin]);

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-card">
        <div className="auth-callback-content">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" color="#ED1C24" />
          <h2>Completing Authentication...</h2>
          <p>Please wait while we set up your session.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
