import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ModifierGroupModal = ({ group, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        selectionType: 'SINGLE',
        isRequired: false,
        minSelections: 0,
        maxSelections: 0,
        displayOrder: 0
    });

    const [options, setOptions] = useState([]);
    const [newOption, setNewOption] = useState({ name: '', priceAdjustment: 0 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (group) {
            setFormData({
                name: group.name,
                selectionType: group.selectionType,
                isRequired: group.isRequired,
                minSelections: group.minSelections,
                maxSelections: group.maxSelections,
                displayOrder: group.displayOrder,
                status: group.status
            });
            setOptions(group.options || []);
        }
    }, [group]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'displayOrder' || name === 'minSelections' || name === 'maxSelections' ? parseInt(value) || 0 : value)
        }));
    };

    const handleAddOption = async () => {
        if (!newOption.name.trim()) return;

        if (group?.id) {
            // If editing existing group, add option via API
            try {
                const res = await axios.post(`/api/admin/menu/modifier-groups/${group.id}/options`, newOption);
                setOptions([...options, res.data]);
                setNewOption({ name: '', priceAdjustment: 0 });
            } catch (error) {
                alert('Failed to add option');
            }
        } else {
            // If creating new group, add to local state first (not supported by backend easily without transaction)
            // Actually, my backend requires group ID. So for new groups, options will be added AFTER group creation.
            // But let's support local preview if possible.
            setOptions([...options, { ...newOption, id: 'temp-' + Date.now() }]);
            setNewOption({ name: '', priceAdjustment: 0 });
        }
    };

    const handleRemoveOption = async (optionId) => {
        if (group?.id && !optionId.toString().startsWith('temp-')) {
            try {
                await axios.delete(`/api/admin/menu/modifier-options/${optionId}`);
                setOptions(options.filter(o => o.id !== optionId));
            } catch (error) {
                alert('Failed to delete option');
            }
        } else {
            setOptions(options.filter(o => o.id !== optionId));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let groupId = group?.id;
            if (groupId) {
                // When updating, send all fields including status
                await axios.put(`/api/admin/menu/modifier-groups/${groupId}`, formData);
            } else {
                // When creating, exclude status from the payload (it will default to ACTIVE in the database)
                const { status, ...createData } = formData;
                const res = await axios.post('/api/admin/menu/modifier-groups', createData);
                groupId = res.data.id;

                // Add local options to newly created group
                for (const opt of options) {
                    if (opt.id.toString().startsWith('temp-')) {
                        await axios.post(`/api/admin/menu/modifier-groups/${groupId}/options`, {
                            name: opt.name,
                            priceAdjustment: opt.priceAdjustment
                        });
                    }
                }
            }
            alert('Modifier group saved successfully');
            onSave();
        } catch (error) {
            console.error('Error saving modifier group:', error);
            alert(error.response?.data?.message || 'Failed to save modifier group');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2>{group ? 'Edit Modifier Group' : 'Add Modifier Group'}</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Group Name <span className="required">*</span></label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Size, Extra Cheese"
                            required
                            className="form-input"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="form-group">
                            <label>Selection Type</label>
                            <select name="selectionType" value={formData.selectionType} onChange={handleChange} className="form-input">
                                <option value="SINGLE">Single Select</option>
                                <option value="MULTIPLE">Multi Select</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Display Order</label>
                            <input type="number" name="displayOrder" value={formData.displayOrder} onChange={handleChange} className="form-input" />
                        </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                            <input type="checkbox" name="isRequired" checked={formData.isRequired} onChange={handleChange} />
                            Is Required?
                        </label>
                        {group && (
                            <select name="status" value={formData.status} onChange={handleChange} className="form-input" style={{ width: 'auto' }}>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        )}
                    </div>

                    {formData.selectionType === 'MULTIPLE' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group">
                                <label>Min Selections</label>
                                <input type="number" name="minSelections" value={formData.minSelections} onChange={handleChange} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Max Selections</label>
                                <input type="number" name="maxSelections" value={formData.maxSelections} onChange={handleChange} className="form-input" />
                            </div>
                        </div>
                    )}

                    <div className="modifier-options-section" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        <h3>Options</h3>
                        <div className="options-list" style={{ marginBottom: '15px' }}>
                            {options.map(opt => (
                                <div key={opt.id} className="option-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#f9f9f9', marginBottom: '5px', borderRadius: '4px' }}>
                                    <span>{opt.name} (+${Number(opt.priceAdjustment).toFixed(2)})</span>
                                    <button type="button" onClick={() => handleRemoveOption(opt.id)} style={{ color: '#e74c3c', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                                </div>
                            ))}
                        </div>

                        <div className="add-option-form" style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                placeholder="Option Name"
                                value={newOption.name}
                                onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                                className="form-input"
                            />
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Price ($)"
                                value={newOption.priceAdjustment}
                                onChange={(e) => setNewOption({ ...newOption, priceAdjustment: parseFloat(e.target.value) || 0 })}
                                className="form-input"
                                style={{ width: '100px' }}
                            />
                            <button type="button" className="btn-secondary" onClick={handleAddOption}>Add</button>
                        </div>
                    </div>

                    <div className="modal-actions" style={{ marginTop: '20px' }}>
                        <button type="button" className="btn-primary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : (group ? 'Update Group' : 'Create Group')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModifierGroupModal;
