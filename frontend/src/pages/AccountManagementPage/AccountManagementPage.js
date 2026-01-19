import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import UserModal from '../../components/UserModal';

const AccountManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for filters & pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');

  // State for modal
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Fetch Users
  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: filterSearch,
        role: filterRole || undefined,
        isActive: filterStatus === '' ? undefined : filterStatus === 'true',
        sort: sortBy,
      };

      const res = await axios.get('/api/users', { params });
      setUsers(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, filterSearch, filterRole, filterStatus, sortBy]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // Handlers
  const handleAddUser = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleSaveUser = async (formData) => {
    try {
      if (editingUser) {
        // Update
        await axios.patch(`/api/users/${editingUser.id}`, formData);
        alert('User updated successfully');
      } else {
        // Create
        await axios.post('/api/users', formData);
        alert('User created successfully');
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      alert(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = !user.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      await axios.patch(`/api/users/${user.id}/status`, { isActive: newStatus });
      fetchUsers();
      alert(`User ${action}d successfully`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update user status');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      await axios.delete(`/api/users/${id}`);
      fetchUsers();
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  // Helper render status badge
  const renderStatus = (isActive) => {
    return (
      <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  // Helper render role badge
  const renderRole = (role) => {
    let className = 'status-badge';
    if (role === 'ADMIN') className += ' admin-badge';
    if (role === 'STAFF') className += ' preparing';
    if (role === 'WAITER') className += ' ready';

    return <span className={className}>{role}</span>;
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-content">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="page-title">Account Management</h1>
            <p className="page-subtitle">Manage staff and waiter accounts</p>
          </div>
          <button className="btn-primary" onClick={handleAddUser}>
            + Add New User
          </button>
        </div>

        {/* Filter Bar */}
        <div className="table-card" style={{ marginBottom: '20px', padding: '15px' }}>
          <form onSubmit={handleSearch} className="filters-bar" style={{ margin: 0 }}>
            <div className="search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={filterRole}
              onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="STAFF">Staff</option>
              <option value="WAITER">Waiter</option>
            </select>

            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name_asc">Name: A-Z</option>
              <option value="name_desc">Name: Z-A</option>
              <option value="email_asc">Email: A-Z</option>
              <option value="email_desc">Email: Z-A</option>
              <option value="role_asc">Role: A-Z</option>
              <option value="role_desc">Role: Z-A</option>
            </select>

            <button type="submit" className="btn-secondary" style={{ padding: '8px 16px' }}>
              Search
            </button>
          </form>
        </div>

        {/* Data Table */}
        <div className="table-card">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Loading users...</div>
          ) : (
            <>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      users.map(user => (
                        <tr key={user.id}>
                          <td>
                            <div style={{ fontWeight: '600' }}>{user.name || 'N/A'}</div>
                          </td>
                          <td>{user.email}</td>
                          <td>{renderRole(user.role)}</td>
                          <td>{renderStatus(user.isActive)}</td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button
                              className="action-btn"
                              title="Edit"
                              onClick={() => handleEditUser(user)}
                              disabled={user.role === 'ADMIN'}
                            >
                              ✎
                            </button>
                            <button
                              className="action-btn"
                              title={user.isActive ? 'Deactivate' : 'Activate'}
                              onClick={() => handleToggleStatus(user)}
                              style={{ color: user.isActive ? '#f39c12' : '#27ae60' }}
                              disabled={user.role === 'ADMIN'}
                            >
                              {user.isActive ? '🔒' : '🔓'}
                            </button>
                            <button
                              className="action-btn"
                              title="Delete"
                              style={{ color: '#e74c3c' }}
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={user.role === 'ADMIN'}
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

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
        <UserModal
          user={editingUser}
          onSave={handleSaveUser}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default AccountManagementPage;
