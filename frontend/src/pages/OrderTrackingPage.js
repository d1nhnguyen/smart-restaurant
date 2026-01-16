import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { useCart } from '../contexts/CartContext';
import { useSocket } from '../hooks/useSocket';
import './OrderTrackingPage.css';

const OrderTrackingPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { table, setTable } = useCart();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(null);
    const { joinRoom, on, off, callWaiter, isConnected } = useSocket();

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
        // Keep polling as fallback, but less frequent
        const interval = setInterval(fetchOrder, 30000);
        return () => clearInterval(interval);
    }, [fetchOrder]);

    // WebSocket: Join order room and listen for updates
    useEffect(() => {
        if (orderId && isConnected) {
            joinRoom('order', orderId);
            console.log(`🔌 Joined order tracking room for: order:${orderId}`);
            console.log(`🔍 OrderId type: ${typeof orderId}, value: ${orderId}`);

            // Listen for status updates
            const handleStatusUpdate = (data) => {
                console.log('📡 Order status updated - RAW DATA:', data);
                console.log(`🔍 Comparing: data.orderId (${typeof data.orderId}) ${data.orderId} === orderId (${typeof orderId}) ${orderId}`);
                if (data.orderId === orderId) {
                    setOrder(data.order);
                    
                    // Show notification
                    if (data.status === 'READY') {
                        setNotification('🔔 Your order is ready!');
                    } else {
                        setNotification(`Order status: ${data.status}`);
                    }
                    
                    setTimeout(() => setNotification(null), 5000);
                }
            };

            const handleOrderReady = (data) => {
                console.log('🎉 Order ready notification - RAW DATA:', data);
                console.log(`🔍 Ready comparing: ${typeof data.orderId} ${data.orderId} === ${typeof orderId} ${orderId}`);
                if (data.orderId === orderId) {
                    setOrder(data.order);
                    setNotification('🎉 Your order is ready! Please pick it up.');
                    setTimeout(() => setNotification(null), 8000);
                }
            };

            // Listen for item status updates
            const handleItemStatusUpdated = (data) => {
                console.log('🍲 Item status updated:', data);
                if (data.orderId === orderId) {
                    // Fetch fresh order data to get updated items
                    fetchOrder();
                }
            };

            on('order:statusUpdated', handleStatusUpdate);
            on('order:ready', handleOrderReady);
            on('orderItem:statusUpdated', handleItemStatusUpdated);

            return () => {
                off('order:statusUpdated', handleStatusUpdate);
                off('order:ready', handleOrderReady);
                off('orderItem:statusUpdated', handleItemStatusUpdated);
            };
        }
    }, [orderId, isConnected, joinRoom, on, off, fetchOrder]);

    const handleCallWaiter = () => {
        if (order?.table) {
            callWaiter(order.table.id, order.table.tableNumber);
            setNotification('✅ Waiter has been notified!');
            setTimeout(() => setNotification(null), 3000);
        }
    };

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
        const steps = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'];
        return steps.indexOf(status);
    };

    const currentStep = getStatusStep(order.status);

    return (
        <div className="tracking-page">
            {notification && (
                <div className="notification-banner animate-slide-down">
                    {notification}
                </div>
            )}

            <header className="tracking-header">
                <button onClick={() => navigate('/menu')} className="back-button">← Menu</button>
                <h1>Order Tracking</h1>
                <div className="socket-indicator">
                    {isConnected ? (
                        <span className="status-online">🟢 Live</span>
                    ) : (
                        <span className="status-offline">🔴 Offline</span>
                    )}
                </div>
            </header>

            <div className="tracking-content">
                <div className="order-info-section">
                    <h2>Order #{order.orderNumber}</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="label">Table:</span>
                            <span className="value">{order.table?.tableNumber || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Time:</span>
                            <span className="value">{new Date(order.orderDate).toLocaleTimeString()}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Total:</span>
                            <span className="value">${Number(order.totalAmount).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="status-banner">
                    <h3>Order Status</h3>
                    <div className={`status-label status-${order.status.toLowerCase()}`}>{order.status}</div>
                    <div className="progress-bar">
                        {[0, 1, 2, 3, 4].map((step) => (
                            <div key={step} className={`step ${step <= currentStep ? 'active' : ''}`}></div>
                        ))}
                    </div>
                    <div className="status-labels">
                        <span className={currentStep >= 0 ? 'active' : ''}>Placed</span>
                        <span className={currentStep >= 1 ? 'active' : ''}>Accepted</span>
                        <span className={currentStep >= 2 ? 'active' : ''}>Preparing</span>
                        <span className={currentStep >= 3 ? 'active' : ''}>Ready</span>
                        <span className={currentStep >= 4 ? 'active' : ''}>Served</span>
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

                <button className="call-waiter-btn" onClick={handleCallWaiter}>
                    📞 Call Waiter
                </button>

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

                <p className="refresh-note">Real-time updates via WebSocket</p>
            </div>
        </div>
    );
};

export default OrderTrackingPage;
