import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import './PaymentSuccessPage.css';

const PaymentSuccessPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { orders, totalAmount } = location.state || {};

  return (
    <div className="payment-result-page">
      {/* Language Switcher */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1100 }}>
        <LanguageSwitcher />
      </div>

      <div className="result-container success">
        <div className="result-icon">✅</div>
        <h1>{t('payment.success')}</h1>
        <p className="result-message">{t('payment.successMessage')}</p>

        {orders && orders.length > 0 && (
          <div className="order-details">
            <h3>{t('payment.paidOrders')}</h3>
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-item">
                  <span className="order-number">#{order.orderNumber}</span>
                  <span className="order-amount">${Number(order.totalAmount).toFixed(2)}</span>
                </div>
              ))}
            </div>
            {totalAmount && (
              <div className="total-paid">
                <strong>{t('orderTracking.totalPaid')}:</strong> ${totalAmount.toFixed(2)}
              </div>
            )}
          </div>
        )}

        <div className="action-buttons">
          <button className="primary-btn" onClick={() => navigate('/menu')}>
            {t('orderConfirm.backToMenu')}
          </button>
          {orders && orders.length > 0 && (
            <button className="secondary-btn" onClick={() => navigate(`/order-status/${orders[0].id}`)}>
              {t('payment.viewOrder')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
