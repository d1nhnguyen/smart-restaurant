import React, { useState } from 'react';
import './OrderItemModal.css';

const OrderItemModal = ({ item, onClose, onAddToOrder }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [specialInstructions, setSpecialInstructions] = useState('');

  const modifierGroups = item.modifierGroups || [];

  console.log('OrderItemModal - item:', item);
  console.log('OrderItemModal - modifierGroups:', modifierGroups);

  // Calculate total price
  const calculateTotal = () => {
    let total = Number(item.price) * quantity;

    // Add modifier prices
    Object.values(selectedModifiers).forEach(modifierIdOrIds => {
      // Handle both single selection (string/number) and multiple selection (array)
      const modifierIds = Array.isArray(modifierIdOrIds) ? modifierIdOrIds : [modifierIdOrIds];

      modifierIds.forEach(modifierId => {
        modifierGroups.forEach(group => {
          const option = group.group.options.find(opt => opt.id === modifierId);
          if (option) {
            total += Number(option.priceAdjustment) * quantity;
          }
        });
      });
    });

    return total.toFixed(2);
  };

  // Handle modifier selection
  const handleModifierChange = (groupId, optionId, selectionType) => {
    setSelectedModifiers(prev => {
      if (selectionType === 'SINGLE') {
        // Single select: replace
        return { ...prev, [groupId]: optionId };
      } else {
        // Multiple select: toggle
        const current = prev[groupId] || [];
        const isArray = Array.isArray(current);

        if (!isArray) {
          return { ...prev, [groupId]: [optionId] };
        }

        if (current.includes(optionId)) {
          // Remove
          const newSelection = current.filter(id => id !== optionId);
          return { ...prev, [groupId]: newSelection.length > 0 ? newSelection : undefined };
        } else {
          // Add
          return { ...prev, [groupId]: [...current, optionId] };
        }
      }
    });
  };

  const isOptionSelected = (groupId, optionId) => {
    const selection = selectedModifiers[groupId];
    if (!selection) return false;
    return Array.isArray(selection) ? selection.includes(optionId) : selection === optionId;
  };

  const handleAddToOrder = () => {
    // Validate required modifiers
    const missingRequired = modifierGroups.find(mg =>
      mg.group.isRequired && !selectedModifiers[mg.group.id]
    );

    if (missingRequired) {
      alert(`Please select ${missingRequired.group.name}`);
      return;
    }

    onAddToOrder({
      item,
      quantity,
      selectedModifiers,
      specialInstructions,
      totalPrice: calculateTotal(),
    });
  };

  const primaryPhoto = item.photos?.find(p => p.isPrimary) || item.photos?.[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content order-item-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        {/* Item Header */}
        <div className="order-item-header">
          {primaryPhoto ? (
            <img src={primaryPhoto.url} alt={item.name} className="order-item-img" />
          ) : (
            <div className="order-item-placeholder">🍕</div>
          )}
          <div className="order-item-info">
            <h2>{item.name}</h2>
            <p className="order-item-desc">{item.description}</p>
            <div className="order-item-base-price">
              Base Price: ${Number(item.price).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Modifier Groups */}
        {modifierGroups.length > 0 && (
          <div className="modifier-groups">
            <h3>Customize Your Order</h3>
            {modifierGroups.map(mg => (
              <div key={mg.group.id} className="modifier-group">
                <div className="modifier-group-header">
                  <span className="modifier-group-name">
                    {mg.group.name}
                    {mg.group.isRequired && <span className="required-badge">Required</span>}
                  </span>
                  <span className="modifier-group-type">
                    {mg.group.selectionType === 'SINGLE' ? 'Choose one' : 'Choose multiple'}
                  </span>
                </div>

                <div className="modifier-options">
                  {mg.group.options.map(option => (
                    <label key={option.id} className="modifier-option">
                      <input
                        type={mg.group.selectionType === 'SINGLE' ? 'radio' : 'checkbox'}
                        name={mg.group.id}
                        checked={isOptionSelected(mg.group.id, option.id)}
                        onChange={() => handleModifierChange(mg.group.id, option.id, mg.group.selectionType)}
                      />
                      <span className="modifier-option-name">{option.name}</span>
                      <span className="modifier-option-price">
                        {Number(option.priceAdjustment) > 0
                          ? `+$${Number(option.priceAdjustment).toFixed(2)}`
                          : 'Free'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Special Instructions */}
        <div className="special-instructions">
          <label>Special Instructions (Optional)</label>
          <textarea
            placeholder="Any special requests? (e.g., no onions, extra spicy)"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            rows={3}
          />
        </div>

        {/* Quantity & Add to Order */}
        <div className="order-item-footer">
          <div className="quantity-selector">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              −
            </button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)}>+</button>
          </div>

          <button className="add-to-order-btn" onClick={handleAddToOrder}>
            Add to Order - ${calculateTotal()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderItemModal;
