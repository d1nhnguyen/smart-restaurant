import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../utils/auth';

const GuestRoute = ({ children }) => {
    const isAuthenticated = authService.isAuthenticated();
    const user = authService.getUser();

    if (isAuthenticated) {
        // Redirect based on role (mirroring LoginPage logic)
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

export default GuestRoute;
