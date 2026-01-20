import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import customerAuthService from '../../../services/customerAuthService';
import './VerifyEmailPage.css';

const VerifyEmailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error' | 'already_verified'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage(t('auth.invalidVerifyLink', 'Invalid verification link'));
        return;
      }

      try {
        const result = await customerAuthService.verifyEmail(token);
        if (result.alreadyVerified) {
          setStatus('already_verified');
        } else {
          setStatus('success');
        }
      } catch (err) {
        // Check if error message indicates already verified
        const errMsg = err.response?.data?.message || '';
        if (errMsg.toLowerCase().includes('already verified')) {
          setStatus('already_verified');
        } else {
          setStatus('error');
          setErrorMessage(errMsg || t('auth.verifyFailed', 'Email verification failed'));
        }
      }
    };

    verifyEmail();
  }, [token, t]);

  const renderVerifying = () => (
    <div className="verify-status">
      <div className="spinner"></div>
      <h2>{t('auth.verifyingEmail', 'Verifying your email...')}</h2>
      <p>{t('auth.pleaseWait', 'Please wait a moment')}</p>
    </div>
  );

  const renderSuccess = () => (
    <div className="verify-status">
      <span className="status-icon success" role="img" aria-label="success">&#10003;</span>
      <h2>{t('auth.emailVerified', 'Email Verified!')}</h2>
      <p>{t('auth.emailVerifiedMsg', 'Your email has been successfully verified. You can now enjoy all features of your account.')}</p>
      <button className="auth-btn auth-btn-primary" onClick={() => navigate('/c/menu')}>
        {t('auth.continueShopping', 'Continue to Menu')}
      </button>
    </div>
  );

  const renderAlreadyVerified = () => (
    <div className="verify-status">
      <span className="status-icon info" role="img" aria-label="info">&#9989;</span>
      <h2>{t('auth.alreadyVerified', 'Already Verified')}</h2>
      <p>{t('auth.alreadyVerifiedMsg', 'Your email has already been verified. No further action is needed.')}</p>
      <button className="auth-btn auth-btn-primary" onClick={() => navigate('/c/menu')}>
        {t('auth.continueShopping', 'Continue to Menu')}
      </button>
    </div>
  );

  const renderError = () => (
    <div className="verify-status">
      <span className="status-icon error" role="img" aria-label="error">&#10007;</span>
      <h2>{t('auth.verificationFailed', 'Verification Failed')}</h2>
      <p>{errorMessage}</p>
      <div className="error-actions">
        <button className="auth-btn auth-btn-secondary" onClick={() => navigate('/c/auth')}>
          {t('auth.backToLogin', 'Back to Login')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="verify-email-page">
      <div className="verify-container">
        <div className="verify-logo">
          <span role="img" aria-label="restaurant">&#127861;</span>
          <span>Smart Restaurant</span>
        </div>

        {status === 'verifying' && renderVerifying()}
        {status === 'success' && renderSuccess()}
        {status === 'already_verified' && renderAlreadyVerified()}
        {status === 'error' && renderError()}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
