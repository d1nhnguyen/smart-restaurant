import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import BottomTabBar from '../components/customer/BottomTabBar';
import './CustomerAppLayout.css';

const CustomerAppLayout = () => {
  const { table } = useCart();
  const { hasSession, isLoading } = useCustomerAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="customer-app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Require table session
  if (!table) {
    return <Navigate to="/" replace />;
  }

  // Require customer auth session (guest or authenticated)
  if (!hasSession) {
    return <Navigate to="/c/auth" replace />;
  }

  return (
    <div className="customer-app">
      <main className="customer-content">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
};

export default CustomerAppLayout;
