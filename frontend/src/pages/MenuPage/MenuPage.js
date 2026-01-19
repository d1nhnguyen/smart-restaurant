import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tableInfo, setTableInfo] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Get filter state from URL or defaults
  const getURLParam = (key, defaultValue = '') => {
    return searchParams.get(key) || defaultValue;
  };

  const [selectedCategory, setSelectedCategory] = useState(getURLParam('category', 'All'));
  const [searchTerm, setSearchTerm] = useState(getURLParam('search', ''));
  const [sortBy, setSortBy] = useState(getURLParam('sort', ''));

  const [selectedItem, setSelectedItem] = useState(null);
  const [ordersExpanded, setOrdersExpanded] = useState(false);

  // Intersection Observer ref for infinite scroll
  const observerTarget = React.useRef(null);

  // KẾT HỢP: Lấy cart và total từ Context (thay vì orderItems cục bộ)
  // Context data
  const {
    addToCart, table, setTable, error: cartError, clearError,
    activeOrders, token: contextToken, refreshActiveOrder
  } = useCart();

  const { joinRoom, on, off, isConnected } = useSocket();
  const urlToken = searchParams.get('token');
  const token = urlToken || contextToken;

  // Update URL when filters change
  const updateURL = (updates) => {
    const newParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'All') {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    // Always preserve token
    if (token) {
      newParams.set('token', token);
    }

    setSearchParams(newParams);
  };

  // Fetch menu data with pagination - wrapped in useCallback for stable reference
  const fetchMenu = React.useCallback(async (pageNum = 1, append = false) => {
    if (!token && !table?.id) {
      setErrorStatus('Please scan a QR code to view the menu.');
      setLoading(false);
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        ...(token ? { token } : { tableId: table.id }),
        page: pageNum.toString(),
        limit: '8',
      });

      // Add filters if present
      if (selectedCategory && selectedCategory !== 'All') {
        params.set('categoryId', selectedCategory);
      }
      if (searchTerm) {
        params.set('search', searchTerm);
      }
      if (sortBy) {
        params.set('sort', sortBy);
      }

      const response = await axios.get(`/api/menu?${params.toString()}`);
      const data = response.data;

      if (append) {
        // Append new items for infinite scroll
        setMenuItems(prev => [...prev, ...data.menuItems]);
      } else {
        // Replace items for new search/filter
        setMenuItems(data.menuItems);
        setCategories(data.categories || []);
        setTableInfo(data.table);

        if (data.table && (!table || table.id !== data.table.id)) {
          setTable(data.table.id, data.table.tableNumber, data.table.qrToken);
        }
      }

      setHasMore(data.pagination?.hasMore || false);
      setPage(pageNum);
    } catch (err) {
      setErrorStatus(err.response?.data?.message || 'Unauthorized access');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [token, table, selectedCategory, searchTerm, sortBy, setTable]);

  // Initial load
  useEffect(() => {
    const isRoot = window.location.pathname === '/';

    if (isRoot) {
      setErrorStatus('Welcome! Please scan a QR code.');
      setLoading(false);
      return;
    }

    // Reset pagination and fetch from page 1
    setPage(1);
    setMenuItems([]);
    fetchMenu(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, table?.id, selectedCategory, searchTerm, sortBy]);

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

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!observerTarget.current || !hasMore || loadingMore || loading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchMenu(page + 1, true);
        }
      },
      {
        threshold: 0.5, // Trigger when 50% of sentinel is visible
        rootMargin: '0px' // No pre-loading, wait until actually visible
      }
    );

    observer.observe(observerTarget.current);

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [page, hasMore, loadingMore, loading, fetchMenu]); // Include all necessary dependencies

  // Update URL when filters change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    updateURL({ category });
  };

  const handleSearchChange = (search) => {
    setSearchTerm(search);
    updateURL({ search });
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    updateURL({ sort });
  };

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

  // Display items (already filtered by server)
  const displayItems = menuItems;


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
        <h1>{tableInfo?.restaurantName || 'Smart Restaurant'}</h1>
        <div className="table-info-pill">
          <span>{t('menu.table')} {table?.tableNumber || tableInfo?.tableNumber}</span>
        </div>
      </header>

      <div className="search-sticky">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder={t('menu.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div>
          <LanguageSwitcher />
        </div>
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="sort-select"
        >
          <option value="">{t('menu.sortBy')}</option>
          <option value="name-asc">{t('menu.sortNameAsc')}</option>
          <option value="price-asc">{t('menu.sortPriceAsc')}</option>
          <option value="popularity">{t('menu.sortPopularity')}</option>
        </select>
      </div>

      <nav className="category-nav">
        <button
          className={`category-tab ${selectedCategory === 'All' ? 'active' : ''}`}
          onClick={() => handleCategoryChange('All')}
        >
          {t('common.all')}
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </nav>

      <main className="menu-grid">
        {displayItems.map(item => {
          const primaryPhoto = item.photos?.find(p => p.isPrimary) || item.photos?.[0];
          return (
            <div
              key={item.id}
              className={`item-card ${item.isChefRecommended ? 'chef-recommended' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              {item.isChefRecommended && (
                <div className="chef-badge">
                  <span className="chef-icon">⭐</span>
                  <span className="chef-text">{t('menu.chefPick')}</span>
                </div>
              )}
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

        {/* Infinite Scroll Sentinel */}
        {hasMore && (
          <div ref={observerTarget} className="load-more-trigger">
            {loadingMore && (
              <div className="loading-more">
                <div className="spinner-small"></div>
                <span>Loading more items...</span>
              </div>
            )}
          </div>
        )}

        {/* No more items message */}
        {!hasMore && displayItems.length > 0 && (
          <div className="no-more-items">
            <p>You've reached the end of the menu</p>
          </div>
        )}

        {/* Empty state */}
        {displayItems.length === 0 && !loading && (
          <div className="empty-state">
            <p>No items found</p>
          </div>
        )}
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
