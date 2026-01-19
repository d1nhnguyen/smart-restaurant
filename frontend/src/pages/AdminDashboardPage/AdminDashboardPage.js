import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import { useSocket } from '../../hooks/useSocket';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { isConnected, on, off } = useSocket();
  const [loading, setLoading] = useState(true);

  // Đảm bảo khởi tạo các mảng là mảng trống để tránh lỗi .map()
  const [dashboardData, setDashboardData] = useState({
    stats: { revenue: 0, orders: 0, activeTables: 0 },
    tables: [],
    recentOrders: []
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/orders/dashboard/stats');
      // Chỉ cập nhật nếu dữ liệu trả về tồn tại
      if (response.data) {
        setDashboardData({
          stats: response.data.stats || { revenue: 0, orders: 0, activeTables: 0 },
          tables: response.data.tables || [], // Bảo vệ mảng tables
          recentOrders: response.data.recentOrders || [] // Bảo vệ mảng recentOrders
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (isConnected) {
      const handleUpdate = () => fetchDashboardData();
      on('order:created', handleUpdate);
      on('order:statusUpdated', handleUpdate);
      on('table:statusUpdated', handleUpdate);
      return () => {
        off('order:created', handleUpdate);
        off('order:statusUpdated', handleUpdate);
        off('table:statusUpdated', handleUpdate);
      };
    }
  }, [isConnected, fetchDashboardData, on, off]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return '#27ae60';
      case 'OCCUPIED': return '#e74c3c';
      case 'CLEANING':
      case 'RESERVED': return '#f39c12';
      case 'INACTIVE': return '#95a5a6';
      default: return '#bdc3c7';
    }
  };

  if (loading) return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">Loading system data...</div>
    </div>
  );

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">
        <header className="admin-header">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">Real-time business overview.</p>
          </div>
          <div className={`status-badge ${isConnected ? 'active' : 'inactive'}`}>
            {isConnected ? '🟢 Live' : '🔴 Offline'}
          </div>
        </header>

        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div className="stat-card">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">${(dashboardData.stats?.revenue || 0).toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{dashboardData.stats?.orders || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Occupied Tables</div>
            <div className="stat-value">{dashboardData.stats?.activeTables || 0}</div>
          </div>
        </div>

        <div className="table-card">
          <div className="table-header">
            <h3>Recent Orders</h3>
            <button className="view-all" onClick={() => navigate('/orders')}>View All →</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Table</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Kiểm tra độ dài mảng an toàn */}
              {dashboardData.recentOrders?.length > 0 ? (
                dashboardData.recentOrders.map(order => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 'bold' }}>{order.orderNumber}</td>
                    <td>Table {order.table?.tableNumber || 'N/A'}</td>
                    <td>${Number(order.totalAmount || 0).toFixed(2)}</td>
                    <td><span className={`status-badge ${(order.status || '').toLowerCase()}`}>{order.status}</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--gray)' }}>No recent activities found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h3 style={{ marginBottom: '15px' }}>Live Table Status Map</h3>
        <div className="tables-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px', marginBottom: '35px' }}>
          {/* Sử dụng optional chaining ?. để an toàn */}
          {dashboardData.tables?.map((table) => (
            <div key={table.id} className="table-tile" style={{ borderTop: `5px solid ${getStatusColor(table.status)}`, padding: '20px 10px', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
              <div style={{ fontSize: '11px', color: 'var(--gray)', fontWeight: 'bold' }}>TABLE</div>
              <div style={{ fontSize: '26px', fontWeight: '800', margin: '5px 0' }}>{table.tableNumber}</div>
              <div style={{ fontSize: '10px', color: getStatusColor(table.status), fontWeight: '700', textTransform: 'uppercase' }}>
                {table.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;