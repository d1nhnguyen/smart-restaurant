import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar'; // Sử dụng Sidebar chung của hệ thống
import './KDSPage.css'; // File CSS riêng cho logic màu sắc KDS

const KDSPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await axios.get('/api/kitchen/orders');
      setOrders(response.data);
    } catch (error) {
      console.error("Lỗi khi tải đơn hàng bếp:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Polling mỗi 5 giây
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleOrderReady = async (orderId) => {
    if (!window.confirm("Xác nhận đơn hàng này đã sẵn sàng?")) return;
    try {
      await axios.post(`/api/kitchen/orders/${orderId}/ready`);
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (error) {
      alert("Không thể cập nhật trạng thái đơn hàng.");
    }
  };

  return (
    <div className="admin-container">
      <Sidebar />
      <div className="main-content">
        <header className="admin-header">
          <div className="header-title">
            <h1 className="admin-title">Màn Hình Nhà Bếp (KDS)</h1>
            <p className="admin-subtitle">Theo dõi và chế biến các đơn hàng đang chuẩn bị</p>
          </div>
          <div className="header-actions">
            <span className="order-count-badge">
              Đang chờ: {orders.length} đơn
            </span>
          </div>
        </header>

        {loading && <div className="loading-state">Đang tải dữ liệu...</div>}

        {!loading && orders.length === 0 ? (
          <div className="empty-state">
            <p>Hiện không có đơn hàng nào cần chế biến.</p>
          </div>
        ) : (
          <div className="kds-grid">
            {orders.map(order => (
              <KDSOrderCard key={order.id} order={order} onReady={handleOrderReady} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const KDSOrderCard = ({ order, onReady }) => {
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

  return (
    <div className={`kds-card ${statusClass}`}>
      <div className="kds-card-header">
        <div className="table-info">
          <span className="table-label">BÀN</span>
          <span className="table-number">{order.table?.tableNumber || 'N/A'}</span>
        </div>
        <div className="order-timer">{formatTime(elapsed)}</div>
      </div>
      
      <div className="kds-card-body">
        <div className="order-meta">
          <span>#{order.orderNumber}</span>
          {order.customerName && <span> • {order.customerName}</span>}
        </div>
        <div className="item-list">
          {order.items.map(item => (
            <div key={item.id} className="kds-item">
              <span className="item-qty">{item.quantity}x</span>
              <div className="item-details">
                <span className="item-name">{item.menuItemName}</span>
                {item.selectedModifiers?.length > 0 && (
                  <ul className="item-modifiers">
                    {item.selectedModifiers.map(m => (
                      <li key={m.id}>{m.modifierOptionName}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="kds-card-footer">
        <button className="btn-ready" onClick={() => onReady(order.id)}>
          HOÀN THÀNH
        </button>
      </div>
    </div>
  );
};

export default KDSPage;