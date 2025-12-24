import React from 'react';

const Sidebar = () => {
  return (
    <div className="admin-sidebar">
      <div className="sidebar-logo">
        <span style={{ fontSize: '30px' }}>&#127860;</span>
        <span>Smart Restaurant</span>
      </div>

      <nav className="sidebar-nav">
        <a href="/dashboard" className="nav-link">
          <span className="nav-icon">&#128202;</span>
          Dashboard
        </a>
        <a href="/orders" className="nav-link">
          <span className="nav-icon">&#128203;</span>
          Orders
          <span className="nav-badge">5</span>
        </a>
        <a href="/menu" className="nav-link">
          <span className="nav-icon">&#127860;</span>
          Menu Items
        </a>
        <a href="/categories" className="nav-link">
          <span className="nav-icon">&#128193;</span>
          Categories
        </a>
        <a href="/tables" className="nav-link active">
          <span className="nav-icon">&#129689;</span>
          Tables
        </a>
        <a href="/staff" className="nav-link">
          <span className="nav-icon">&#128101;</span>
          Kitchen Staff
        </a>
        <a href="/reports" className="nav-link">
          <span className="nav-icon">&#128200;</span>
          Reports
        </a>
        <a href="/kds" className="nav-link">
          <span className="nav-icon">&#128250;</span>
          Kitchen Display
        </a>
      </nav>

      <div className="sidebar-footer">
        <div className="admin-profile">
          <div className="admin-avatar">AD</div>
          <div className="admin-info">
            <div className="admin-name">Admin User</div>
            <div className="admin-role">Restaurant Admin</div>
          </div>
        </div>
        <a href="/login" className="logout-link">&#128682; Logout</a>
      </div>
    </div>
  );
};

export default Sidebar;
