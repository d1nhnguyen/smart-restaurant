import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useSocket } from '../hooks/useSocket';
import './KitchenStaffPage.css';

const KitchenStaffPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { joinRoom, on, off, isConnected } = useSocket();

    const fetchOrders = useCallback(async () => {
        try {
            const response = await axios.get('/api/kitchen/orders');
            setOrders(response.data);
        } catch (error) {
            console.error("Error in loading orders for kitchen:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        // Reduce polling to fallback only
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    // WebSocket: Join kitchen room and listen for updates
    useEffect(() => {
        if (isConnected) {
            joinRoom('kitchen');
            console.log('🔌 Joined kitchen room');

            // Listen for new orders
            const handleOrderCreated = (order) => {
                console.log('🍴 New order received:', order);
                setOrders(prev => [order, ...prev]);
            };

            // Listen for order status updates
            const handleOrderStatusUpdated = (data) => {
                console.log('🔄 Order status updated:', data);
                
                if (data.status === 'PREPARING') {
                    // Order moved to PREPARING - add or update in kitchen list
                    setOrders(prev => {
                        const existingOrder = prev.find(o => o.id === data.orderId);
                        if (existingOrder) {
                            // Update existing order
                            return prev.map(o => o.id === data.orderId ? data.order : o);
                        } else {
                            // Add new order to kitchen
                            return [data.order, ...prev];
                        }
                    });
                } else {
                    // Order moved away from PREPARING - remove from kitchen
                    setOrders(prev => prev.filter(o => o.id !== data.orderId));
                }
            };

            // Listen for item status updates
            const handleItemStatusUpdated = (data) => {
                console.log('🍲 Item status updated:', data);
                setOrders(prev => prev.map(order => {
                    if (order.id === data.orderId) {
                        return {
                            ...order,
                            items: order.items.map(item =>
                                item.id === data.itemId ? { ...item, status: data.status } : item
                            )
                        };
                    }
                    return order;
                }));
            };

            on('order:created', handleOrderCreated);
            on('order:statusUpdated', handleOrderStatusUpdated);
            on('orderItem:statusUpdated', handleItemStatusUpdated);

            return () => {
                off('order:created', handleOrderCreated);
                off('order:statusUpdated', handleOrderStatusUpdated);
                off('orderItem:statusUpdated', handleItemStatusUpdated);
            };
        }
    }, [isConnected, joinRoom, on, off]);

    const handleOrderReady = async (orderId) => {
        await axios.post(`/api/kitchen/orders/${orderId}/ready`);
        setOrders(prev => prev.filter(o => o.id !== orderId));
    };

    const handleItemStatusUpdate = async (orderId, itemId, currentStatus) => {
        try {
            // Toggle between PENDING -> PREPARING -> READY
            let newStatus;
            if (currentStatus === 'PENDING') newStatus = 'PREPARING';
            else if (currentStatus === 'PREPARING') newStatus = 'READY';
            else return; // Already READY

            await axios.post(`/api/kitchen/orders/${orderId}/item/${itemId}/ready`);

            // Refresh orders to get updated data
            fetchOrders();
        } catch (error) {
            console.error("Error updating item status:", error);
            alert("Failed to update item status.");
        }
    };

    return (
        <div className="admin-container kitchen-page-container">
            <Sidebar />
            <div className="main-content">
                <header className="admin-header">
                    <div className="header-title">
                        <h1 className="page-title">Kitchen</h1>
                        <p className="page-subtitle">Kitchen Display System</p>
                    </div>
                    <div className="header-actions">
                        <span className="socket-status" style={{ 
                            marginRight: '15px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: isConnected ? '#27ae60' : '#e74c3c'
                        }}>
                            {isConnected ? '🟢 Live' : '🔴 Offline'}
                        </span>
                        <span className="kds-order-count-badge">
                            Pending orders: {orders.length}
                        </span>
                    </div>
                </header>

                {loading && <div className="kds-loading-state">Loading data...</div>}

                {!loading && orders.length === 0 ? (
                    <div className="kds-empty-state">
                        <p>No orders to prepare.</p>
                    </div>
                ) : (
                    <div className="kds-grid">
                        {orders.map(order => (
                            <KDSOrderCard
                                key={order.id}
                                order={order}
                                onReady={handleOrderReady}
                                onItemStatusUpdate={handleItemStatusUpdate}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const KDSOrderCard = ({ order, onReady, onItemStatusUpdate }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const start = new Date(order.confirmedAt || order.createdAt).getTime();
        const timer = setInterval(() => {
            setElapsed(Math.floor((Date.now() - start) / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, [order]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const statusClass = elapsed < 600 ? 'status-normal' : elapsed < 1200 ? 'status-warning' : 'status-danger';

    // Check if all items are ready
    const allItemsReady = order.items.every(item => item.status === 'READY');

    return (
        <div className={`kds-card ${statusClass}`}>
            <div className="kds-card-header">
                <div className="kds-table-info">
                    <span className="kds-table-label">Table</span>
                    <span className="kds-table-number">{order.table?.tableNumber || 'N/A'}</span>
                </div>
                <div className="kds-order-timer">{formatTime(elapsed)}</div>
            </div>

            <div className="kds-card-body">
                <div className="kds-order-meta">
                    <span>#{order.orderNumber}</span>
                    {order.customerName && <span> • {order.customerName}</span>}
                </div>
                <div className="kds-item-list">
                    {order.items.map(item => (
                        <div key={item.id} className={`kds-item item-status-${item.status?.toLowerCase() || 'pending'}`}>
                            <div className="kds-item-header">
                                <div className="kds-item-main">
                                    <span className="kds-item-qty">{item.quantity}x</span>
                                    <div className="kds-item-details">
                                        <span className="kds-item-name">{item.menuItemName}</span>
                                        {item.selectedModifiers?.length > 0 && (
                                            <ul className="kds-item-modifiers">
                                                {item.selectedModifiers.map(m => (
                                                    <li key={m.id}>{m.modifierOptionName}</li>
                                                ))}
                                            </ul>
                                        )}
                                        {item.specialRequest && (
                                            <p className="kds-special-request">📝 {item.specialRequest}</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    className={`kds-item-status-btn status-${item.status?.toLowerCase() || 'pending'}`}
                                    onClick={() => onItemStatusUpdate(order.id, item.id, item.status)}
                                    disabled={item.status === 'READY'}
                                >
                                    {item.status === 'PENDING' && '⏳ Not Ready'}
                                    {item.status === 'READY' && '✅ Ready'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="kds-card-footer">
                <button
                    className={`kds-btn-ready ${allItemsReady ? 'all-ready' : ''}`}
                    onClick={() => onReady(order.id)}
                    disabled={!allItemsReady}
                    title={allItemsReady ? 'Click để hoàn thành đơn' : 'Hoàn thành tất cả món trước'}
                >
                    {allItemsReady ? '✅ Finish order' : '⏳ All items not ready'}
                </button>
            </div>
        </div>
    );
};

export default KitchenStaffPage;
