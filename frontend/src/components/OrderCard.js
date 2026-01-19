import React, { useRef, useState } from 'react';
import WaiterBill from './WaiterBill';
import DiscountModal from './DiscountModal';
import { orderService } from '../services/orderService';
import './OrderCard.css';

const OrderCard = ({ order, onAction, userRole }) => {
    // State for discount modal
    const [showDiscountModal, setShowDiscountModal] = useState(false);

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

    // Print bill ref
    const billRef = useRef();

    // Manual print handler using window.print()
    const onPrintClick = () => {
        if (!billRef.current) {
            console.error('Bill ref not available');
            alert('Unable to print. Please try again.');
            return;
        }

        // Get the bill content HTML
        const billContent = billRef.current.innerHTML;
        const billStyles = `
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Courier New', monospace; padding: 20mm; background: white; color: #000; }
                .waiter-bill { max-width: 800px; margin: 0 auto; background: white; line-height: 1.6; }
                .bill-header { text-align: center; margin-bottom: 30px; }
                .bill-header h1 { font-size: 28px; letter-spacing: 2px; margin-bottom: 8px; }
                .bill-subtitle { font-size: 14px; color: #666; text-transform: uppercase; }
                .bill-divider { border-bottom: 2px dashed #333; margin: 20px 0; }
                .bill-info-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
                .bill-info-row .label { font-weight: bold; }
                .bill-items-table { width: 100%; border-collapse: collapse; }
                .bill-items-table th { text-align: left; padding: 10px 4px; border-bottom: 2px solid #333; font-size: 13px; }
                .bill-items-table td { padding: 12px 4px; border-bottom: 1px dotted #999; font-size: 13px; }
                .qty-col { width: 50px; text-align: center; font-weight: bold; }
                .price-col { width: 80px; text-align: right; }
                .amount-col { width: 90px; text-align: right; font-weight: bold; }
                .item-name-text { font-weight: bold; }
                .mod-text { display: block; font-size: 11px; color: #666; font-style: italic; margin-left: 10px; }
                .total-line { display: flex; justify-content: space-between; padding: 8px 0; }
                .grand-total-line { font-size: 18px; font-weight: bold; padding-top: 15px; border-top: 2px solid #333; margin-top: 10px; }
                .bill-payment-section { margin: 20px 0; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; }
                .paid-badge { background: #d4edda; color: #155724; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
                .bill-footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px dashed #333; }
                .thanks-text { font-size: 18px; font-weight: bold; }
                @media print { body { padding: 0; } .bill-payment-section { background: white !important; } }
            </style>
        `;

        // Format filename
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '');
        const fileName = `Bill_${order.table?.tableNumber || 'Table'}_${order.orderNumber}_${dateStr}_${timeStr}`;

        // Create a hidden iframe
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.top = '-9999px';
        printFrame.style.left = '-9999px';
        document.body.appendChild(printFrame);

        // Write content to iframe
        const frameDoc = printFrame.contentWindow.document;
        frameDoc.open();
        frameDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${fileName}</title>
                ${billStyles}
            </head>
            <body>
                ${billContent}
            </body>
            </html>
        `);
        frameDoc.close();

        // Save original title and temporarily change for PDF filename
        const originalTitle = document.title;
        document.title = fileName;

        // Wait for content to load, then print
        setTimeout(() => {
            // Explicitly set title for PDF filename
            frameDoc.title = fileName;
            printFrame.contentWindow.document.title = fileName;

            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();

            // Clean up after print and restore title
            setTimeout(() => {
                document.body.removeChild(printFrame);
                document.title = originalTitle;
            }, 1000);
        }, 250);
    };

    // Handle discount apply
    const handleApplyDiscount = async (discountData) => {
        try {
            await orderService.applyDiscount(order.id, discountData);
            // Trigger refresh by calling onAction with a custom action
            if (onAction) {
                onAction(order.id, 'refresh');
            }
        } catch (error) {
            console.error('Error applying discount:', error);
            throw error;
        }
    };

    // Check if user can apply discount (admin or waiter only)
    const canApplyDiscount = userRole === 'ADMIN' || userRole === 'WAITER';

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
                    <span>Subtotal: </span>
                    <span>{formatCurrency(order.subtotalAmount)}</span>
                </div>
                {order.discountAmount > 0 && (
                    <div className="total-row discount-row">
                        <span>
                            Discount 
                            {order.discountType === 'PERCENTAGE' && ` (${order.discountValue}%)`}
                            {order.discountType === 'FIXED' && ' (Fixed)'}
                            :
                        </span>
                        <span>-{formatCurrency(order.discountAmount)}</span>
                    </div>
                )}
                <div className="total-row">
                    <span>Tax (8%):</span>
                    <span>{formatCurrency(order.taxAmount)}</span>
                </div>
                <div className="total-row total-final">
                    <span>Total: </span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                </div>

                <div className="payment-info-row">
                    <span className={`payment-status-badge ${order.paymentStatus === 'PAID' ? 'paid' : 'unpaid'}`}>
                        {order.paymentStatus === 'PAID' ? '✅ PAID' : '💳 UNPAID'}
                    </span>
                    <div className="payment-actions">
                        {/* Discount button (admin/waiter only, unpaid orders only) */}
                        {canApplyDiscount && order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (
                            <button
                                className="btn-discount"
                                onClick={() => setShowDiscountModal(true)}
                                title="Apply Discount"
                            >
                                Discount
                            </button>
                        )}
                        {order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (
                            <button
                                className="btn-mark-paid"
                                onClick={() => onAction(order.id, 'mark-paid')}
                                title="Mark as Paid (Cash)"
                            >
                                Mark Paid
                            </button>
                        )}
                        {order.paymentStatus === 'PAID' && (
                            <button
                                className="btn-print-bill"
                                onClick={onPrintClick}
                                title="Print Bill"
                            >
                                🖨️ Print Bill
                            </button>
                        )}
                    </div>
                </div>

                {/* Hidden bill for printing - must be rendered in DOM */}
                <div style={{ position: 'absolute', left: '-99999px', top: 0, opacity: 0 }}>
                    <WaiterBill ref={billRef} order={order} />
                </div>
            </div>

            {renderActionButtons()}

            {/* Discount Modal */}
            {showDiscountModal && (
                <DiscountModal
                    order={order}
                    onClose={() => setShowDiscountModal(false)}
                    onApply={handleApplyDiscount}
                />
            )}
        </div>
    );
};

export default OrderCard;
