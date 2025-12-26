import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles.css';
import './custom-styles.css';
import TablesPage from './pages/TablesPage';
import MenuPage from './pages/MenuPage';
import AdminItemPage from './pages/AdminItemPage';
import AdminCategoryPage from './pages/AdminCategoryPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/" element={<MenuPage />} /> {/* Default to menu if no path */}

        {/* Protected Admin Routes */}
        <Route
          path="/admin/tables"
          element={
            <ProtectedRoute>
              <TablesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/items"
          element={
            <ProtectedRoute>
              <AdminItemPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute>
              <AdminCategoryPage />
            </ProtectedRoute>
          }
        />

        {/* Compatibility Redirects */}
        <Route path="/tables" element={<Navigate to="/admin/tables" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
