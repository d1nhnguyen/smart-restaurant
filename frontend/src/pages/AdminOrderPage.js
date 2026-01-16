import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import OrderCard from '../components/OrderCard';
import { useSocket } from '../hooks/useSocket';
import './AdminOrderPage.css';

const AdminOrderPage = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const { joinRoom, on, off, isConnected } = useSocket();

    const API_BASE_URL = 'http://localhost:3000/api';

    // Fetch orders from API
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/orders`);
            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }
            const data = await response.json();
            setOrders(data);
            filterOrders(data, activeTab);
            setError(null);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Filter orders based on active tab
    const filterOrders = (ordersList, tab) => {
        let filtered = [];
        switch (tab) {
            case 'new':
                filtered = ordersList.filter(o => o.status === 'PENDING');
                break;
            case 'accepted':
                filtered = ordersList.filter(o => o.status === 'ACCEPTED');
                break;
            case 'preparing':
                filtered = ordersList.filter(o => o.status === 'PREPARING');
                break;
            case 'ready':
                filtered = ordersList.filter(o => o.status === 'READY');
                break;
            case 'served':
                filtered = ordersList.filter(o => o.status === 'SERVED');
                break;
            case 'completed':
                filtered = ordersList.filter(o => o.status === 'COMPLETED');
                break;
            case 'cancelled':
                filtered = ordersList.filter(o => o.status === 'CANCELLED');
                break;
            default:
                filtered = ordersList;
        }
        setFilteredOrders(filtered);
    };

    // Handle tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        filterOrders(orders, tab);
    };

    // Handle order action
    const handleOrderAction = async (orderId, action) => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to ${action} order`);
            }

            // Refresh orders after action
            fetchOrders();
        } catch (err) {
            console.error(`Error ${action} order:`, err);
            alert(`Failed to ${action} order: ${err.message}`);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchOrders();
    }, []);

    // Auto-refresh (reduced to fallback)
    useEffect(() => {
        const interval = setInterval(() => {
            fetchOrders();
        }, 30000); // 30 seconds as fallback

        return () => clearInterval(interval);
    }, [activeTab]);

    // WebSocket: Join admin room and listen for updates
    useEffect(() => {
        if (isConnected) {
            joinRoom('admin');
            console.log('🔌 Joined admin room');

            // Listen for new orders
            const handleOrderCreated = (order) => {
                console.log('🍴 New order received:', order);
                setOrders(prev => {
                    const updated = [order, ...prev];
                    filterOrders(updated, activeTab);
                    return updated;
                });
            };

            // Listen for order status updates
            const handleOrderStatusUpdated = (data) => {
                console.log('🔄 Order status updated:', data);
                setOrders(prev => {
                    const updated = prev.map(o => 
                        o.id === data.orderId ? data.order : o
                    );
                    filterOrders(updated, activeTab);
                    return updated;
                });
            };

            // Listen for item status updates
            const handleItemStatusUpdated = (data) => {
                console.log('🍲 Item status updated:', data);
                setOrders(prev => {
                    const updated = prev.map(order => {
                        if (order.id === data.orderId) {
                            return {
                                ...order,
                                items: order.items.map(item =>
                                    item.id === data.itemId ? { ...item, status: data.status } : item
                                )
                            };
                        }
                        return order;
                    });
                    filterOrders(updated, activeTab);
                    return updated;
                });
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
    }, [isConnected, activeTab, joinRoom, on, off]);

    // Calculate stats
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'PENDING').length,
        preparing: orders.filter(o => o.status === 'PREPARING').length,
        ready: orders.filter(o => o.status === 'READY').length,
    };

    return (
        <div className="admin-layout">
            <Sidebar />
            <div className="admin-content">
                <div className="admin-header">
                    <div>
                        <h1>📋 Order Management</h1>
                        <p className="page-subtitle">
                            View and manage all restaurant orders
                            <span style={{
                                marginLeft: '15px',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: isConnected ? '#27ae60' : '#e74c3c'
                            }}>
                                {isConnected ? '🟢 Live' : '🔴 Offline'}
                            </span>
                        </p>
                    </div>
                    <div className="order-stats">
                        <div className="stat-card">
                            <div className="stat-value">{stats.pending}</div>
                            <div className="stat-label">New Orders</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{stats.preparing}</div>
                            <div className="stat-label">Preparing</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{stats.ready}</div>
                            <div className="stat-label">Ready</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{stats.total}</div>
                            <div className="stat-label">Total</div>
                        </div>
                    </div>
                </div>

                <div className="order-tabs">
                    <button
                        className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => handleTabChange('all')}
                    >
                        All ({orders.length})
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'new' ? 'active' : ''}`}
                        onClick={() => handleTabChange('new')}
                    >
                        New ({stats.pending})
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'accepted' ? 'active' : ''}`}
                        onClick={() => handleTabChange('accepted')}
                    >
                        Accepted ({orders.filter(o => o.status === 'ACCEPTED').length})
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'preparing' ? 'active' : ''}`}
                        onClick={() => handleTabChange('preparing')}
                    >
                        Preparing ({stats.preparing})
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'ready' ? 'active' : ''}`}
                        onClick={() => handleTabChange('ready')}
                    >
                        Ready ({stats.ready})
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'served' ? 'active' : ''}`}
                        onClick={() => handleTabChange('served')}
                    >
                        Served ({orders.filter(o => o.status === 'SERVED').length})
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
                        onClick={() => handleTabChange('completed')}
                    >
                        Completed ({orders.filter(o => o.status === 'COMPLETED').length})
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'cancelled' ? 'active' : ''}`}
                        onClick={() => handleTabChange('cancelled')}
                    >
                        Cancelled ({orders.filter(o => o.status === 'CANCELLED').length})
                    </button>
                </div>

                <div className="orders-container">
                    {loading && <div className="loading-message">Loading orders...</div>}
                    {error && <div className="error-message">Error: {error}</div>}
                    {!loading && !error && filteredOrders.length === 0 && (
                        <div className="empty-message">
                            <span style={{ fontSize: '48px' }}>📭</span>
                            <p>No orders found</p>
                        </div>
                    )}
                    {!loading && !error && filteredOrders.length > 0 && (
                        <div className="orders-grid">
                            {filteredOrders.map(order => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onAction={handleOrderAction}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminOrderPage;
