import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../contexts/CartContext';
import './BottomTabBar.css';

const BottomTabBar = () => {
  const { t } = useTranslation();
  useLocation();
  const { cart, activeOrders } = useCart();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeOrdersCount = activeOrders?.length || 0;

  const tabs = [
    {
      path: '/c/menu',
      label: t('tabs.menu', 'Menu'),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3h18v18H3zM3 9h18M9 21V9" />
        </svg>
      )
    },
    {
      path: '/c/cart',
      label: t('tabs.cart', 'Cart'),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      ),
      badge: cartCount
    },
    {
      path: '/c/orders',
      label: t('tabs.orders', 'Orders'),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      badge: activeOrdersCount
    },
    {
      path: '/c/profile',
      label: t('tabs.profile', 'Profile'),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    }
  ];

  return (
    <nav className="bottom-tab-bar">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `tab-item ${isActive ? 'active' : ''}`
          }
        >
          <div className="tab-icon-wrapper">
            {tab.icon}
            {tab.badge > 0 && (
              <span className="tab-badge">{tab.badge > 99 ? '99+' : tab.badge}</span>
            )}
          </div>
          <span className="tab-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomTabBar;
