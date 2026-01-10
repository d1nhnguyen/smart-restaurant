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
function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        {/* Admin Routes */}
        <Route path="/admin/tables" element={<TablesPage />} />
        <Route path="/admin/items" element={<AdminItemPage />} />
        <Route path="/admin/categories" element={<AdminCategoryPage />} />
        <Route path="/admin/modifiers" element={<AdminModifierPage />} />

        {/* Public Customer Routes */}
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/" element={<MenuPage />} /> {/* Default to menu if no path */}

      </Routes>
    </Router>
  );
}

export default App;
