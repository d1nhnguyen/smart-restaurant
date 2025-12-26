import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import OrderItemModal from '../components/OrderItemModal';
import './MenuPage.css';

const MenuPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuData, setMenuData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [orderItems, setOrderItems] = useState([]);

  const token = searchParams.get('token');

  useEffect(() => {
    const fetchMenu = async () => {
      // For demo purposes if no token, you might want to show a general menu or an error
      if (!token) {
        setError('Please scan a QR code to view the menu.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`/api/menu?token=${token}`);
        setMenuData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Unauthorized access');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [token]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{ marginTop: '15px', color: '#666' }}>Creating your menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container">
        <div style={{ fontSize: '50px' }}>🍽️</div>
        <h2 style={{ margin: '20px 0 10px' }}>Welcome!</h2>
        <p style={{ color: '#666', padding: '0 40px', textAlign: 'center' }}>
          {error}
        </p>
        <button
          onClick={() => navigate('/login')}
          style={{
            marginTop: '20px',
            padding: '12px 30px',
            fontSize: '16px',
            fontWeight: '600',
            color: '#fff',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
          }}
        >
          Login
        </button>
      </div>
    );
  }

  const { table, categories, menuItems } = menuData;

  // Create a set of active category IDs for quick lookup (defense-in-depth)
  const activeCategoryIds = new Set(
    categories.filter(cat => cat.status === 'ACTIVE').map(c => c.id)
  );

  const filteredItems = menuItems.filter(item => {
    const belongsToActiveCategory = activeCategoryIds.has(item.categoryId);
    const matchesCategory = selectedCategory === 'All' || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return belongsToActiveCategory && matchesCategory && matchesSearch;
  });



  const handleAddToOrder = (orderData) => {
    setOrderItems(prev => [...prev, { ...orderData, id: Date.now() }]);
    setSelectedItem(null);
    alert('Item added to order!');
  };

  const handleItemClick = (item) => {
    console.log('Selected item:', item);
    console.log('Modifier groups:', item.modifierGroups);
    setSelectedItem(item);
  };

  return (
    <div className="menu-page">
      {/* 1. Brand Banner */}
      <header className="menu-header-banner">
        <h1>{table.restaurantName || 'Smart Restaurant'}</h1>
        <div className="table-info-pill">
          <span>Table {table.tableNumber}</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span>{table.location || 'Main Hall'}</span>
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
        {filteredItems.map(item => {
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

        {filteredItems.length === 0 && (
          <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '60px 20px', color: '#999' }}>
            <p style={{ fontSize: '40px' }}>🔍</p>
            <p>No items found. Try another search!</p>
          </div>
        )}
      </main>

      {/* Footer Info */}
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
