import React from 'react';
import './OrderCard.css';

const OrderCard = ({ order, onAction }) => {
    // Format date/time
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(amount));
    };

    // Get status badge class
    const getStatusClass = (status) => {
        const statusMap = {
            PENDING: 'status-pending',
            ACCEPTED: 'status-accepted',
            PREPARING: 'status-preparing',
            READY: 'status-ready',
            SERVED: 'status-served',
            COMPLETED: 'status-completed',
            CANCELLED: 'status-cancelled',
        };
        return statusMap[status] || '';
    };

    // Get status display text
    const getStatusText = (status) => {
        const statusMap = {
            PENDING: 'New Order',
            ACCEPTED: 'Accepted',
            PREPARING: 'Preparing',
            READY: 'Ready to Serve',
            SERVED: 'Served',
            COMPLETED: 'Completed',
            CANCELLED: 'Cancelled',
        };
        return statusMap[status] || status;
    };

    // Render action buttons based on status
    const renderActionButtons = () => {
        switch (order.status) {
            case 'PENDING':
                return (
                    <div className="order-actions">
                        <button
                            className="action-btn btn-accept"
                            onClick={() => onAction(order.id, 'accept')}
                        >
                            ✓ Accept
                        </button>
                        <button
                            className="action-btn btn-reject"
                            onClick={() => onAction(order.id, 'reject')}
                        >
                            ✗ Reject
                        </button>
                    </div>
                );
            case 'ACCEPTED':
                return (
                    <div className="order-actions">
                        <button
                            className="action-btn btn-kitchen"
                            onClick={() => onAction(order.id, 'send-to-kitchen')}
                        >
                            🍳 Send to Kitchen
                        </button>
                    </div>
                );
            case 'PREPARING':
                return (
                    <div className="order-actions">
                        <button
                            className="action-btn btn-ready"
                            onClick={() => onAction(order.id, 'mark-ready')}
                        >
                            ✓ Mark as Ready
                        </button>
                    </div>
                );
            case 'READY':
                return (
                    <div className="order-actions">
                        <button
                            className="action-btn btn-served"
                            onClick={() => onAction(order.id, 'served')}
                        >
                            🍽️ Mark as Served
                        </button>
                    </div>
                );
            case 'SERVED':
                return (
                    <div className="order-actions">
                        <button
                            className="action-btn btn-complete"
                            onClick={() => onAction(order.id, 'complete')}
                        >
                            ✓ Complete Order
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="order-card">
            <div className="order-card-header">
                <div className="order-header-left">
                    <h3 className="order-table">🪑 Table {order.table?.tableNumber}</h3>
                    <p className="order-number">#{order.orderNumber}</p>
                </div>
                <span className={`status-badge ${getStatusClass(order.status)}`}>
                    {getStatusText(order.status)}
                </span>
            </div>

            <div className="order-time">
                <span>📅 {formatDateTime(order.createdAt)}</span>
            </div>

            <div className="order-items">
                <h4>Order Items:</h4>
                {order.items?.map((item) => (
                    <div key={item.id} className="order-item">
                        <div className="item-main">
                            <span className="item-quantity">{item.quantity}x</span>
                            <span className="item-name">{item.menuItemName}</span>
                            <span className="item-price">
                                {formatCurrency(item.subtotal)}
                            </span>
                        </div>
                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                            <div className="item-modifiers">
                                {item.selectedModifiers.map((mod, idx) => (
                                    <span key={idx} className="modifier-tag">
                                        + {mod.modifierOptionName}
                                        {mod.priceAdjustment > 0 && ` (+${formatCurrency(mod.priceAdjustment)})`}
                                    </span>
                                ))}
                            </div>
                        )}
                        {item.specialRequest && (
                            <div className="item-special-request">
                                💬 {item.specialRequest}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {order.notes && (
                <div className="order-notes">
                    <strong>Notes:</strong> {order.notes}
                </div>
            )}

            <div className="order-total">
                <div className="total-row">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(order.subtotalAmount)}</span>
                </div>
                <div className="total-row">
                    <span>Tax (8%):</span>
                    <span>{formatCurrency(order.taxAmount)}</span>
                </div>
                <div className="total-row total-final">
                    <span>Total:</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                </div>
            </div>

            {renderActionButtons()}
        </div>
    );
};

export default OrderCard;
