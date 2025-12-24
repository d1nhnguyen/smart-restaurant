import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const MenuPage = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuData, setMenuData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyAndFetchMenu = async () => {
      if (!token) {
        setError('Invalid QR code. No token provided.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`/api/menu?token=${token}`);
        setMenuData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error verifying token:', err);
        setError(
          err.response?.data?.message ||
          'Invalid or expired QR code. Please scan the QR code again or ask staff for assistance.'
        );
        setLoading(false);
      }
    };

    verifyAndFetchMenu();
  }, [token]);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-page">
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <h2>QR Code Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Get unique categories
  const categories = ['All', ...new Set(menuData.menuItems.map(item => item.category))];

  // Filter menu items by category
  const filteredItems = selectedCategory === 'All'
    ? menuData.menuItems
    : menuData.menuItems.filter(item => item.category === selectedCategory);

  // Get food emoji based on category
  const getFoodEmoji = (category, name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('salmon') || lowerName.includes('fish')) return '🐟';
    if (lowerName.includes('salad')) return '🥗';
    if (lowerName.includes('steak') || lowerName.includes('beef')) return '🥩';
    if (lowerName.includes('pasta')) return '🍝';
    if (lowerName.includes('soup')) return '🍲';
    if (lowerName.includes('drink') || lowerName.includes('coffee')) return '☕';
    if (lowerName.includes('dessert') || lowerName.includes('cake')) return '🍰';
    return '🍽️';
  };

  return (
    <div className="menu-page">
      {/* Header */}
      <div className="menu-header">
        <h1>Smart Restaurant</h1>
        <div className="table-info-badge">
          📍 {menuData.table.tableNumber} • {menuData.table.capacity} seats
          {menuData.table.location && ` • ${menuData.table.location}`}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs" style={{
        display: 'flex',
        gap: '8px',
        padding: '16px 20px',
        overflowX: 'auto',
        background: 'white',
        borderBottom: '1px solid #e0e0e0'
      }}>
        {categories.map(category => (
          <button
            key={category}
            className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '20px',
              background: selectedCategory === category ? '#e74c3c' : '#f5f5f5',
              color: selectedCategory === category ? 'white' : '#666',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: selectedCategory === category ? '600' : '400',
              transition: 'all 0.3s'
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <div className="menu-content">
        {filteredItems.map(item => (
          <div
            key={item.id}
            className={`menu-item-card ${!item.available ? 'unavailable' : ''}`}
            style={{ display: 'flex' }}
          >
            <div className="menu-item-image">
              {getFoodEmoji(item.category, item.name)}
            </div>
            <div className="menu-item-content">
              <div className="menu-item-name">{item.name}</div>
              <div className="menu-item-description">{item.description}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="menu-item-price">${item.price.toFixed(2)}</div>
                {!item.available ? (
                  <span className="menu-item-unavailable">Sold Out</span>
                ) : (
                  <button
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            No items found in this category.
          </div>
        )}
      </div>

      {/* Welcome Message */}
      <div style={{
        background: '#e8f8f5',
        padding: '16px 20px',
        margin: '20px',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, color: '#27ae60' }}>
          {menuData.message}
        </p>
      </div>
    </div>
  );
};

export default MenuPage;
