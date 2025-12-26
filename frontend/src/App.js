import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles.css';
import './custom-styles.css';
import TablesPage from './pages/TablesPage';
import MenuPage from './pages/MenuPage';
import AdminItemPage from './pages/AdminItemPage';
import AdminCategoryPage from './pages/AdminCategoryPage';
function App() {
  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/tables" element={<TablesPage />} />
        <Route path="/admin/items" element={<AdminItemPage />} />
        <Route path="/admin/categories" element={<AdminCategoryPage />} />

        {/* Public Customer Routes */}
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/" element={<MenuPage />} /> {/* Default to menu if no path */}

      </Routes>
    </Router>
  );
}

export default App;
