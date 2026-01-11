import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import OrderItemModal from '../components/OrderItemModal';
import { useCart } from '../contexts/CartContext';
import CartButton from '../components/cart/CartButton';
import CartDrawer from '../components/cart/CartDrawer';
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

  const { addToCart, table, setTable, error: cartError, clearError, activeOrder, token: contextToken } = useCart();

  const urlToken = searchParams.get('token');
  const token = urlToken || contextToken;

  useEffect(() => {
    const fetchMenu = async () => {
      // Priority: use token from URL, but if missing, allow viewing if table info is in context
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

        // Sync table info to context if it came from a token or is different
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
  }, [token, table?.id, setTable]);

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
          <p className="landing-message">
            To view our menu and place an order, please scan the QR code on your table.
          </p>

          <div className="scan-instructions">
            <div className="instruction-step">
              <span className="step-icon">📱</span>
              <span>Open your camera app</span>
            </div>
            <div className="instruction-step">
              <span className="step-icon">🎯</span>
              <span>Point at the QR code on your table</span>
            </div>
            <div className="instruction-step">
              <span className="step-icon">👆</span>
              <span>Tap the link that appears</span>
            </div>
          </div>

          <div className="qr-visual">
            <div className="qr-placeholder">
              <span>📷</span>
            </div>
            <p>Look for this on your table</p>
          </div>

          <div className="staff-access">
            <span>Staff member? </span>
            <button onClick={() => navigate('/login')}>Login here</button>
          </div>
        </div>
      </div>
    );
  }

  const { categories, menuItems, table: tableFromApi } = menuData;

  // Create a set of active category IDs for quick lookup
  const activeCategoryIds = new Set(
    categories.filter(cat => cat.status === 'ACTIVE').map(c => c.id)
  );

  const filteredItems = menuItems.filter(item => {
    const belongsToActiveCategory = activeCategoryIds.has(item.categoryId);
    const matchesCategory = selectedCategory === 'All' || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return belongsToActiveCategory && matchesCategory && matchesSearch;
  });

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

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  return (
    <div className="menu-page">
      {/* Expiry / Cart Error Banner */}
      {cartError && (
        <div className="error-banner">
          <span>{cartError}</span>
          <button onClick={clearError}>✕</button>
        </div>
      )}

      {/* Active Order Banner */}
      {activeOrder && (
        <div className="active-order-banner">
          <div className="banner-content">
            <div className="banner-info">
              <span className="banner-icon">📋</span>
              <span>Active Order: <strong>#{activeOrder.orderNumber}</strong></span>
              <span className={`status-chip ${activeOrder.status.toLowerCase()}`}>
                {activeOrder.status}
              </span>
            </div>
            <button
              className="banner-btn"
              onClick={() => navigate(`/order-status/${activeOrder.id}`)}
            >
              View Order →
            </button>
          </div>
        </div>
      )}

      {/* 1. Brand Banner */}
      <header className="menu-header-banner">
        <h1>{tableFromApi?.restaurantName || 'Smart Restaurant'}</h1>
        <div className="table-info-pill">
          <span>Table {table?.tableNumber || tableFromApi?.tableNumber}</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span>{table?.location || tableFromApi?.location || 'Main Hall'}</span>
        </div>
      </header>

      {/* 2. Sticky Search & Filter */}
      <div className="search-sticky">
        <div className="search-input-wrapper">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search favorites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-select"
        >
          <option value="">Sort by</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="price-asc">Price (Low-High)</option>
          <option value="price-desc">Price (High-Low)</option>
        </select>
      </div>

      {/* 3. Category Scrolling Tabs */}
      <nav className="category-nav">
        <button
          className={`category-tab ${selectedCategory === 'All' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('All')}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </nav>

      {/* 4. Menu Grid */}
      <main className="menu-grid">
        {sortedItems.map(item => {
          const primaryPhoto = item.photos?.find(p => p.isPrimary) || item.photos?.[0];

          return (
            <div key={item.id} className="item-card" onClick={() => handleItemClick(item)}>
              {primaryPhoto ? (
                <img src={primaryPhoto.url} alt={item.name} className="item-img" />
              ) : (
                <div className="item-placeholder">🍕</div>
              )}

              <div className="item-details">
                <div>
                  <div className="item-name">{item.name}</div>
                  <p className="item-desc">{item.description}</p>
                </div>

                <div className="item-footer">
                  <span className="item-price">${Number(item.price).toFixed(2)}</span>
                  <button className="add-btn" onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}>+</button>
                </div>
              </div>
            </div>
          );
        })}

        {sortedItems.length === 0 && (
          <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '60px 20px', color: '#999' }}>
            <p style={{ fontSize: '40px' }}>🔍</p>
            <p>No items found. Try another search!</p>
          </div>
        )}
      </main>

      {/* Cart Button & Drawer */}
      <CartButton />
      <CartDrawer />

      <footer style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.5, fontSize: '12px' }}>
        Smart Restaurant System • Digital Menu
      </footer>

      {/* Order Item Modal */}
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
