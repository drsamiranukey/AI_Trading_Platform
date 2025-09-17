import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null, requiredPermission = null }) => {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Check role-based access
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
        p={4}
      >
        <Typography variant="h4" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          You don't have the required role ({requiredRole}) to access this page.
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Please contact your administrator if you believe this is an error.
        </Typography>
      </Box>
    );
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
        p={4}
      >
        <Typography variant="h4" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          You don't have the required permission ({requiredPermission}) to access this page.
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Please contact your administrator if you believe this is an error.
        </Typography>
      </Box>
    );
  }

  // Check if user account is active
  if (user && user.is_active === false) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
        p={4}
      >
        <Typography variant="h4" color="warning.main" gutterBottom>
          Account Inactive
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Your account has been deactivated. Please contact support for assistance.
        </Typography>
      </Box>
    );
  }

  // Check if user email is verified (if required)
  if (user && user.email_verified === false && process.env.REACT_APP_REQUIRE_EMAIL_VERIFICATION === 'true') {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
        p={4}
      >
        <Typography variant="h4" color="warning.main" gutterBottom>
          Email Verification Required
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Please verify your email address to access this page.
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Check your inbox for a verification email.
        </Typography>
      </Box>
    );
  }

  // User is authenticated and authorized, render the protected content
  return children;
};

// Higher-order component for protecting routes
export const withProtectedRoute = (Component, options = {}) => {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute
        requiredRole={options.requiredRole}
        requiredPermission={options.requiredPermission}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

// Specific protected route components for common use cases
export const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRole="admin">
    {children}
  </ProtectedRoute>
);

export const PremiumRoute = ({ children }) => (
  <ProtectedRoute requiredRole="premium">
    {children}
  </ProtectedRoute>
);

export const TradingRoute = ({ children }) => (
  <ProtectedRoute requiredPermission="trading">
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;