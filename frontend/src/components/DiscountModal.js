import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './DiscountModal.css';

const DiscountModal = ({ order, onClose, onApply }) => {
    const { t } = useTranslation();
    const [discountType, setDiscountType] = useState('PERCENTAGE');
    const [discountValue, setDiscountValue] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const subtotal = Number(order.subtotalAmount);

    // Calculate preview discount amount
    const calculateDiscount = () => {
        const value = parseFloat(discountValue);
        if (isNaN(value) || value <= 0) return 0;

        if (discountType === 'PERCENTAGE') {
            if (value > 100) return 0;
            return (subtotal * value) / 100;
        } else if (discountType === 'FIXED') {
            return Math.min(value, subtotal);
        }
        return 0;
    };

    const previewDiscount = calculateDiscount();
    const previewTotal = Math.max(0, subtotal + Number(order.taxAmount) - previewDiscount);

    // Validate input
    const validateInput = () => {
        const value = parseFloat(discountValue);

        if (!discountValue || isNaN(value)) {
            setError('Please enter a discount value');
            return false;
        }

        if (value <= 0) {
            setError('Please enter a positive discount value');
            return false;
        }

        if (discountType === 'PERCENTAGE' && value > 100) {
            setError('Percentage discount cannot exceed 100%');
            return false;
        }

        if (discountType === 'FIXED' && value > subtotal) {
            setError('Discount cannot exceed subtotal');
            return false;
        }

        setError('');
        return true;
    };

    // Handle apply discount
    const handleApply = async () => {
        if (!validateInput()) return;

        setLoading(true);
        try {
            await onApply({
                type: discountType,
                value: parseFloat(discountValue),
            });
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Cannot apply discount');
        } finally {
            setLoading(false);
        }
    };

    // Handle remove discount
    const handleRemoveDiscount = async () => {
        setLoading(true);
        try {
            await onApply({
                type: 'NONE',
                value: 0,
            });
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || t('discount.errors.failed'));
        } finally {
            setLoading(false);
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(Number(amount));
    };

    return (
        <div className="discount-modal-overlay" onClick={onClose}>
            <div className="discount-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="discount-modal-header">
                    <h2>{'Apply discount'}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="discount-modal-body">
                    {/* Order Info */}
                    <div className="order-info-section">
                        <p><strong>{'Order Number'}:</strong> {order.orderNumber}</p>
                        <p><strong>{'Table'}:</strong> {order.table?.tableNumber}</p>
                        <p><strong>{'Subtotal'}:</strong> {formatCurrency(subtotal)}</p>
                    </div>

                    {/* Current Discount (if any) */}
                    {order.discountType !== 'NONE' && order.discountAmount > 0 && (
                        <div className="current-discount-info">
                            <p>
                                <strong>{'Current Discount'}:</strong>{' '}
                                {order.discountType === 'PERCENTAGE' 
                                    ? `${order.discountValue}%` 
                                    : formatCurrency(order.discountValue)}{' '}
                                ({formatCurrency(order.discountAmount)})
                            </p>
                            <button 
                                className="remove-discount-btn"
                                onClick={handleRemoveDiscount}
                                disabled={loading}
                            >
                                {'Remove Discount'}
                            </button>
                        </div>
                    )}

                    {/* Discount Type Selection */}
                    <div className="discount-type-section">
                        <label>{'Discount Type'}:</label>
                        <div className="discount-type-buttons">
                            <button
                                className={`type-btn ${discountType === 'PERCENTAGE' ? 'active' : ''}`}
                                onClick={() => {
                                    setDiscountType('PERCENTAGE');
                                    setDiscountValue('');
                                    setError('');
                                }}
                            >
                                {'Percentage'}
                            </button>
                            <button
                                className={`type-btn ${discountType === 'FIXED' ? 'active' : ''}`}
                                onClick={() => {
                                    setDiscountType('FIXED');
                                    setDiscountValue('');
                                    setError('');
                                }}
                            >
                                {'Fixed Amount'}
                            </button>
                        </div>
                    </div>

                    {/* Discount Value Input */}
                    <div className="discount-value-section">
                        <label>{'Discount Value'}:</label>
                        <div className="input-group">
                            <input
                                type="number"
                                min="0"
                                step={discountType === 'PERCENTAGE' ? '1' : '0.01'}
                                max={discountType === 'PERCENTAGE' ? '100' : undefined}
                                value={discountValue}
                                onChange={(e) => {
                                    setDiscountValue(e.target.value);
                                    setError('');
                                }}
                                placeholder={discountType === 'PERCENTAGE' ? '0-100' : '0.00'}
                                className={error ? 'input-error' : ''}
                            />
                            <span className="input-suffix">
                                {discountType === 'PERCENTAGE' ? '%' : '$'}
                            </span>
                        </div>
                        {error && <div className="error-message">{error}</div>}
                    </div>

                    {/* Preview Section */}
                    {discountValue && !error && (
                        <div className="discount-preview">
                            <div className="preview-row">
                                <span>{'Subtotal'}:</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="preview-row discount-row">
                                <span>{'Discount Amount'}:</span>
                                <span>-{formatCurrency(previewDiscount)}</span>
                            </div>
                            <div className="preview-row">
                                <span>{'Tax'}:</span>
                                <span>{formatCurrency(order.taxAmount)}</span>
                            </div>
                            <div className="preview-row total-row">
                                <span><strong>{'New Total'}:</strong></span>
                                <span><strong>{formatCurrency(previewTotal)}</strong></span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="discount-modal-footer">
                    <button 
                        className="cancel-btn" 
                        onClick={onClose}
                        disabled={loading}
                    >
                        {'Cancel'}
                    </button>
                    <button 
                        className="apply-btn" 
                        onClick={handleApply}
                        disabled={loading || !discountValue}
                    >
                        {loading ? t('common.loading') : 'Apply Discount'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DiscountModal;
