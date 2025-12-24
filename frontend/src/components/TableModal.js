import React, { useState, useEffect } from 'react';

const TableModal = ({ table, locations, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: 4,
    location: '',
    description: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (table) {
      setFormData({
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        location: table.location || '',
        description: table.description || '',
      });
    }
  }, [table]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || '' : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.tableNumber.trim()) {
      newErrors.tableNumber = 'Table number is required';
    }

    if (!formData.capacity || formData.capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    } else if (formData.capacity > 20) {
      newErrors.capacity = 'Capacity cannot exceed 20';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{table ? 'Edit Table' : 'Add New Table'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="tableNumber">
              Table Number <span className="required">*</span>
            </label>
            <input
              type="text"
              id="tableNumber"
              name="tableNumber"
              value={formData.tableNumber}
              onChange={handleChange}
              placeholder="e.g., T01, A1, Table 1"
              className={errors.tableNumber ? 'error' : ''}
            />
            {errors.tableNumber && (
              <span className="error-message">{errors.tableNumber}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="capacity">
              Capacity (1-20) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              min="1"
              max="20"
              value={formData.capacity}
              onChange={handleChange}
              className={errors.capacity ? 'error' : ''}
            />
            {errors.capacity && (
              <span className="error-message">{errors.capacity}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
            >
              <option value="">Select location...</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
              <option value="Indoor">Indoor</option>
              <option value="Outdoor">Outdoor</option>
              <option value="Patio">Patio</option>
              <option value="VIP Room">VIP Room</option>
            </select>
            <small className="form-hint">Or type a custom location</small>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Or enter custom location"
              style={{ marginTop: '8px' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional description..."
              rows="3"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {table ? 'Update Table' : 'Create Table'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TableModal;
