import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './OrderItemModal.css';
import { getImageUrl } from '../utils/imageUrl';

const OrderItemModal = ({ item, onClose, onAddToOrder }) => {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [specialInstructions, setSpecialInstructions] = useState('');

  const modifierGroups = item.modifierGroups || [];

  // OrderItemModal loaded

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
          // Check maxSelections before adding
          const group = modifierGroups.find(mg => mg.group.id === groupId)?.group;
          if (group?.maxSelections > 0 && current.length >= group.maxSelections) {
            alert(`${t('orderItemModal.canOnlySelectUpTo')} ${group.maxSelections} ${t('orderItemModal.options')} ${t('orderItemModal.for')} ${group.name}`);
            return prev;
          }
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
    // Validate all modifier group constraints
    for (const mg of modifierGroups) {
      const group = mg.group;
      const selected = selectedModifiers[group.id];
      const selectedCount = Array.isArray(selected) ? selected.length : (selected ? 1 : 0);

      // Check if required
      if (group.isRequired && selectedCount === 0) {
        alert(`${t('orderItemModal.pleaseSelect')} ${group.name}`);
        return;
      }

      // Check minimum selections
      if (group.minSelections > 0 && selectedCount < group.minSelections) {
        alert(`${t('orderItemModal.pleaseSelectAtLeast')} ${group.minSelections} ${t('orderItemModal.options')} ${t('orderItemModal.for')} ${group.name}`);
        return;
      }

      // Check maximum selections
      if (group.maxSelections > 0 && selectedCount > group.maxSelections) {
        alert(`${t('orderItemModal.canOnlySelectUpTo')} ${group.maxSelections} ${t('orderItemModal.options')} ${t('orderItemModal.for')} ${group.name}`);
        return;
      }
    }

    // All validations passed, add to order
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
            <img src={getImageUrl(primaryPhoto.url)} alt={item.name} className="order-item-img" />
          ) : (
            <div className="order-item-placeholder">🍕</div>
          )}
          <div className="order-item-info">
            <h2>{item.name}</h2>
            <p className="order-item-desc">{item.description}</p>
            <div className="order-item-base-price">
              {t('orderItemModal.basePrice')}: ${Number(item.price).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Modifier Groups */}
        {modifierGroups.length > 0 && (
          <div className="modifier-groups">
            <h3>{t('orderItemModal.customizeOrder')}</h3>
            {modifierGroups.map(mg => (
              <div key={mg.group.id} className="modifier-group">
                <div className="modifier-group-header">
                  <span className="modifier-group-name">
                    {mg.group.name}
                    {mg.group.isRequired && <span className="required-badge">{t('orderItemModal.required')}</span>}
                  </span>
                  <span className="modifier-group-type">
                    {mg.group.selectionType === 'SINGLE' ? t('orderItemModal.chooseOne') : t('orderItemModal.chooseMultiple')}
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
                          : t('orderItemModal.free')}
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
          <label>{t('orderItemModal.specialInstructions')}</label>
          <textarea
            placeholder={t('orderItemModal.specialInstructionsPlaceholder')}
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
            {t('orderItemModal.addToOrder')} - ${calculateTotal()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderItemModal;
