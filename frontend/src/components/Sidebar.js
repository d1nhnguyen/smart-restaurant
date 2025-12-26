import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
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
        <Link to="/dashboard" className={getNavLinkClass('/dashboard')}>
          <span className="nav-icon">&#128202;</span>
          Dashboard
        </Link>
        
        <Link to="/orders" className={getNavLinkClass('/orders')}>
          <span className="nav-icon">&#128203;</span>
          Orders
          <span className="nav-badge">5</span>
        </Link>
        
        <Link to="/menu" className={getNavLinkClass('/menu')}>
          <span className="nav-icon">&#127860;</span>
          Menu Items
        </Link>
        
        <Link to="/categories" className={getNavLinkClass('/categories')}>
          <span className="nav-icon">&#128193;</span>
          Categories
        </Link>
        
        <Link to="/tables" className={getNavLinkClass('/tables')}>
          <span className="nav-icon">&#129689;</span>
          Tables
        </Link>
        
        <Link to="/staff" className={getNavLinkClass('/staff')}>
          <span className="nav-icon">&#128101;</span>
          Kitchen Staff
        </Link>
        
        <Link to="/reports" className={getNavLinkClass('/reports')}>
          <span className="nav-icon">&#128200;</span>
          Reports
        </Link>
        
        <Link to="/kds" className={getNavLinkClass('/kds')}>
          <span className="nav-icon">&#128250;</span>
          Kitchen Display
        </Link>
      </nav>

      <div className="sidebar-footer">
        <div className="admin-profile">
          <div className="admin-avatar">AD</div>
          <div className="admin-info">
            <div className="admin-name">Admin User</div>
            <div className="admin-role">Restaurant Admin</div>
          </div>
        </div>
        <Link to="/login" className="logout-link">&#128682; Logout</Link>
      </div>
    </div>
  );
};

export default Sidebar;