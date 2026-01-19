import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Fuse from 'fuse.js';
import OrderItemModal from '../../components/OrderItemModal';
import { useCart } from '../../contexts/CartContext';
import { useSocket } from '../../hooks/useSocket';
import CartButton from '../../components/cart/CartButton';
import CartDrawer from '../../components/cart/CartDrawer';
import CheckoutButton from '../../components/cart/CheckoutButton';
import './MenuPage.css';

const MenuPage = () => {
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

  // KẾT HỢP: Lấy cart và total từ Context (thay vì orderItems cục bộ)
  const {
    addToCart, table, setTable, error: cartError, clearError,
    activeOrders, token: contextToken, cart, placeOrder, refreshActiveOrder
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

  // WebSocket: Listen for order updates to refresh active orders banner
  useEffect(() => {
    if (table?.id && isConnected && activeOrders && activeOrders.length > 0) {
      // Join rooms for all active orders
      activeOrders.forEach(order => {
        joinRoom('order', order.id);
        // Joined order room for updates
      });

      // Listen for order status updates
      const handleOrderStatusUpdated = (data) => {
        // Order status updated
        // Refresh active orders to update the banner
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
          <h1>Welcome!</h1>
          <p className="landing-message">To view our menu and place an order, please scan the QR code.</p>
          <div className="staff-access">
            <span>Staff member? </span>
            <button onClick={() => navigate('/login')}>Login here</button>
          </div>
        </div>
      </div>
    );
  }

  if (!menuData) return null;

  const { categories, menuItems, table: tableFromApi } = menuData;
  const activeCategoryIds = new Set(categories.filter(cat => cat.status === 'ACTIVE').map(c => c.id));

  // Filter by category and active status first
  const categoryFilteredItems = menuItems.filter(item => {
    const belongsToActiveCategory = activeCategoryIds.has(item.categoryId);
    const matchesCategory = selectedCategory === 'All' || item.categoryId === selectedCategory;
    return belongsToActiveCategory && matchesCategory;
  });

  // Apply fuzzy search if there's a search term
  let filteredItems;
  if (searchTerm.trim()) {
    // Configure Fuse.js for fuzzy search
    const fuse = new Fuse(categoryFilteredItems, {
      keys: ['name', 'description'],
      threshold: 0.4, // 0.0 = exact match, 1.0 = match anything
      ignoreLocation: true,
      includeScore: false,
    });

    // Perform fuzzy search and extract items
    const fuzzyResults = fuse.search(searchTerm);
    filteredItems = fuzzyResults.map(result => result.item);
  } else {
    // No search term - show all category-filtered items
    filteredItems = categoryFilteredItems;
  }


  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'price-asc': return Number(a.price) - Number(b.price);
      case 'price-desc': return Number(b.price) - Number(a.price);
      default: return 0;
    }
  });

  const handleAddToOrder = (orderData) => {
        addToCart(orderData);
      setSelectedItem(null);
  };

  const handleItemClick = (item) => setSelectedItem(item);

      // Place order from cart


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
                <span><strong>{activeOrders.length}</strong> Active Order{activeOrders.length > 1 ? 's' : ''}</span>
                <button className="toggle-btn">{ordersExpanded ? '▲ Hide' : '▼ Show'}</button>
              </div>
            </div>
            {ordersExpanded && (
              <div className="orders-list">
                {activeOrders.map(order => (
                  <div key={order.id} className="banner-content">
                    <div className="order-info">
                      <span className="order-number">Order: <strong>#{order.orderNumber}</strong></span>
                      <span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span>
                    </div>
                    <div className="order-actions">
                      <button className="banner-btn" onClick={() => navigate(`/order-status/${order.id}`)}>
                        View →
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
            <span>Table {table?.tableNumber || tableFromApi?.tableNumber}</span>
          </div>
        </header>

        <div className="search-sticky">
          <div className="search-input-wrapper">
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
            <option value="">Sort by</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="price-asc">Price (Low-High)</option>
          </select>
        </div>

        <nav className="category-nav">
          <button className={`category-tab ${selectedCategory === 'All' ? 'active' : ''}`} onClick={() => setSelectedCategory('All')}>All</button>
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
