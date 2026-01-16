import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PaymentSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Expect orders array and totalAmount from CheckoutPage
  const { orders, totalAmount } = location.state || {
    orders: [],
    totalAmount: 0
  };

  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    setTimeout(() => setShowContent(true), 100);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '60px 40px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        transform: showContent ? 'scale(1)' : 'scale(0.9)',
        opacity: showContent ? 1 : 0,
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        {/* Animated Success Icon */}
        <div style={{
          width: '100px',
          height: '100px',
          margin: '0 auto 30px',
          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'bounce 0.6s ease-out',
          boxShadow: '0 10px 30px rgba(17, 153, 142, 0.4)'
        }}>
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#1a202c',
          margin: '0 0 8px',
          letterSpacing: '-0.5px',
          textAlign: 'center'
        }}>
          Thanh toán thành công!
        </h1>

        <p style={{
          fontSize: '14px',
          color: '#718096',
          textAlign: 'center',
          margin: '0 0 24px'
        }}>
          Đơn hàng đã được gửi đến bếp
        </p>

        {/* Orders List */}
        <div style={{
          background: '#f7fafc',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#718096',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 12px'
          }}>
            Đơn hàng đã thanh toán
          </p>

          {orders.map((order, index) => (
            <div key={order.id || index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: index < orders.length - 1 ? '1px solid #e2e8f0' : 'none'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#2d3748'
              }}>
                #{order.orderNumber}
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#667eea'
              }}>
                ${Number(order.totalAmount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Total Amount */}
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '600',
            letterSpacing: '0.5px'
          }}>
            Tổng thanh toán
          </span>
          <span style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#fff',
            letterSpacing: '0.5px'
          }}>
            ${totalAmount.toFixed(2)}
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => navigate('/menu')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            }}
          >
            �️ Quay về Menu
          </button>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-20px); }
          60% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default PaymentSuccessPage;