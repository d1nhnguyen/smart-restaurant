import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { orderService } from '../../services/orderService';
import { useCart } from '../../contexts/CartContext';
import { useSocket } from '../../hooks/useSocket';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import './OrderTrackingPage.css';

const OrderTrackingPage = () => {
    const { t } = useTranslation();
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
            setError(t('orderTracking.errorLoading'));
        } finally {
            setLoading(false);
        }
    }, [orderId, t]);

    useEffect(() => {
        fetchOrder();
        const interval = setInterval(fetchOrder, 30000);
        return () => clearInterval(interval);
    }, [fetchOrder]);

    useEffect(() => {
        if (orderId && isConnected) {
            joinRoom('order', orderId);

            const handleStatusUpdate = (data) => {
                if (data.orderId === orderId) {
                    setOrder(data.order);
                    if (data.status === 'READY') {
                        setNotification(`🔔 ${t('orderTracking.orderReady')}`);
                    } else {
                        setNotification(`${t('orderTracking.status')}: ${data.status}`);
                    }
                    setTimeout(() => setNotification(null), 5000);
                }
            };

            const handleOrderReady = (data) => {
                if (data.orderId === orderId) {
                    setOrder(data.order);
                    setNotification(`🎉 ${t('orderTracking.orderReadyPickup')}`);
                    setTimeout(() => setNotification(null), 8000);
                }
            };

            const handleItemStatusUpdated = (data) => {
                if (data.orderId === orderId) {
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
    }, [orderId, isConnected, joinRoom, on, off, fetchOrder, t]);

    const handleCallWaiter = () => {
        if (order?.table) {
            callWaiter(order.table.id, order.table.tableNumber);
            setNotification(`✅ ${t('orderTracking.waiterNotified')}`);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    useEffect(() => {
        if (order?.table && !table) {
            setTable(order.table.id, order.table.tableNumber);
        }
    }, [order, table, setTable]);

    if (loading) return (
        <div className="loading-container">
            <div className="spinner"></div>
            <p>{t('orderTracking.fetchingStatus')}</p>
        </div>
    );

    if (error || !order) return (
        <div className="error-container">
            <h2>⚠️ {error || t('orderTracking.notFound')}</h2>
            <button onClick={() => navigate('/menu')}>{t('orderTracking.backToMenu')}</button>
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

            {/* Language Switcher */}
            <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1100 }}>
                <LanguageSwitcher />
            </div>

            <header className="tracking-header">
                <button onClick={() => navigate('/menu')} className="back-button">← {t('menu.title')}</button>
                <h1>{t('orderTracking.title')}</h1>
                <div className="socket-indicator">
                    {isConnected ? (
                        <span className="status-online">🟢 {t('orderTracking.live')}</span>
                    ) : (
                        <span className="status-offline">🔴 {t('orderTracking.offline')}</span>
                    )}
                </div>
            </header>

            <div className="tracking-content">
                <div className="order-info-section">
                    <h2>{t('orderTracking.orderNumber')} #{order.orderNumber}</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="label">{t('menu.table')}:</span>
                            <span className="value">{order.table?.tableNumber || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">{t('orderTracking.time')}:</span>
                            <span className="value">{new Date(order.orderDate).toLocaleTimeString()}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">{t('cart.total')}:</span>
                            <span className="value">${Number(order.totalAmount).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className={`payment-status-card ${order.paymentStatus?.toLowerCase() || 'pending'}`}>
                    <div className="payment-status-icon">
                        {order.paymentStatus === 'PAID' ? '✅' : '💳'}
                    </div>
                    <div className="payment-status-text">
                        <h3>{order.paymentStatus === 'PAID' ? t('orderTracking.paid') : t('orderTracking.unpaid')}</h3>
                        <p>{order.paymentStatus === 'PAID' ? t('orderTracking.thankYou') : t('orderTracking.payAtCounter')}</p>
                    </div>
                </div>

                <div className="status-banner">
                    <h3>{t('orderTracking.orderStatus')}</h3>
                    <div className={`status-label status-${order.status.toLowerCase()}`}>{order.status}</div>
                    <div className="progress-bar">
                        {[0, 1, 2, 3, 4].map((step) => (
                            <div key={step} className={`step ${step <= currentStep ? 'active' : ''}`}></div>
                        ))}
                    </div>
                    <div className="status-labels">
                        <span className={currentStep >= 0 ? 'active' : ''}>{t('orderTracking.pending')}</span>
                        <span className={currentStep >= 1 ? 'active' : ''}>{t('orderTracking.accepted')}</span>
                        <span className={currentStep >= 2 ? 'active' : ''}>{t('orderTracking.preparing')}</span>
                        <span className={currentStep >= 3 ? 'active' : ''}>{t('orderTracking.ready')}</span>
                        <span className={currentStep >= 4 ? 'active' : ''}>{t('orderTracking.served')}</span>
                    </div>
                </div>

                <div className="items-tracking">
                    <h3>{t('orderTracking.items')}</h3>
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
                    📞 {t('orderTracking.callWaiter')}
                </button>

                <div className="order-summary-card">
                    <div className="summary-row"><span>{t('cart.subtotal')}</span><span>${Number(order.subtotalAmount).toFixed(2)}</span></div>
                    <div className="summary-row total"><span>{t('orderTracking.totalPaid')}</span><span>${Number(order.totalAmount).toFixed(2)}</span></div>
                </div>

                <div className="tracking-actions">
                    <button className="add-more-btn" onClick={() => navigate('/menu')}>{t('orderTracking.addMore')}</button>
                    {order.status === 'SERVED' && (
                        <button className="bill-btn">{t('orderTracking.requestBill')}</button>
                    )}
                </div>

                <p className="refresh-note">{t('orderTracking.realTimeUpdates')}</p>
            </div>
        </div>
    );
};

export default OrderTrackingPage;
