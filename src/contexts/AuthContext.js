import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up axios defaults
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  axios.defaults.baseURL = apiUrl;

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Set up axios interceptors for token management
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          handleLogout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Verify token and get user data using auth status endpoint
      const response = await axios.get('/profile/auth/status');
      if (response.data.authenticated) {
        // Get full user profile data
        try {
          const profileResponse = await axios.get('/profile');
          setUser(profileResponse.data.data);
        } catch (profileError) {
          // Fallback to auth status user data if profile fetch fails
          setUser(response.data.user);
        }
        setError(null);
      } else {
        throw new Error('Not authenticated');
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Clear invalid token
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (token, userData) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData);
    setError(null);
  };

  const handleLogout = async () => {
    try {
      // Call logout endpoint
      await axios.post('/profile/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      setUser(null);
      setError(null);
      
      // Redirect to login
      window.location.href = '/login';
    }
  };

  const login = () => {
    // Redirect to Okta authentication
    window.location.href = `${apiUrl}/profile/auth/okta`;
  };

  const updateProfile = async (profileData) => {
    try {
      console.log('Updating profile with data:', profileData);
      const response = await axios.put('/profile', profileData);
      console.log('Profile update response:', response.data);
      
      if (response.data.success) {
        // Use the updated user data returned from the API
        if (response.data.data) {
          setUser(response.data.data);
        } else {
          // Fallback: fetch fresh user data
          const updatedResponse = await axios.get('/profile');
          setUser(updatedResponse.data.data);
        }
        return { success: true };
      } else {
        throw new Error(response.data.error || 'Update failed');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.details || 'Failed to update profile' 
      };
    }
  };

  // Updated permission checking for new category-based system
  const hasPermission = (permission) => {
    if (!user) return false;

    //console.log("user role:", user.role);
   // console.log("user role:", user.category);
    
    // Cat4 users (system admins) have all permissions
    if (user.role === 'cat4' || user.category === 'cat4') return true;
    
    // Check if user has the specific permission
    return user.permissions && user.permissions.includes(permission);
  };

  const hasRole = (requiredRoles) => {
    if (!user) return false;
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(user.role) || roles.includes(user.category);
  };

  // Helper function to get permissions for a category
  const getCategoryPermissions = (category) => {
    switch (category) {
      case 'cat1':
        return ['dashboard', 'search', 'clf'];
      case 'cat2':
        return ['search', 'clf', 'start_build', 'continue_build'];
      case 'cat3':
        return ['dashboard', 'search', 'clf', 'start_build', 'continue_build', 'allocation'];
      case 'cat4':
        return ['dashboard', 'search', 'clf', 'start_build', 'continue_build', 'allocation', 'user_management'];
      case 'customer':
        return ['customer_portal'];
      default:
        return []; // Unassigned users get no permissions
    }
  };

  // Check if user can access specific feature areas
  const canAccessDashboard = () => hasPermission('dashboard');
  const canAccessSearch = () => hasPermission('search');
  const canAccessCLF = () => hasPermission('clf');
  const canStartBuild = () => hasPermission('start_build');
  const canContinueBuild = () => hasPermission('continue_build');
  const canViewBuilds = () => hasPermission('allocation');
  const canManageUsers = () => hasPermission('user_management');
  const canAccessCustomerPortal = () => hasPermission('customer_portal');

  const contextValue = {
    user,
    loading,
    error,
    login,
    logout: handleLogout,
    updateProfile,
    hasPermission,
    hasRole,
    getCategoryPermissions,
    canAccessDashboard,
    canAccessSearch,
    canAccessCLF,
    canStartBuild,
    canContinueBuild,
    canViewBuilds,
    canManageUsers,
    canAccessCustomerPortal,
    isAuthenticated: !!user,
    // Internal methods (don't expose to components)
    _handleLogin: handleLogin,
    _initializeAuth: initializeAuth
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
