import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles.css';
import './custom-styles.css';
import TablesPage from './pages/TablesPage';
import MenuPage from './pages/MenuPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/menu" element={<MenuPage />} />

        {/* Protected Admin Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <TablesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tables" 
          element={
            <ProtectedRoute>
              <TablesPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
