import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../utils/auth';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getUser();

  const handleLogout = (e) => {
    e.preventDefault();
    authService.logout();
    navigate('/login');
  };

  const getNavLinkClass = (path) => {
    return location.pathname === path || location.pathname.startsWith(path)
      ? 'nav-link active'
      : 'nav-link';
  };

  return (
    <div className="admin-sidebar">
      <div className="sidebar-logo">
        <span style={{ fontSize: '30px' }}>&#127860;</span>
        <span>Smart Restaurant</span>
      </div>

      <nav className="sidebar-nav">
        <Link to="/admin/tables" className={getNavLinkClass('/admin/tables')}>
          <span className="nav-icon">&#129689;</span>
          Tables
        </Link>
        <Link to="/admin/items" className={getNavLinkClass('/admin/items')}>
          <span className="nav-icon">&#127860;</span>
          Menu Items
        </Link>
        <Link to="/admin/categories" className={getNavLinkClass('/admin/categories')}>
          <span className="nav-icon">&#128193;</span>
          Categories
        </Link>
      </nav>

      <div className="sidebar-footer">
        <div className="admin-profile">
          <div className="admin-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div className="admin-info">
            <div className="admin-name">{user?.name || 'User'}</div>
            <div className="admin-role">{user?.email || ''}</div>
          </div>
        </div>
        <a href="/login" className="logout-link" onClick={handleLogout}>&#128682; Logout</a>
      </div>
    </div>
  );
};

export default Sidebar;
