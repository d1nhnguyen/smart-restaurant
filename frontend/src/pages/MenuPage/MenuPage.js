import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Fuse from 'fuse.js';
import { useTranslation } from 'react-i18next';
import OrderItemModal from '../../components/OrderItemModal';
import { useCart } from '../../contexts/CartContext';
import { useSocket } from '../../hooks/useSocket';
import CartButton from '../../components/cart/CartButton';
import CartDrawer from '../../components/cart/CartDrawer';
import CheckoutButton from '../../components/cart/CheckoutButton';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import './MenuPage.css';

const MenuPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);
  const [menuData, setMenuData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortBy, setSortBy] = useState('');
  const [ordersExpanded, setOrdersExpanded] = useState(false);

  // Context data
  const {
    addToCart, table, setTable, error: cartError, clearError,
    activeOrders, token: contextToken, refreshActiveOrder
  } = useCart();

  const { joinRoom, on, off, isConnected } = useSocket();
  const urlToken = searchParams.get('token');
  const token = urlToken || contextToken;

  useEffect(() => {
    const isRoot = window.location.pathname === '/';

    if (isRoot) {
      setErrorStatus('Welcome! Please scan a QR code.');
      setLoading(false);
      return;
    }

    const fetchMenu = async () => {
      if (!token && !table?.id) {
        setErrorStatus('Please scan a QR code to view the menu.');
        setLoading(false);
        return;
      }

      try {
        const url = token ? `/api/menu?token=${token}` : `/api/menu?tableId=${table.id}`;
        const response = await axios.get(url);
        const data = response.data;
        setMenuData(data);

        if (data.table && (!table || table.id !== data.table.id)) {
          setTable(data.table.id, data.table.tableNumber, data.table.qrToken);
        }
      } catch (err) {
        setErrorStatus(err.response?.data?.message || 'Unauthorized access');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [token, table, setTable]);

  // WebSocket: Listen for order updates
  useEffect(() => {
    if (table?.id && isConnected && activeOrders && activeOrders.length > 0) {
      activeOrders.forEach(order => {
        joinRoom('order', order.id);
      });

      const handleOrderStatusUpdated = () => {
        if (refreshActiveOrder) {
          refreshActiveOrder(table.id);
        }
      };

      on('order:statusUpdated', handleOrderStatusUpdated);

      return () => {
        off('order:statusUpdated', handleOrderStatusUpdated);
      };
    }
  }, [table?.id, isConnected, activeOrders, joinRoom, on, off, refreshActiveOrder]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{ marginTop: '15px', color: '#666' }}>Creating your menu...</p>
      </div>
    );
  }

  if (errorStatus) {
    return (
      <div className="guest-landing">
        <div className="landing-content">
          <div className="landing-icon">🍽️</div>
          <h1>{t('menu.welcomeMessage')}</h1>
          <p className="landing-message">{t('menu.scanQR')}</p>
          <div className="staff-access">
            <span>{t('auth.staffMember')} </span>
            <button onClick={() => navigate('/login')}>{t('auth.loginHere')}</button>
          </div>
        </div>
      </div>
    );
  }

  if (!menuData) return null;

  const { categories, menuItems, table: tableFromApi } = menuData;
  const activeCategoryIds = new Set(categories.filter(cat => cat.status === 'ACTIVE').map(c => c.id));

  const categoryFilteredItems = menuItems.filter(item => {
    const belongsToActiveCategory = activeCategoryIds.has(item.categoryId);
    const matchesCategory = selectedCategory === 'All' || item.categoryId === selectedCategory;
    return belongsToActiveCategory && matchesCategory;
  });

  let filteredItems;
  if (searchTerm.trim()) {
    const fuse = new Fuse(categoryFilteredItems, {
      keys: ['name', 'description'],
      threshold: 0.4,
      ignoreLocation: true,
      includeScore: false,
    });

    const fuzzyResults = fuse.search(searchTerm);
    filteredItems = fuzzyResults.map(result => result.item);
  } else {
    filteredItems = categoryFilteredItems;
  }

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'price-asc': return Number(a.price) - Number(b.price);
      case 'price-desc': return Number(b.price) - Number(a.price);
      case 'popularity': return (b.popularityScore || 0) - (a.popularityScore || 0);
      default: return 0;
    }
  });

  const handleAddToOrder = (orderData) => {
    addToCart(orderData);
    setSelectedItem(null);
  };

  const handleItemClick = (item) => setSelectedItem(item);

  return (
    <div className="menu-page">
      {cartError && (
        <div className="error-banner">
          <span>{cartError}</span>
          <button onClick={clearError}>✕</button>
        </div>
      )}

      {activeOrders && activeOrders.length > 0 && (
        <div className="active-orders-banner">
          <div className="banner-toggle" onClick={() => setOrdersExpanded(!ordersExpanded)}>
            <div className="banner-toggle-content">
              <span><strong>{activeOrders.length}</strong> {activeOrders.length > 1 ? t('menu.activeOrders') : t('menu.activeOrder')}</span>
              <button className="toggle-btn">{ordersExpanded ? `▲ ${t('menu.hide')}` : `▼ ${t('menu.show')}`}</button>
            </div>
          </div>
          {ordersExpanded && (
            <div className="orders-list">
              {activeOrders.map(order => (
                <div key={order.id} className="banner-content">
                  <div className="order-info">
                    <span className="order-number">{t('orderTracking.orderNumber')}: <strong>#{order.orderNumber}</strong></span>
                    <span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span>
                  </div>
                  <div className="order-actions">
                    <button className="banner-btn" onClick={() => navigate(`/order-status/${order.id}`)}>
                      {t('menu.view')} →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <header className="menu-header-banner">
        <h1>{tableFromApi?.restaurantName || 'Smart Restaurant'}</h1>
        <div className="table-info-pill">
          <span>{t('menu.table')} {table?.tableNumber || tableFromApi?.tableNumber}</span>
        </div>
      </header>

      <div className="search-sticky">
        <div className="search-input-wrapper">
          <input type="text" placeholder={t('menu.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div>
          <LanguageSwitcher />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
          <option value="">{t('menu.sortBy')}</option>
          <option value="name-asc">{t('menu.sortNameAsc')}</option>
          <option value="price-asc">{t('menu.sortPriceAsc')}</option>
          <option value="popularity">{t('menu.sortPopularity')}</option>
        </select>
      </div>

      <nav className="category-nav">
        <button className={`category-tab ${selectedCategory === 'All' ? 'active' : ''}`} onClick={() => setSelectedCategory('All')}>{t('common.all')}</button>
        {categories.map(cat => (
          <button key={cat.id} className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`} onClick={() => setSelectedCategory(cat.id)}>{cat.name}</button>
        ))}
      </nav>

      <main className="menu-grid">
        {sortedItems.map(item => {
          const primaryPhoto = item.photos?.find(p => p.isPrimary) || item.photos?.[0];
          return (
            <div key={item.id} className="item-card" onClick={() => handleItemClick(item)}>
              {primaryPhoto ? (
                <img src={primaryPhoto.url} alt={item.name} className="item-img" />
              ) : (
                <div className="item-placeholder">🍽️</div>
              )}
              {item.isPopular && (
                <div className="popular-tag">
                  <span className="popular-badge">{t('menu.popularity')}</span>
                </div>
              )}
              <div className="item-details">
                <div className="item-name">{item.name}</div>
                {item.description && <div className="item-desc">{item.description}</div>}
                <div className="item-footer">
                  <span className="item-price">${Number(item.price).toFixed(2)}</span>
                  <button className="add-btn">+</button>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      <CheckoutButton />
      <CartButton />
      <CartDrawer />

      {selectedItem && (
        <OrderItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToOrder={handleAddToOrder}
        />
      )}
    </div>
  );
};

export default MenuPage;
