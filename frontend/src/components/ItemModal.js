import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PhotoManager from './PhotoManager';

const ItemModal = ({ item, categories, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    description: '',
    prepTimeMinutes: 0,
    status: 'AVAILABLE', // available, unavailable, sold_out
    isChefRecommended: false,
  });

  const [errors, setErrors] = useState({});
  const [modifierGroups, setModifierGroups] = useState([]);
  const [selectedModifierGroups, setSelectedModifierGroups] = useState([]);

  useEffect(() => {
    // Fetch modifier groups
    const fetchModifierGroups = async () => {
      try {
        const res = await axios.get('/api/admin/menu/modifier-groups');
        setModifierGroups(res.data);
      } catch (error) {
        console.error('Error fetching modifier groups:', error);
      }
    };

    fetchModifierGroups();

    if (item) {
      setFormData({
        name: item.name,
        categoryId: item.categoryId,
        price: item.price,
        description: item.description || '',
        prepTimeMinutes: item.prepTimeMinutes || 0,
        status: item.status,
        isChefRecommended: item.isChefRecommended,
      });

      // Set selected modifier groups
      if (item.modifierGroups) {
        setSelectedModifierGroups(item.modifierGroups.map(mg => mg.group.id));
      }
    } else {
      // Set default category if available
      if (categories.length > 0) {
        setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
      }
    }
  }, [item, categories]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = value;

    if (type === 'checkbox') val = checked;
    if (name === 'price' || name === 'prepTimeMinutes') val = parseFloat(value) || 0;

    setFormData(prev => ({
      ...prev,
      [name]: val
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toggleModifierGroup = (groupId) => {
    setSelectedModifierGroups(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Item name is required';
    if (!formData.categoryId) newErrors.categoryId = 'Category is required';
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (formData.prepTimeMinutes < 0) newErrors.prepTimeMinutes = 'Prep time cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData, selectedModifierGroups);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{item ? 'Edit Menu Item' : 'Add New Item'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name <span className="required">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Grilled Salmon"
              className={errors.name ? 'error form-input' : 'form-input'}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Category <span className="required">*</span></label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className={errors.categoryId ? 'error form-input' : 'form-input'}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.categoryId && <span className="error-message">{errors.categoryId}</span>}
            </div>

            <div className="form-group">
              <label>Price ($) <span className="required">*</span></label>
              <input
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className={errors.price ? 'error form-input' : 'form-input'}
              />
              {errors.price && <span className="error-message">{errors.price}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Prep Time (mins)</label>
              <input
                type="number"
                name="prepTimeMinutes"
                value={formData.prepTimeMinutes}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-input"
              >
                <option value="AVAILABLE">Available</option>
                <option value="UNAVAILABLE">Unavailable</option>
                <option value="SOLDOUT">Sold Out</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="form-input"
              placeholder="Dish ingredients and details..."
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="isChefRecommended"
              name="isChefRecommended"
              checked={formData.isChefRecommended}
              onChange={handleChange}
              style={{ width: '20px', height: '20px' }}
            />
            <label htmlFor="isChefRecommended" style={{ margin: 0, cursor: 'pointer' }}>
              Chef Recommended 👨‍🍳
            </label>
          </div>

          <div className="form-group" style={{ marginTop: '20px' }}>
            <label>Modifier Groups</label>

            <div className="modifier-group-grid">
              {modifierGroups.map((group) => (
                <label key={group.id} className="modifier-group-item">
                  <input
                    type="checkbox"
                    checked={selectedModifierGroups.includes(group.id)}
                    onChange={() => toggleModifierGroup(group.id)}
                  />
                  <span>{group.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <PhotoManager
              itemId={item?.id}
              photos={item?.photos}
              onUpdate={() => onSave({ ...formData, refreshOnly: true }, selectedModifierGroups)}
              onLocalChange={(localList) => {
                setFormData(prev => ({
                  ...prev,
                  initialPhotos: localList.map(p => p.file),
                  primaryPhotoIndex: localList.findIndex(p => p.isPrimary)
                }));
              }}
            />
          </div>


          <div className="modal-actions">
            <button type="button" className="btn-primary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {item ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemModal;