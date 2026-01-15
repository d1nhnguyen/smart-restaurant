import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PaymentSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { order } = location.state || { order: { orderNumber: 'N/A' } };

  return (
    <div className="result-container" style={{ textAlign: 'center', padding: '50px' }}>
      <div style={{ fontSize: '64px', color: '#27ae60' }}>✔️</div>
      <h1>Thanh toán thành công!</h1>
      <p>Mã đơn hàng: <strong>#{order.orderNumber}</strong></p>
      <p>Cảm ơn bạn đã sử dụng dịch vụ. Món ăn đang được chuẩn bị!</p>
      <button 
        className="btn-primary" 
        onClick={() => navigate('/')}
        style={{ marginTop: '20px', padding: '10px 30px' }}
      >
        Quay về Trang chủ
      </button>
    </div>
  );
};

export default PaymentSuccessPage;