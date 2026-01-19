import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Fuse from 'fuse.js';
import Sidebar from '../../components/Sidebar';
import ItemModal from '../../components/ItemModal';

const AdminItemPage = () => {
  // State for data
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for filters & pagination
  const [page, setPage] = useState(1);
  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('name_asc'); // name_asc, name_desc, price_asc, price_desc, status_asc, status_desc

  // State for modal
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // 1. Fetch Categories (cho dropdown)
  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/admin/menu/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // 2. Fetch Items (without search - we'll do fuzzy search client-side)
  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {
        page: 1,
        limit: 1000, // Fetch all items for client-side search
        categoryId: filterCategory || undefined,
        status: filterStatus || undefined,
        sort: sortBy
      };

      const res = await axios.get('/api/admin/menu/items', { params });
      setItems(res.data.data);
    } catch (error) {
      console.error('Error fetching items:', error);
      alert('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  // Client-side fuzzy search
  const filteredItems = useMemo(() => {
    if (!filterName.trim()) {
      return items;
    }

    const fuse = new Fuse(items, {
      keys: ['name', 'description'],
      threshold: 0.4,
      ignoreLocation: true,
    });

    const results = fuse.search(filterName);
    return results.map(result => result.item);
  }, [items, filterName]);

  // Client-side pagination
  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, page]);

  const totalPages = Math.ceil(filteredItems.length / 10);

  // Load data on mount & when filters change
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchItems();
    setPage(1); // Reset to page 1 when filters change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterStatus, sortBy]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to page 1 when searching
  };

  // Handlers
  const handleAddItem = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`/api/admin/menu/items/${id}`);
      fetchItems();
      alert('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const handleSaveItem = async (formData, selectedModifierGroups) => {
    try {
      // Handle refresh-only mode (when PhotoManager updates)
      if (formData.refreshOnly) {
        const res = await axios.get(`/api/admin/menu/items/${editingItem.id}`);
        setEditingItem(res.data);
        return; // Don't close modal or refresh list
      }

      if (editingItem) {
        await axios.patch(`/api/admin/menu/items/${editingItem.id}`, formData);

        // Attach modifier groups
        if (selectedModifierGroups && selectedModifierGroups.length > 0) {
          // Updating item with modifiers
          await axios.post(`/api/admin/menu/items/${editingItem.id}/modifier-groups`, {
            groupIds: selectedModifierGroups
          });
        }

        alert('Item updated successfully');
      } else {
        const { initialPhotos, primaryPhotoIndex, ...itemData } = formData;
        const res = await axios.post('/api/admin/menu/items', itemData);

        // Attach modifier groups to new item
        if (selectedModifierGroups && selectedModifierGroups.length > 0) {
          // Creating item with modifiers
          await axios.post(`/api/admin/menu/items/${res.data.id}/modifier-groups`, {
            groupIds: selectedModifierGroups
          });
        }

        // If there are photos to upload for the new item
        if (initialPhotos && initialPhotos.length > 0) {
          const photoFormData = new FormData();
          initialPhotos.forEach(file => {
            photoFormData.append('files', file);
          });

          const uploadRes = await axios.post(`/api/admin/menu/items/${res.data.id}/photos`, photoFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          // Set primary if selected
          if (primaryPhotoIndex !== undefined && primaryPhotoIndex >= 0) {
            const photoId = uploadRes.data.photos[primaryPhotoIndex].id;
            await axios.patch(`/api/admin/menu/items/${res.data.id}/photos/${photoId}/primary`);
          }
        }

        alert('Item created successfully');
      }
      setShowModal(false);
      fetchItems();
    } catch (error) {
      console.error('Error saving item:', error);
      alert(error.response?.data?.message || 'Failed to save item');
    }
  };

  // Helper render status badge
  const renderStatus = (status) => {
    let className = 'status-badge';
    if (status === 'AVAILABLE') className += ' active'; // active ~ green
    if (status === 'SOLDOUT') className += ' inactive'; // inactive ~ red/pink
    if (status === 'UNAVAILABLE') className += ' preparing'; // preparing ~ yellow

    // Format display text
    let displayText = status;
    if (status === 'SOLDOUT') displayText = 'SOLD OUT';

    return (
      <span className={className}>
        {displayText}
      </span>
    );
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">

        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="page-title">Menu Items</h1>
            <p className="page-subtitle">Manage food and drinks</p>
          </div>
          <button className="btn-primary" onClick={handleAddItem}>
            + Add New Item
          </button>
        </div>

        {/* Filter Bar */}
        <div className="table-card" style={{ marginBottom: '20px', padding: '15px' }}>
          <form onSubmit={handleSearch} className="filters-bar" style={{ margin: 0 }}>
            <div className="search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search items..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="SOLDOUT">Sold Out</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </select>

            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name_asc">Name: A-Z</option>
              <option value="name_desc">Name: Z-A</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="status_asc">Status: A-Z</option>
              <option value="status_desc">Status: Z-A</option>
            </select>

            <button type="submit" className="btn-secondary" style={{ padding: '8px 16px' }}>
              Search
            </button>
          </form>
        </div>

        {/* Data Table */}
        <div className="table-card">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Loading items...</div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Prep Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>
                        No items found.
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map(item => {
                      const primaryPhoto = item.photos?.find(p => p.isPrimary) || item.photos?.[0];

                      return (
                        <tr key={item.id}>
                          <td>
                            {primaryPhoto ? (
                              <img
                                src={primaryPhoto.url}
                                alt={item.name}
                                style={{
                                  width: '60px',
                                  height: '60px',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  border: '1px solid #e0e0e0'
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '60px',
                                height: '60px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '8px',
                                fontSize: '28px',
                                border: '1px solid #e0e0e0'
                              }}>
                                🍽️
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: '600' }}>{item.name}</div>
                            {item.isChefRecommended && (
                              <span style={{ fontSize: '12px', color: '#e67e22' }}>
                                ⭐ Chef Recommended
                              </span>
                            )}
                          </td>
                          <td>{item.category?.name || 'Uncategorized'}</td>
                          <td style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                            ${Number(item.price).toFixed(2)}
                          </td>
                          <td>{renderStatus(item.status)}</td>
                          <td>{item.prepTimeMinutes} min</td>
                          <td>
                            <button
                              className="action-btn"
                              title="Edit"
                              onClick={() => handleEditItem(item)}
                            >
                              ✎
                            </button>
                            <button
                              className="action-btn"
                              title="Delete"
                              style={{ color: '#e74c3c' }}
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  &laquo; Prev
                </button>
                <span className="page-info">
                  Page {page} of {totalPages || 1}
                </span>
                <button
                  className="page-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next &raquo;
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <ItemModal
          item={editingItem}
          categories={categories}
          onSave={handleSaveItem}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default AdminItemPage;
