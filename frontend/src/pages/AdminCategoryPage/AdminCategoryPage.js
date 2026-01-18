import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import CategoryModal from '../../components/CategoryModal';

const AdminCategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho Modal
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // 1. Fetch Categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      // Backend service của bạn đã include _count items
      const res = await axios.get('/api/admin/menu/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 2. Handlers
  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  const handleEditCategory = (cat) => {
    setEditingCategory(cat);
    setShowModal(true);
  };

  const handleSaveCategory = async (formData) => {
    try {
      if (editingCategory) {
        // Update
        await axios.patch(`/api/admin/menu/categories/${editingCategory.id}`, formData);
        alert('Category updated successfully');
      } else {
        // Create
        await axios.post('/api/admin/menu/categories', formData);
        alert('Category created successfully');
      }
      setShowModal(false);
      fetchCategories(); // Reload list
    } catch (error) {
      console.error('Error saving category:', error);
      // Hiển thị lỗi từ backend (ví dụ: trùng tên)
      alert(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleToggleStatus = async (cat) => {
    const newStatus = cat.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      // Gọi endpoint updateStatus riêng biệt
      await axios.patch(`/api/admin/menu/categories/${cat.id}/status`, { status: newStatus });
      fetchCategories();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure? This category can only be deleted if it has no items.")) return;
    try {
      await axios.delete(`/api/admin/menu/categories/${id}`);
      fetchCategories();
      alert('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(error.response?.data?.message || "Cannot delete category");
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">

        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="page-title">Menu Categories</h1>
            <p className="page-subtitle">Organize your menu items</p>
          </div>
          <button className="btn-primary" onClick={handleAddCategory}>
            + Add Category
          </button>
        </div>

        {/* Data Table */}
        <div className="table-card">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
          ) : categories.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              No categories found.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>Order</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'center' }}>Items</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                      {cat.displayOrder}
                    </td>
                    <td style={{ fontWeight: '600', fontSize: '15px' }}>
                      {cat.name}
                    </td>
                    <td style={{ color: '#666', fontSize: '14px' }}>
                      {cat.description || '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="tab-count" style={{ fontSize: '12px' }}>
                        {cat._count?.items || 0}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${cat.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                        {cat.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="action-btn"
                        title="Edit"
                        onClick={() => handleEditCategory(cat)}
                      >
                        ✎
                      </button>
                      <button
                        className="action-btn"
                        title="Delete"
                        onClick={() => handleDeleteCategory(cat.id)}
                        style={{ marginLeft: '10px', color: '#e74c3c' }}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <CategoryModal
          category={editingCategory}
          onSave={handleSaveCategory}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default AdminCategoryPage;
