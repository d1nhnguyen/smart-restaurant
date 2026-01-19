import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../utils/auth';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = (e) => {
    e.preventDefault();
    authService.logout();
    navigate('/login');
  };

  // Function to check if link is active
  const getNavLinkClass = (path) => {
    return location.pathname === path || location.pathname.startsWith(path)
      ? 'nav-link active'
      : 'nav-link';
  };

  // Define all menu items with role restrictions
  const allMenuItems = [
    {
      path: '/admin/dashboard',
      icon: '&#128202;',
      label: 'Dashboard',
      badge: null,
      roles: ['ADMIN']
    },
    {
      path: '/orders',
      icon: '&#128203;',
      label: 'Orders',
      badge: null,
      roles: ['ADMIN', 'WAITER']
    },
    {
      path: '/staff',
      icon: '&#128101;',
      label: 'Kitchen Staff',
      badge: null,
      roles: ['ADMIN', 'STAFF']
    },
    {
      path: '/tables',
      icon: '&#129689;',
      label: 'Tables',
      badge: null,
      roles: ['ADMIN']
    },
    {
      path: '/items',
      icon: '&#127860;',
      label: 'Menu Items',
      badge: null,
      roles: ['ADMIN']
    },
    {
      path: '/categories',
      icon: '&#128193;',
      label: 'Categories',
      badge: null,
      roles: ['ADMIN']
    },
    {
      path: '/modifiers',
      icon: '&#128203;',
      label: 'Modifiers',
      badge: null,
      roles: ['ADMIN']
    },
    {
      path: '/reports',
      icon: '&#128200;',
      label: 'Reports',
      badge: null,
      roles: ['ADMIN']
    },
    {
      path: '/accounts',
      icon: '&#128101;',
      label: 'Accounts',
      badge: null,
      roles: ['ADMIN']
    }
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item =>
    item.roles.includes(user?.role)
  );

  return (
    <>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        &#9776;
      </button>
      <div className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '32px' }}>🍽️</span>
            <span>Smart Restaurant</span>
          </div>
          <button className="sidebar-close" onClick={toggleSidebar}>&times;</button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path} className={getNavLinkClass(item.path)} onClick={() => setIsOpen(false)}>
              <span className="nav-icon" dangerouslySetInnerHTML={{ __html: item.icon }}></span>
              {item.label}
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </Link>
          ))}
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
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
    </>
  );
};

export default Sidebar;