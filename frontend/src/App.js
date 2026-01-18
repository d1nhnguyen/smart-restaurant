import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles.css';
import './custom-styles.css';
import TablesPage from './pages/TablesPage';
import MenuPage from './pages/MenuPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';

import AdminItemPage from './pages/AdminItemPage';
import AdminCategoryPage from './pages/AdminCategoryPage';
import AdminModifierPage from './pages/AdminModifierPage';
import AdminOrderPage from './pages/AdminOrderPage';
import { CartProvider } from './contexts/CartContext';

import QRLandingPage from './pages/QRLandingPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmPage from './pages/OrderConfirmPage';

import KitchenStaffPage from './pages/KitchenStaffPage';
import KDSPage from './pages/KDSPage';

import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailedPage from './pages/PaymentFailedPage';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CartProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/table/:tableId" element={<QRLandingPage />} />
          <Route path="/order-status/:orderId" element={<OrderTrackingPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success/:orderId" element={<OrderConfirmPage />} />

          {/* Admin Routes */}
          <Route path="/admin/tables" element={<TablesPage />} />
          <Route path="/admin/items" element={<AdminItemPage />} />
          <Route path="/admin/categories" element={<AdminCategoryPage />} />
          <Route path="/admin/modifiers" element={<AdminModifierPage />} />
          <Route path="/admin/orders" element={<AdminOrderPage />} />
          <Route path="/admin/kds" element={<KDSPage />} />
          <Route path="/staff" element={<KitchenStaffPage />} />

          {/* Public Customer Routes */}
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/" element={<MenuPage />} /> {/* Default to menu if no path */}
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/failed" element={<PaymentFailedPage />} />

        </Routes >
      </CartProvider >
    </Router >
  );
}

export default App;
