import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { useCart } from '../contexts/CartContext';
import './OrderTrackingPage.css';

const OrderTrackingPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { table } = useCart();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOrder = useCallback(async () => {
        try {
            const data = await orderService.getOrderById(orderId);
            setOrder(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch order', err);
            setError('Could not load order details.');
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchOrder();
        // Simple polling every 10 seconds
        const interval = setInterval(fetchOrder, 10000);
        return () => clearInterval(interval);
    }, [fetchOrder]);

    const { setTable } = useCart();

    // Restore table context if missing (e.g. direct link visit)
    useEffect(() => {
        if (order?.table && !table) {
            setTable(order.table.id, order.table.tableNumber);
        }
    }, [order, table, setTable]);

    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Fetching order status...</p></div>;

    if (error || !order) return (
        <div className="error-container">
            <h2>⚠️ {error || 'Order not found'}</h2>
            <button onClick={() => navigate('/menu')}>Back to Menu</button>
        </div>
    );

    const getStatusStep = (status) => {
        const steps = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'];
        return steps.indexOf(status);
    };

    const currentStep = getStatusStep(order.status);

    return (
        <div className="tracking-page">
            <header className="tracking-header">
                <button className="back-btn" onClick={() => navigate('/menu')}>←</button>
                <h1>Order #{order.orderNumber}</h1>
                <div className="table-info">Table {order.table?.tableNumber || table?.tableNumber}</div>
            </header>

            <div className="status-banner">
                <div className="status-label">{order.status}</div>
                <div className="progress-bar">
                    {[0, 1, 2, 3, 4].map((step) => (
                        <div key={step} className={`step ${step <= currentStep ? 'active' : ''}`}></div>
                    ))}
                </div>
            </div>

            <div className="items-tracking">
                <h3>Order Items</h3>
                {order.items.map((item) => (
                    <div key={item.id} className="item-row">
                        <div className="item-main">
                            <span className="item-qty">{item.quantity}x</span>
                            <span className="item-name">{item.menuItemName}</span>
                            <span className={`item-status-tag ${item.status.toLowerCase()}`}>{item.status}</span>
                        </div>
                        {item.selectedModifiers?.length > 0 && (
                            <div className="item-mods">
                                {item.selectedModifiers.map(m => m.modifierOptionName || m.name).join(', ')}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="order-summary-card">
                <div className="summary-row"><span>Subtotal</span><span>${Number(order.subtotalAmount).toFixed(2)}</span></div>
                <div className="summary-row total"><span>Total Paid</span><span>${Number(order.totalAmount).toFixed(2)}</span></div>
            </div>

            <div className="tracking-actions">
                <button className="add-more-btn" onClick={() => navigate('/menu')}>Add More Items</button>
                {order.status === 'SERVED' && (
                    <button className="bill-btn">Request Bill</button>
                )}
            </div>

            <p className="refresh-note">Status updates every 10 seconds</p>
        </div>
    );
};

export default OrderTrackingPage;
