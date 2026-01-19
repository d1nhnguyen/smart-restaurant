import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles.css';
import './custom-styles.css';
import TablesPage from './pages/TablesPage/TablesPage';
import MenuPage from './pages/MenuPage/MenuPage';
import LoginPage from './pages/LoginPage/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';

import AdminDashboardPage from './pages/AdminDashboardPage/AdminDashboardPage';
import AdminItemPage from './pages/AdminItemPage/AdminItemPage';
import AdminCategoryPage from './pages/AdminCategoryPage/AdminCategoryPage';
import AdminModifierPage from './pages/AdminModifierPage/AdminModifierPage';
import AdminOrderPage from './pages/AdminOrderPage/AdminOrderPage';
import { CartProvider } from './contexts/CartContext';

import QRLandingPage from './pages/QRLandingPage/QRLandingPage';
import OrderTrackingPage from './pages/OrderTrackingPage/OrderTrackingPage';
import CheckoutPage from './pages/CheckoutPage/CheckoutPage';
import OrderConfirmPage from './pages/OrderConfirmPage/OrderConfirmPage';

import KitchenStaffPage from './pages/KitchenStaffPage/KitchenStaffPage';
import ReportsPage from './pages/ReportsPage/ReportsPage';

import PaymentSuccessPage from './pages/PaymentSuccessPage/PaymentSuccessPage';
import PaymentFailedPage from './pages/PaymentFailedPage/PaymentFailedPage';
import AccountManagementPage from './pages/AccountManagementPage/AccountManagementPage';
import VNPayReturnPage from './pages/VNPayReturnPage/VNPayReturnPage';

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

          {/* Admin & Staff Routes - Tối giản */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute allowedRoles={['ADMIN', 'WAITER']}><AdminOrderPage /></ProtectedRoute>} />
          <Route path="/staff" element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}><KitchenStaffPage /></ProtectedRoute>} />
          <Route path="/tables" element={<ProtectedRoute allowedRoles={['ADMIN']}><TablesPage /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminCategoryPage /></ProtectedRoute>} />
          <Route path="/items" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminItemPage /></ProtectedRoute>} />
          <Route path="/modifiers" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminModifierPage /></ProtectedRoute>} />
          <Route path="/accounts" element={<ProtectedRoute allowedRoles={['ADMIN']}><AccountManagementPage /></ProtectedRoute>} />

          {/* Public Customer Routes */}
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/" element={<MenuPage />} />
          <Route path="/payment/vnpay-return" element={<VNPayReturnPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/failed" element={<PaymentFailedPage />} />
        </Routes>
      </CartProvider >
    </Router >
  );
}

export default App;