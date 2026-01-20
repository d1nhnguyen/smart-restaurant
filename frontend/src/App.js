import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import './i18n'; // Initialize i18n
import './styles.css';
import './custom-styles.css';
import TablesPage from './pages/TablesPage/TablesPage';
import MenuPage from './pages/MenuPage/MenuPage';
import LoginPage from './pages/LoginPage/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';

import AdminDashboardPage from './pages/AdminDashboardPage/AdminDashboardPage';
import AdminItemPage from './pages/AdminItemPage/AdminItemPage';
import AdminCategoryPage from './pages/AdminCategoryPage/AdminCategoryPage';
import AdminModifierPage from './pages/AdminModifierPage/AdminModifierPage';
import AdminOrderPage from './pages/AdminOrderPage/AdminOrderPage';
import { CartProvider } from './contexts/CartContext';
import { CustomerAuthProvider } from './contexts/CustomerAuthContext';

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

// Customer App Components
import CustomerAppLayout from './layouts/CustomerAppLayout';
import CustomerAuthPage from './pages/customer/CustomerAuthPage/CustomerAuthPage';

// Lazy load customer tab components for better performance
const MenuTab = lazy(() => import('./pages/customer/MenuTab/MenuTab'));
const CartTab = lazy(() => import('./pages/customer/CartTab/CartTab'));
const OrdersTab = lazy(() => import('./pages/customer/OrdersTab/OrdersTab'));
const ProfileTab = lazy(() => import('./pages/customer/ProfileTab/ProfileTab'));

// Loading fallback for lazy-loaded components
// Helper to handle legacy /menu?table=ID links
// Helper to handle legacy /menu?table=ID links
const LegacyMenuRedirect = () => {
  const [params] = useSearchParams();
  const tableId = params.get('table') || params.get('tableId');

  if (tableId) {
    return <Navigate to={`/table/${tableId}`} replace />;
  }

  return <Navigate to="/c/menu" replace />;
};

const TabLoading = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    color: '#95a5a6'
  }}>
    <div className="loading-spinner" style={{
      width: '32px',
      height: '32px',
      border: '3px solid #e0e0e0',
      borderTopColor: '#e74c3c',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
  </div>
);

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CartProvider>
        <CustomerAuthProvider>
          <Routes>
            {/* Staff/Admin Login */}
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />

            {/* QR Code Entry Point */}
            <Route path="/table/:tableId" element={<QRLandingPage />} />

            {/* Customer Auth Page */}
            <Route path="/c/auth" element={<CustomerAuthPage />} />

            {/* Customer App with Bottom Tabs */}
            <Route path="/c" element={<CustomerAppLayout />}>
              <Route index element={<Navigate to="/c/menu" replace />} />
              <Route path="menu" element={
                <Suspense fallback={<TabLoading />}>
                  <MenuTab />
                </Suspense>
              } />
              <Route path="cart" element={
                <Suspense fallback={<TabLoading />}>
                  <CartTab />
                </Suspense>
              } />
              <Route path="orders" element={
                <Suspense fallback={<TabLoading />}>
                  <OrdersTab />
                </Suspense>
              } />
              <Route path="profile" element={
                <Suspense fallback={<TabLoading />}>
                  <ProfileTab />
                </Suspense>
              } />
            </Route>

            {/* Order Tracking (accessible without full app) */}
            <Route path="/order-status/:orderId" element={<OrderTrackingPage />} />

            {/* Checkout & Payment */}
            <Route path="/c/checkout" element={<CheckoutPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success/:orderId" element={<OrderConfirmPage />} />
            <Route path="/payment/vnpay-return" element={<VNPayReturnPage />} />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/failed" element={<PaymentFailedPage />} />

            {/* Admin & Staff Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute allowedRoles={['ADMIN', 'WAITER']}><AdminOrderPage /></ProtectedRoute>} />
            <Route path="/staff" element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}><KitchenStaffPage /></ProtectedRoute>} />
            <Route path="/tables" element={<ProtectedRoute allowedRoles={['ADMIN']}><TablesPage /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminCategoryPage /></ProtectedRoute>} />
            <Route path="/items" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminItemPage /></ProtectedRoute>} />
            <Route path="/modifiers" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminModifierPage /></ProtectedRoute>} />
            <Route path="/accounts" element={<ProtectedRoute allowedRoles={['ADMIN']}><AccountManagementPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['ADMIN']}><ReportsPage /></ProtectedRoute>} />

            {/* Legacy Routes - Redirect to new customer app */}
            <Route path="/menu" element={<LegacyMenuRedirect />} />
            <Route path="/" element={<MenuPage />} />
          </Routes>
        </CustomerAuthProvider>
      </CartProvider>
    </Router>
  );
}

export default App;
