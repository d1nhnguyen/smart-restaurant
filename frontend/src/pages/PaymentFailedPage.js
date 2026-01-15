import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PaymentFailedPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Lấy thông tin lỗi từ state (nếu có)
  const { error } = location.state || { error: "Đã có lỗi xảy ra trong quá trình xử lý giao dịch." };

  return (
    <div className="result-container" style={{ 
      textAlign: 'center', 
      padding: '50px',
      maxWidth: '500px',
      margin: '0 auto' 
    }}>
      <div style={{ fontSize: '72px', color: '#e74c3c', marginBottom: '20px' }}>❌</div>
      <h1 style={{ color: '#c0392b' }}>Thanh toán thất bại</h1>
      
      <div className="error-box" style={{ 
        background: '#fdf2f2', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #facccc',
        margin: '20px 0'
      }}>
        <p style={{ color: '#721c24' }}>{error}</p>
      </div>

      <p>Vui lòng kiểm tra lại số dư tài khoản hoặc thử phương thức thanh toán khác.</p>

      <div style={{ display: 'grid', gap: '10px', marginTop: '30px' }}>
        <button 
          className="btn-primary" 
          onClick={() => navigate('/checkout', { state: location.state })}
          style={{ padding: '12px', background: '#e67e22', border: 'none', borderRadius: '5px', color: 'white', cursor: 'pointer' }}
        >
          Thử lại thanh toán
        </button>
        
        <button 
          onClick={() => navigate('/menu')}
          style={{ padding: '12px', background: '#ecf0f1', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Quay lại thực đơn
        </button>
      </div>
    </div>
  );
};

export default PaymentFailedPage;