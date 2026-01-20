import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import customerAuthService from '../../../services/customerAuthService';
import PasswordStrengthIndicator from '../../../components/customer/PasswordStrengthIndicator';
import './ResetPasswordPage.css';

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('validating'); // 'validating' | 'valid' | 'invalid' | 'success' | 'error'
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setStatus('invalid');
        setErrorMessage(t('auth.invalidResetLink', 'Invalid password reset link'));
        return;
      }

      try {
        const result = await customerAuthService.validateResetToken(token);
        if (result.valid) {
          setStatus('valid');
          setEmail(result.email);
        } else {
          setStatus('invalid');
          setErrorMessage(result.message || t('auth.invalidResetLink', 'Invalid or expired reset link'));
        }
      } catch (err) {
        setStatus('invalid');
        setErrorMessage(t('auth.invalidResetLink', 'Invalid or expired reset link'));
      }
    };

    validateToken();
  }, [token, t]);

  const validatePassword = (password) => {
    return password.length >= 8 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.password) {
      errors.password = t('auth.passwordRequired', 'Password is required');
    } else if (!validatePassword(formData.password)) {
      errors.password = t('auth.passwordWeak', 'Password must be at least 8 characters with uppercase, lowercase, and number');
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t('auth.passwordMismatch', 'Passwords do not match');
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await customerAuthService.resetPassword(token, formData.password);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.response?.data?.message || t('auth.resetFailed', 'Failed to reset password. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderValidating = () => (
    <div className="reset-status">
      <div className="spinner"></div>
      <h2>{t('auth.validatingLink', 'Validating reset link...')}</h2>
    </div>
  );

  const renderInvalid = () => (
    <div className="reset-status">
      <span className="status-icon error" role="img" aria-label="error">&#10007;</span>
      <h2>{t('auth.invalidLink', 'Invalid Link')}</h2>
      <p>{errorMessage}</p>
      <button className="auth-btn auth-btn-primary" onClick={() => navigate('/c/auth')}>
        {t('auth.backToLogin', 'Back to Login')}
      </button>
    </div>
  );

  const renderSuccess = () => (
    <div className="reset-status">
      <span className="status-icon success" role="img" aria-label="success">&#10003;</span>
      <h2>{t('auth.passwordResetSuccess', 'Password Reset!')}</h2>
      <p>{t('auth.passwordResetSuccessMsg', 'Your password has been successfully reset. You can now log in with your new password.')}</p>
      <button className="auth-btn auth-btn-primary" onClick={() => navigate('/c/auth')}>
        {t('auth.goToLogin', 'Go to Login')}
      </button>
    </div>
  );

  const renderError = () => (
    <div className="reset-status">
      <span className="status-icon error" role="img" aria-label="error">&#10007;</span>
      <h2>{t('auth.resetFailed', 'Reset Failed')}</h2>
      <p>{errorMessage}</p>
      <button className="auth-btn auth-btn-secondary" onClick={() => setStatus('valid')}>
        {t('common.tryAgain', 'Try Again')}
      </button>
    </div>
  );

  const renderForm = () => (
    <div className="reset-form-container">
      <h2 className="reset-title">{t('auth.createNewPassword', 'Create New Password')}</h2>
      <p className="reset-subtitle">
        {t('auth.resetFor', 'Resetting password for')}: <strong>{email}</strong>
      </p>

      <form onSubmit={handleSubmit} className="reset-form">
        <div className="form-group">
          <label htmlFor="password">{t('auth.newPassword', 'New Password')}</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={t('auth.newPasswordPlaceholder', 'Enter new password')}
              autoComplete="new-password"
              className={formErrors.password ? 'error' : ''}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <span role="img" aria-label="hide">&#128065;</span>
              ) : (
                <span role="img" aria-label="show">&#128064;</span>
              )}
            </button>
          </div>
          <PasswordStrengthIndicator password={formData.password} />
          <p className="password-requirements">
            {t('auth.passwordRequirements', 'Min 8 characters with uppercase, lowercase, and number')}
          </p>
          {formErrors.password && <span className="field-error">{formErrors.password}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">{t('auth.confirmPassword', 'Confirm Password')}</label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder={t('auth.confirmPasswordPlaceholder', 'Confirm your password')}
            autoComplete="new-password"
            className={formErrors.confirmPassword ? 'error' : ''}
          />
          {formErrors.confirmPassword && <span className="field-error">{formErrors.confirmPassword}</span>}
        </div>

        <button
          type="submit"
          className="auth-btn auth-btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('auth.resetting', 'Resetting...') : t('auth.resetPassword', 'Reset Password')}
        </button>
      </form>
    </div>
  );

  return (
    <div className="reset-password-page">
      <div className="reset-container">
        <div className="reset-logo">
          <span role="img" aria-label="restaurant">&#127861;</span>
          <span>Smart Restaurant</span>
        </div>

        {status === 'validating' && renderValidating()}
        {status === 'invalid' && renderInvalid()}
        {status === 'valid' && renderForm()}
        {status === 'success' && renderSuccess()}
        {status === 'error' && renderError()}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
