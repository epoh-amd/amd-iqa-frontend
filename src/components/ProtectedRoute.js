import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faLock, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

// Loading component for authentication check
const AuthLoading = () => (
  <div className="auth-loading">
    <FontAwesomeIcon icon={faSpinner} spin size="3x" color="#ED1C24" />
    <h3>Authenticating...</h3>
    <p>Please wait while we verify your credentials.</p>
  </div>
);

// Access denied component
const AccessDenied = ({ message = "You don't have permission to access this resource." }) => (
  <div className="access-denied">
    <FontAwesomeIcon icon={faLock} size="4x" color="#dc3545" />
    <h2>Access Denied</h2>
    <p>{message}</p>
    <button onClick={() => window.history.back()} className="btn-secondary">
      Go Back
    </button>
  </div>
);

// Permission error component
const PermissionError = ({ required, current }) => (
  <div className="permission-error">
    <FontAwesomeIcon icon={faExclamationTriangle} size="4x" color="#ffc107" />
    <h2>Insufficient Permissions</h2>
    <p>You need {required.join(' or ')} access to view this resource.</p>
    {current && <p>Your current role: <strong>{current}</strong></p>}
    <button onClick={() => window.history.back()} className="btn-secondary">
      Go Back
    </button>
  </div>
);

// Main ProtectedRoute component
const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  requiredPermissions = [],
  requiredRoles = [],
  fallback = null 
}) => {
  const { user, loading, isAuthenticated, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  // Show loading while authentication is being checked
  if (loading) {
    return <AuthLoading />;
  }

  // Redirect to login if authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authentication is not required, render children
  if (!requireAuth) {
    return children;
  }

  // Check role-based access
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return fallback || (
        <PermissionError 
          required={requiredRoles} 
          current={user?.role}
        />
      );
    }
  }

  //console.log('User permissions:', user?.permissions);
  //console.log('Checking permissions:', requiredPermissions);

  // Check permission-based access
  if (requiredPermissions.length > 0) {
    const hasRequiredPermission = requiredPermissions.some(permission => {
      if (typeof permission === 'string') {
        return hasPermission(permission);
      }
      // For backward compatibility, if it's an object, just check the permission string
      return hasPermission(permission.resource || permission);
    });

    if (!hasRequiredPermission) {
      return fallback || (
        <AccessDenied 
          message={`You need one of the following permissions: ${
            requiredPermissions.map(p => 
              typeof p === 'string' ? p : `${p.resource}:${p.access}`
            ).join(', ')
          }`}
        />
      );
    }
  }

  // All checks passed, render children
  return children;
};

// Higher-order component for wrapping components with protection
export const withAuth = (Component, options = {}) => {
  return (props) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Hook for checking permissions in components
export const usePermissions = () => {
  const { hasPermission, hasRole, user } = useAuth();

  const checkAccess = (requirements) => {
    if (!requirements) return true;

    const { permissions = [], roles = [] } = requirements;

    // Check roles
    if (roles.length > 0) {
      const hasRequiredRole = roles.some(role => hasRole(role));
      if (!hasRequiredRole) return false;
    }

    // Check permissions
    if (permissions.length > 0) {
      const hasRequiredPermission = permissions.some(permission => {
        if (typeof permission === 'string') {
          return hasPermission(permission);
        }
        // For backward compatibility, if it's an object, just check the permission string
        return hasPermission(permission.resource || permission);
      });
      if (!hasRequiredPermission) return false;
    }

    return true;
  };

  return {
    checkAccess,
    hasPermission,
    hasRole,
    user
  };
};

export default ProtectedRoute;
