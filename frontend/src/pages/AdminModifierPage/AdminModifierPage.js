import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import ModifierGroupModal from '../../components/ModifierGroupModal';

const AdminModifierPage = () => {
    const [modifierGroups, setModifierGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);

    const fetchModifierGroups = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/menu/modifier-groups');
            setModifierGroups(res.data);
        } catch (error) {
            console.error('Error fetching modifier groups:', error);
            alert('Failed to load modifier groups');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModifierGroups();
    }, []);

    const handleAddGroup = () => {
        setEditingGroup(null);
        setShowModal(true);
    };

    const handleEditGroup = (group) => {
        setEditingGroup(group);
        setShowModal(true);
    };

    const handleDeleteGroup = async (id) => {
        if (!window.confirm('Are you sure you want to delete this group? It can only be deleted if not attached to any items.')) return;
        try {
            await axios.delete(`/api/admin/menu/modifier-groups/${id}`);
            fetchModifierGroups();
            alert('Group deleted successfully');
        } catch (error) {
            console.error('Error deleting group:', error);
            alert(error.response?.data?.message || 'Failed to delete group');
        }
    };

    const handleSaveGroup = async () => {
        setShowModal(false);
        fetchModifierGroups();
    };

    return (
        <div className="admin-layout">
            <Sidebar />
            <div className="admin-main">
                <div className="admin-header">
                    <div>
                        <h1 className="page-title">Modifier Groups</h1>
                        <p className="page-subtitle">Manage add-ons, sizes, and customizations</p>
                    </div>
                    <button className="btn-primary" onClick={handleAddGroup}>
                        + Add Modifier Group
                    </button>
                </div>

                <div className="table-card">
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
                    ) : modifierGroups.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                            No modifier groups found.
                        </div>
                    ) : (
                        <div className="data-table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '80px', textAlign: 'center' }}>Order</th>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Required</th>
                                        <th>Options</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {modifierGroups.map((group) => (
                                        <tr key={group.id}>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                                {group.displayOrder}
                                            </td>
                                            <td style={{ fontWeight: '600' }}>{group.name}</td>
                                            <td>
                                                <span className="status-badge" style={{ backgroundColor: '#f0f0f0', color: '#333' }}>
                                                    {group.selectionType}
                                                </span>
                                            </td>
                                            <td>{group.isRequired ? '✅ Yes' : '❌ No'}</td>
                                            <td>
                                                <div className="modifier-options-summary">
                                                    {group.options?.map(opt => (
                                                        <span key={opt.id} className="tab-count" style={{ marginRight: '5px', fontSize: '11px' }}>
                                                            {opt.name} ({opt.priceAdjustment > 0 ? `+$${opt.priceAdjustment}` : 'Free'})
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${group.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                                                    {group.status}
                                                </span>
                                            </td>
                                            <td className="actions-cell">
                                                <button className="action-btn" title="Edit" onClick={() => handleEditGroup(group)}>
                                                    ✎
                                                </button>
                                                <button
                                                    className="action-btn"
                                                    title="Delete"
                                                    style={{ color: '#e74c3c' }}
                                                    onClick={() => handleDeleteGroup(group.id)}
                                                >
                                                    🗑
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <ModifierGroupModal
                    group={editingGroup}
                    onSave={handleSaveGroup}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
};

export default AdminModifierPage;
