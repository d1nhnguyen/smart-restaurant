import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../utils/auth';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user role is allowed for this route
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to their default page based on role
    if (user?.role === 'WAITER') {
      return <Navigate to="/orders" replace />;
    } else if (user?.role === 'STAFF') {
      return <Navigate to="/staff" replace />;
    } else {
      return <Navigate to="/orders" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
