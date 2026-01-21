import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Fuse from 'fuse.js';
import { useTranslation } from 'react-i18next';
import OrderItemModal from '../../../components/OrderItemModal';
import { useCart } from '../../../contexts/CartContext';
import { useSocket } from '../../../hooks/useSocket';
import { getImageUrl } from '../../../utils/imageUrl';
import './MenuTab.css';

const MenuTab = () => {
  const { t } = useTranslation();
  useSearchParams();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tableInfo, setTableInfo] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');

  const [selectedItem, setSelectedItem] = useState(null);

  // Intersection Observer ref for infinite scroll
  const observerTarget = useRef(null);

  const {
    addToCart, table, setTable, error: cartError, clearError,
    refreshActiveOrder
  } = useCart();

  const { joinRoom, on, off, isConnected } = useSocket();
  const { activeOrders } = useCart();

  // Fetch menu data with pagination
  const fetchMenu = useCallback(async (pageNum = 1, append = false) => {
    if (!table?.id) {
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
        tableId: table.id,
        page: pageNum.toString(),
        limit: '8',
      });

      if (selectedCategory && selectedCategory !== 'All') {
        params.set('categoryId', selectedCategory);
      }
      if (sortBy) {
        params.set('sort', sortBy);
      }

      const response = await axios.get(`/api/menu?${params.toString()}`);
      const data = response.data;

      if (append) {
        setMenuItems(prev => [...prev, ...data.menuItems]);
      } else {
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
      setErrorStatus(err.response?.data?.message || 'Failed to load menu');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [table, selectedCategory, sortBy, setTable]);

  // Initial load and filter changes
  useEffect(() => {
    if (table?.id) {
      setPage(1);
      setMenuItems([]);
      fetchMenu(1, false);
    }
  }, [table?.id, selectedCategory, sortBy, fetchMenu]);

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
        threshold: 0.5,
        rootMargin: '0px'
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [page, hasMore, loadingMore, loading, fetchMenu]);

  // Client-side fuzzy search with Fuse.js
  const getFilteredItems = () => {
    const categoryFiltered = selectedCategory === 'All'
      ? menuItems
      : menuItems.filter(item => item.categoryId === selectedCategory);

    if (searchTerm.trim()) {
      const fuse = new Fuse(categoryFiltered, {
        keys: ['name', 'description'],
        threshold: 0.4,
        ignoreLocation: true,
        includeScore: false,
      });
      const results = fuse.search(searchTerm);
      return results.map(result => result.item);
    }

    const sorted = [...categoryFiltered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'price-asc': return Number(a.price) - Number(b.price);
        case 'price-desc': return Number(b.price) - Number(a.price);
        case 'popularity': return (b.popularityScore || 0) - (a.popularityScore || 0);
        default: return 0;
      }
    });

    return sorted;
  };

  const displayItems = getFilteredItems();

  const handleAddToOrder = (orderData) => {
    addToCart(orderData);
    setSelectedItem(null);
  };

  const handleItemClick = (item) => setSelectedItem(item);

  if (loading && menuItems.length === 0) {
    return (
      <div className="menu-tab-loading">
        <div className="loading-spinner"></div>
        <p>{t('common.loading', 'Loading menu...')}</p>
      </div>
    );
  }

  if (errorStatus) {
    return (
      <div className="menu-tab-error">
        <div className="error-icon">
          <span role="img" aria-label="error">&#128533;</span>
        </div>
        <p>{errorStatus}</p>
      </div>
    );
  }

  return (
    <div className="menu-tab">
      {cartError && (
        <div className="error-banner">
          <span>{cartError}</span>
          <button onClick={clearError}>
            <span role="img" aria-label="close">&#10005;</span>
          </button>
        </div>
      )}

      {/* Header */}
      <header className="menu-tab-header">
        <div className="header-left">
          <span className="restaurant-icon" role="img" aria-label="restaurant">&#127869;</span>
          <h1>{tableInfo?.restaurantName || 'Smart Restaurant'}</h1>
        </div>
        <div className="table-badge">
          {t('menu.table', 'Table')} {table?.tableNumber || tableInfo?.tableNumber}
        </div>
      </header>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-input-wrapper">
          <span className="search-icon" role="img" aria-label="search">&#128269;</span>
          <input
            type="text"
            placeholder={t('menu.searchPlaceholder', 'Search menu...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            inputMode="search"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <span role="img" aria-label="clear">&#10005;</span>
            </button>
          )}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-select"
        >
          <option value="">{t('menu.sortBy', 'Sort')}</option>
          <option value="name-asc">{t('menu.sortNameAsc', 'Name A-Z')}</option>
          <option value="price-asc">{t('menu.sortPriceAsc', 'Price Low-High')}</option>
          <option value="popularity">{t('menu.sortPopularity', 'Popular')}</option>
        </select>
      </div>

      {/* Category Tabs */}
      <nav className="category-tabs">
        <button
          className={`category-tab ${selectedCategory === 'All' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('All')}
        >
          {t('common.all', 'All')}
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

      {/* Menu Items Grid */}
      <main className="menu-items-grid">
        {displayItems.map(item => {
          const primaryPhoto = item.photos?.find(p => p.isPrimary) || item.photos?.[0];
          const isAvailable = item.status === 'AVAILABLE';

          return (
            <div
              key={item.id}
              className={`menu-item-card ${item.isChefRecommended ? 'chef-pick' : ''} ${!isAvailable ? 'unavailable' : ''}`}
              onClick={() => isAvailable && handleItemClick(item)}
            >
              <div className="item-image-container">
                {primaryPhoto ? (
                  <img src={getImageUrl(primaryPhoto.url)} alt={item.name} className="item-image" loading="lazy" />
                ) : (
                  <div className="item-placeholder">
                    <span role="img" aria-label="food">&#127869;</span>
                  </div>
                )}
                {item.isChefRecommended && (
                  <div className="chef-badge">
                    <span role="img" aria-label="chef">&#11088;</span> {t('menu.chefPick', "Chef's Pick")}
                  </div>
                )}
                {!isAvailable && (
                  <div className="unavailable-overlay">
                    <span>{item.status === 'SOLDOUT' ? t('menu.soldOut', 'Sold Out') : t('menu.unavailable', 'Unavailable')}</span>
                  </div>
                )}
              </div>
              <div className="item-info">
                <h3 className="item-name">{item.name}</h3>
                {item.description && (
                  <p className="item-description">{item.description}</p>
                )}
                <div className="item-footer">
                  <span className="item-price">${Number(item.price).toFixed(2)}</span>
                  {isAvailable && (
                    <button className="add-button" onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}>
                      <span>+</span>
                    </button>
                  )}
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
                <div className="loading-spinner-small"></div>
                <span>{t('common.loadingMore', 'Loading more...')}</span>
              </div>
            )}
          </div>
        )}

        {/* End of list */}
        {!hasMore && displayItems.length > 0 && (
          <div className="end-of-list">
            <p>{t('menu.endOfMenu', "You've reached the end of the menu")}</p>
          </div>
        )}

        {/* Empty state */}
        {displayItems.length === 0 && !loading && (
          <div className="empty-state">
            <span className="empty-icon" role="img" aria-label="empty">&#128269;</span>
            <p>{t('menu.noItems', 'No items found')}</p>
          </div>
        )}
      </main>

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

export default MenuTab;
