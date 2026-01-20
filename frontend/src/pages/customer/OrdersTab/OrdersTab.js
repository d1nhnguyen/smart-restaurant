import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../../contexts/CartContext';
import { useCustomerAuth } from '../../../contexts/CustomerAuthContext';
import { useSocket } from '../../../hooks/useSocket';
import customerAuthService from '../../../services/customerAuthService';
import './OrdersTab.css';

const OrdersTab = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeOrders, unpaidOrders, table, refreshActiveOrder, refreshUnpaidOrders } = useCart();
  const { isAuthenticated, getToken } = useCustomerAuth();
  const { joinRoom, on, off, isConnected } = useSocket();

  const [orderHistory, setOrderHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  const fetchOrderHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true);
    try {
      const token = getToken();
      const response = await customerAuthService.getOrderHistory(page, 10, token);
      if (page === 1) {
        setOrderHistory(response.orders);
      } else {
        setOrderHistory(prev => [...prev, ...response.orders]);
      }
      setHistoryPage(page);
      setHistoryTotal(response.pagination.total);
    } catch (err) {
      console.error('Failed to fetch order history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [getToken]);

  // Fetch order history for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrderHistory();
    }
  }, [isAuthenticated, fetchOrderHistory]);

  // WebSocket: Listen for order updates
  useEffect(() => {
    if (table?.id && isConnected && activeOrders && activeOrders.length > 0) {
      activeOrders.forEach(order => {
        joinRoom('order', order.id);
      });

      const handleOrderStatusUpdated = () => {
        refreshActiveOrder(table.id);
        refreshUnpaidOrders(table.id);
      };

      on('order:statusUpdated', handleOrderStatusUpdated);
      on('order:ready', handleOrderStatusUpdated);

      return () => {
        off('order:statusUpdated', handleOrderStatusUpdated);
        off('order:ready', handleOrderStatusUpdated);
      };
    }
  }, [table?.id, isConnected, activeOrders, joinRoom, on, off, refreshActiveOrder, refreshUnpaidOrders]);

  // Calculate session totals
  const sessionTotal = unpaidOrders?.reduce((sum, order) => sum + Number(order.totalAmount), 0) || 0;
  const totalItems = unpaidOrders?.reduce((sum, order) => sum + order.items.length, 0) || 0;

  const getStatusColor = (status) => {
    const colors = {
      PENDING: '#f39c12',
      ACCEPTED: '#3498db',
      PREPARING: '#e67e22',
      READY: '#27ae60',
      SERVED: '#27ae60',
      COMPLETED: '#95a5a6',
      CANCELLED: '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  const getItemStatusIcon = (status) => {
    switch (status) {
      case 'PREPARING': return { icon: '\u{1F525}', label: 'Cooking' }; // Fire
      case 'PENDING': return { icon: '\u{23F1}', label: 'Queued' }; // Timer
      case 'READY': return { icon: '\u{2705}', label: 'Ready' }; // Check
      case 'SERVED': return { icon: '\u{2705}', label: 'Served' };
      default: return { icon: '\u{23F3}', label: status }; // Hourglass
    }
  };

  const renderOrderCard = (order, isHistory = false) => {
    const isActive = !isHistory && !['COMPLETED', 'CANCELLED'].includes(order.status);

    return (
      <div key={order.id} className={`order-card ${isHistory ? 'history' : ''}`}>
        <div className="order-card-header">
          <div className="order-info">
            <span className="order-number">
              {t('orderTracking.orderNumber', 'Order')} #{order.orderNumber}
            </span>
            <span className="order-time">
              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <span
            className="order-status-badge"
            style={{ backgroundColor: getStatusColor(order.status) }}
          >
            {order.status}
          </span>
        </div>

        {/* Progress Bar for active orders */}
        {isActive && (
          <div className="order-progress">
            <div className="progress-steps">
              {['PENDING', 'PREPARING', 'READY'].map((step, index) => {
                const stepOrder = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'];
                const currentIndex = stepOrder.indexOf(order.status);
                const stepIndex = stepOrder.indexOf(step);
                const isCompleted = stepIndex <= currentIndex;
                const isCurrent = step === order.status || (order.status === 'ACCEPTED' && step === 'PENDING');

                return (
                  <div key={step} className={`progress-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                    <div className="step-dot">
                      {isCompleted ? (
                        <span role="img" aria-label="check">&#10003;</span>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <span className="step-label">
                      {step === 'PENDING' ? t('orderStatus.received', 'Received') :
                        step === 'PREPARING' ? t('orderStatus.preparing', 'Preparing') :
                          t('orderStatus.ready', 'Ready')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Ready Message */}
        {order.status === 'READY' && (
          <div className="order-ready-message">
            <span role="img" aria-label="celebration">&#127881;</span>
            {t('orderTracking.readyMessage', 'Your order is ready! Please pick up at counter.')}
          </div>
        )}

        {/* Order Items */}
        <div className="order-items">
          {order.items.map((item) => {
            const itemStatus = getItemStatusIcon(item.status);
            return (
              <div key={item.id} className="order-item">
                <span className="item-qty">{item.quantity}x</span>
                <span className="item-name">{item.menuItemName}</span>
                {isActive && (
                  <span
                    className={`item-status ${item.status.toLowerCase()}`}
                    title={itemStatus.label}
                  >
                    {itemStatus.icon} {itemStatus.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="order-card-footer">
          <span className="order-total">
            {t('cart.total', 'Total')}: ${Number(order.totalAmount).toFixed(2)}
          </span>
          {!isHistory && (
            <button
              className="view-details-btn"
              onClick={() => navigate(`/order-status/${order.id}`)}
            >
              {t('common.viewDetails', 'View Details')}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="orders-tab">
      <header className="orders-header">
        <h1>{t('tabs.orders', 'Orders')}</h1>
        {table && <span className="table-badge">{t('menu.table', 'Table')} {table.tableNumber}</span>}
      </header>

      {/* Session Summary Card */}
      {unpaidOrders && unpaidOrders.length > 0 && (
        <div className="session-summary">
          <div className="summary-content">
            <div className="summary-total">
              <span className="total-label">{t('orders.sessionTotal', 'Session Total')}</span>
              <span className="total-amount">${sessionTotal.toFixed(2)}</span>
            </div>
            <div className="summary-stats">
              {unpaidOrders.length} {unpaidOrders.length > 1 ? t('orders.orders', 'Orders') : t('orders.order', 'Order')}, {totalItems} {t('orders.items', 'Items')}
            </div>
          </div>
          <button className="request-bill-btn" onClick={() => navigate('/c/checkout')}>
            {t('orders.requestBill', 'Request Bill')}
          </button>
        </div>
      )}

      {/* Active Orders */}
      {activeOrders && activeOrders.length > 0 && (
        <section className="orders-section">
          <h2 className="section-title">{t('orders.currentOrders', 'Current Orders')}</h2>
          <div className="orders-list">
            {activeOrders.map(order => renderOrderCard(order, false))}
          </div>
        </section>
      )}

      {/* Empty State for Current Session */}
      {(!activeOrders || activeOrders.length === 0) && (
        <div className="empty-orders">
          <div className="empty-icon">
            <span role="img" aria-label="clipboard">&#128203;</span>
          </div>
          <h3>{t('orders.noCurrentOrders', 'No current orders')}</h3>
          <p>{t('orders.startOrdering', 'Browse our menu to start ordering!')}</p>
          <button className="browse-btn" onClick={() => navigate('/c/menu')}>
            {t('cart.browseMenu', 'Browse Menu')}
          </button>
        </div>
      )}

      {/* Order History (Authenticated Users Only) */}
      {isAuthenticated && (
        <section className="orders-section history-section">
          <h2 className="section-title">{t('orders.orderHistory', 'Order History')}</h2>
          {historyLoading && orderHistory.length === 0 ? (
            <div className="loading-history">
              <div className="loading-spinner-small"></div>
              <span>{t('common.loading', 'Loading...')}</span>
            </div>
          ) : orderHistory.length > 0 ? (
            <>
              <div className="orders-list">
                {orderHistory.map(order => renderOrderCard(order, true))}
              </div>
              {orderHistory.length < historyTotal && (
                <button
                  className="load-more-btn"
                  onClick={() => fetchOrderHistory(historyPage + 1)}
                  disabled={historyLoading}
                >
                  {historyLoading ? t('common.loading', 'Loading...') : t('common.loadMore', 'Load More')}
                </button>
              )}
            </>
          ) : (
            <p className="no-history">{t('orders.noHistory', 'No order history yet')}</p>
          )}
        </section>
      )}

      {/* Login Prompt for Guests */}
      {!isAuthenticated && (
        <div className="login-prompt">
          <span className="prompt-icon" role="img" aria-label="lock">&#128274;</span>
          <p>{t('auth.guestMessage', 'Login to view your order history')}</p>
          <button className="login-btn" onClick={() => navigate('/c/profile')}>
            {t('auth.signIn', 'Sign In')}
          </button>
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
