import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PaymentFailedPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { error } = location.state || { error: "Đã có lỗi xảy ra trong quá trình xử lý giao dịch." };
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowContent(true), 100);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #fc5c7d 0%, #6a82fb 100%)',
      padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '60px 40px',
        maxWidth: '550px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        transform: showContent ? 'scale(1)' : 'scale(0.9)',
        opacity: showContent ? 1 : 0,
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        {/* Animated Error Icon */}
        <div style={{
          width: '100px',
          height: '100px',
          margin: '0 auto 30px',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'shake 0.6s ease-out',
          boxShadow: '0 10px 30px rgba(245, 87, 108, 0.4)'
        }}>
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#1a202c',
          margin: '0 0 12px',
          letterSpacing: '-0.5px'
        }}>
          Thanh toán thất bại
        </h1>

        <p style={{
          fontSize: '16px',
          color: '#718096',
          margin: '0 0 24px'
        }}>
          Đã có lỗi xảy ra trong quá trình xử lý
        </p>

        {/* Error Box */}
        <div style={{
          background: 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)',
          borderRadius: '16px',
          padding: '20px 24px',
          margin: '24px 0',
          border: '2px solid #fc8181',
          boxShadow: '0 4px 12px rgba(252, 129, 129, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '24px', flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: '600',
                color: '#c53030',
                marginBottom: '4px'
              }}>
                CHI TIẾT LỖI
              </p>
              <p style={{
                margin: 0,
                fontSize: '15px',
                color: '#822727',
                lineHeight: '1.5'
              }}>
                {error}
              </p>
            </div>
          </div>
        </div>

        {/* Helpful Message */}
        <div style={{
          background: '#f7fafc',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '32px',
          borderLeft: '4px solid #4299e1'
        }}>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#2d3748',
            lineHeight: '1.6'
          }}>
            💡 <strong>Gợi ý:</strong> Vui lòng kiểm tra số dư tài khoản hoặc thử phương thức thanh toán khác.
            Nếu vấn đề vẫn tiếp diễn, hãy liên hệ nhân viên để được hỗ trợ.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => navigate('/checkout', { state: location.state })}
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(245, 87, 108, 0.4)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(245, 87, 108, 0.6)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(245, 87, 108, 0.4)';
            }}
          >
            🔄 Thử lại thanh toán
          </button>

          <button
            onClick={() => navigate('/menu')}
            style={{
              background: '#fff',
              color: '#4a5568',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#f7fafc';
              e.target.style.borderColor = '#cbd5e0';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#fff';
              e.target.style.borderColor = '#e2e8f0';
            }}
          >
            📋 Quay lại thực đơn
          </button>
        </div>

        {/* Support Link */}
        <p style={{
          marginTop: '24px',
          fontSize: '13px',
          color: '#a0aec0',
          textAlign: 'center'
        }}>
          Cần hỗ trợ? <span style={{ color: '#667eea', cursor: 'pointer', fontWeight: '600' }}>Liên hệ nhân viên</span>
        </p>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
};

export default PaymentFailedPage;