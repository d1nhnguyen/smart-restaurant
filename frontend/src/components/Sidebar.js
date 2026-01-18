import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../utils/auth';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const user = authService.getUser();

  const handleLogout = (e) => {
    e.preventDefault();
    authService.logout();
    navigate('/login');
  };
  const location = useLocation(); // Lấy thông tin URL hiện tại

  // Hàm kiểm tra đường dẫn để thêm class 'active'
  // logic: nếu đường dẫn hiện tại bắt đầu bằng path của link thì active
  const getNavLinkClass = (path) => {
    // So sánh chính xác hoặc so sánh prefix (nếu muốn /menu/add cũng active menu)
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
        <Link to="/admin/dashboard" className={getNavLinkClass('/admin/dashboard')}>
          <span className="nav-icon">&#128202;</span>
          Dashboard
        </Link>

        <Link to="/admin/orders" className={getNavLinkClass('/admin/orders')}>
          <span className="nav-icon">&#128203;</span>
          Orders
          <span className="nav-badge">5</span>
        </Link>

        <Link to="/admin/items" className={getNavLinkClass('/admin/items')}>
          <span className="nav-icon">&#127860;</span>
          Menu Items
        </Link>

        <Link to="/admin/categories" className={getNavLinkClass('/admin/categories')}>
          <span className="nav-icon">&#128193;</span>
          Categories
        </Link>

        <Link to="/admin/modifiers" className={getNavLinkClass('/admin/modifiers')}>
          <span className="nav-icon">&#128203;</span>
          Modifiers
        </Link>

        <Link to="/admin/tables" className={getNavLinkClass('/admin/tables')}>
          <span className="nav-icon">&#129689;</span>
          Tables
        </Link>

        <Link to="/staff" className={getNavLinkClass('/staff')}>
          <span className="nav-icon">&#128101;</span>
          Kitchen Staff
        </Link>

        <Link to="/admin/reports" className={getNavLinkClass('/admin/reports')}>
          <span className="nav-icon">&#128200;</span>
          Reports
        </Link>

        <Link to="/admin/accounts" className={getNavLinkClass('/admin/accounts')}>
          <span className="nav-icon">&#128100;</span>
          Account
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