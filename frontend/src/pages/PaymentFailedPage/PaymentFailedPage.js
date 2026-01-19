import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import './PaymentFailedPage.css';

const PaymentFailedPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { error } = location.state || {};

  return (
    <div className="payment-result-page">
      {/* Language Switcher */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1100 }}>
        <LanguageSwitcher />
      </div>

      <div className="result-container failed">
        <div className="result-icon">❌</div>
        <h1>{t('payment.failed')}</h1>
        <p className="result-message">
          {error || t('payment.failedMessage')}
        </p>

        <div className="action-buttons">
          <button className="primary-btn" onClick={() => navigate('/checkout')}>
            {t('payment.retry')}
          </button>
          <button className="secondary-btn" onClick={() => navigate('/menu')}>
            {t('orderConfirm.backToMenu')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailedPage;
