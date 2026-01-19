import React from 'react';
import './WaiterBill.css';

const WaiterBill = React.forwardRef(({ order }, ref) => {

    if (!order) {
        return null;
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(amount));
    };

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

    return (
        <div ref={ref} className="waiter-bill"
            style={{ width: '800px', background: 'white' }}
        >
            <div className="bill-header">
                <h1>SMART RESTAURANT TEST</h1>
                <p className="bill-subtitle">CUSTOMER BILL</p>
                <div className="bill-divider"></div>
            </div>

            <div className="bill-info-section">
                <div className="bill-info-row">
                    <span className="label">Table:</span>
                    <span className="value">TEST {order.table?.tableNumber || 'N/A'}</span>
                </div>
                <div className="bill-info-row">
                    <span className="label">Order Number:</span>
                    <span className="value">TEST #{order.orderNumber}</span>
                </div>
                <div className="bill-info-row">
                    <span className="label">Date:</span>
                    <span className="value">TEST DATE {formatDateTime(order.createdAt || order.orderDate)}</span>
                </div>
            </div>

            <div className="bill-divider"></div>

            <div className="bill-items-section">
                <h3>ITEMS</h3>
                <table className="bill-items-table">
                    <thead>
                        <tr>
                            <th>Qty</th>
                            <th>Item</th>
                            <th>Price</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items?.map((item, index) => (
                            <React.Fragment key={item.id || index}>
                                <tr>
                                    <td className="qty-col">{item.quantity}</td>
                                    <td className="item-col">
                                        <div className="item-name-text">{item.menuItemName}</div>
                                        {item.selectedModifiers?.length > 0 && (
                                            <div className="item-mods-text">
                                                {item.selectedModifiers.map((mod, i) => (
                                                    <span key={i} className="mod-text">
                                                        + {mod.modifierOptionName}
                                                        {mod.priceAdjustment > 0 && ` (+${formatCurrency(mod.priceAdjustment)})`}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {item.specialRequest && (
                                            <div className="item-note-text">Note: {item.specialRequest}</div>
                                        )}
                                    </td>
                                    <td className="price-col">{formatCurrency(item.unitPrice)}</td>
                                    <td className="amount-col">{formatCurrency(item.subtotal)}</td>
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bill-divider"></div>

            <div className="bill-totals-section">
                <div className="total-line">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(order.subtotalAmount)}</span>
                </div>
                {order.discountAmount > 0 && (
                    <div className="total-line discount-line">
                        <span>
                            Discount
                            {order.discountType === 'PERCENTAGE' && ` (${order.discountValue}%)`}
                            {order.discountType === 'FIXED' && ' (Fixed)'}:
                        </span>
                        <span>-{formatCurrency(order.discountAmount)}</span>
                    </div>
                )}
                <div className="total-line">
                    <span>Tax (8%):</span>
                    <span>{formatCurrency(order.taxAmount || 0)}</span>
                </div>
                <div className="total-line grand-total-line">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                </div>
            </div>

            <div className="bill-payment-section">
                <div className="payment-status-line">
                    <span>Payment Status:</span>
                    <span className="paid-badge">✅ PAID</span>
                </div>
                {order.paymentMethod && (
                    <div className="payment-method-line">
                        <span>Payment Method:</span>
                        <span>{order.paymentMethod}</span>
                    </div>
                )}
            </div>

            <div className="bill-footer">
                <p className="thanks-text">Thank you for your visit!</p>
                <p className="footer-text">Please come again</p>
                <p className="print-time">Printed: {new Date().toLocaleString()}</p>
            </div>
        </div>
    );
});

WaiterBill.displayName = 'WaiterBill';

export default WaiterBill;
