import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCustomerAuth } from '../../../contexts/CustomerAuthContext';
import { useCart } from '../../../contexts/CartContext';
import PasswordStrengthIndicator from '../../../components/customer/PasswordStrengthIndicator';
import './CustomerAuthPage.css';

const CustomerAuthPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, register, continueAsGuest, isLoading, error, clearError, hasSession, authMode } = useCustomerAuth();
  const { table } = useCart();

  const [mode, setMode] = useState('select'); // 'select' | 'login' | 'register'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(null);

  // Redirect if no table session
  useEffect(() => {
    if (!table) {
      navigate('/', { replace: true });
    }
  }, [table, navigate]);

  // Redirect if already authenticated (allow guests to upgrade)
  useEffect(() => {
    if (authMode === 'authenticated') {
      navigate('/c/menu', { replace: true });
    }
  }, [authMode, navigate]);

  // Clear errors when switching modes
  useEffect(() => {
    clearError();
    setFormErrors({});
    setEmailAvailable(null);
  }, [mode, clearError]);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear field-specific error
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.email) errors.email = t('auth.emailRequired', 'Email is required');
    else if (!validateEmail(formData.email)) errors.email = t('auth.invalidEmail', 'Invalid email format');

    if (!formData.password) errors.password = t('auth.passwordRequired', 'Password is required');

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate('/c/menu', { replace: true });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.name) errors.name = t('auth.nameRequired', 'Name is required');

    if (!formData.email) errors.email = t('auth.emailRequired', 'Email is required');
    else if (!validateEmail(formData.email)) errors.email = t('auth.invalidEmail', 'Invalid email format');
    else if (emailAvailable === false) errors.email = t('auth.emailTaken', 'Email is already registered');

    if (!formData.password) errors.password = t('auth.passwordRequired', 'Password is required');
    else if (!validatePassword(formData.password)) {
      errors.password = t('auth.passwordWeak', 'Password must be at least 8 characters with uppercase, lowercase, and number');
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t('auth.passwordMismatch', 'Passwords do not match');
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const result = await register({
      email: formData.email,
      password: formData.password,
      name: formData.name
    });

    if (result.success) {
      navigate('/c/menu', { replace: true });
    }
  };

  const handleGuestContinue = () => {
    continueAsGuest();
    navigate('/c/menu', { replace: true });
  };

  const renderSelectMode = () => (
    <div className="auth-select">
      <div className="auth-hero">
        <div className="auth-logo">
          <span className="auth-logo-icon">
            <span role="img" aria-label="restaurant">&#127861;</span>
          </span>
        </div>
        <h1 className="auth-title">Smart Restaurant</h1>
        <p className="auth-subtitle">{t('auth.tagline', 'Scan. Order. Enjoy.')}</p>
        {table && (
          <div className="auth-table-badge">
            <span role="img" aria-label="table">&#127829;</span> Table {table.tableNumber}
          </div>
        )}
      </div>

      <div className="auth-options">
        <button
          className="auth-btn auth-btn-primary"
          onClick={() => setMode('login')}
        >
          {t('auth.signIn', 'Sign In')}
        </button>

        <button
          className="auth-btn auth-btn-secondary"
          onClick={() => setMode('register')}
        >
          {t('auth.createAccount', 'Create Account')}
        </button>

        <div className="auth-divider">
          <span>{t('auth.or', 'or')}</span>
        </div>

        <button
          className="auth-btn auth-btn-ghost"
          onClick={handleGuestContinue}
        >
          {t('auth.continueAsGuest', 'Continue as Guest')}
        </button>
      </div>
    </div>
  );

  const renderLoginForm = () => (
    <div className="auth-form-container">
      <button className="auth-back-btn" onClick={() => setMode('select')}>
        <span role="img" aria-label="back">&#8592;</span> {t('common.back', 'Back')}
      </button>

      <h2 className="auth-form-title">{t('auth.welcomeBack', 'Welcome Back')}</h2>
      <p className="auth-form-subtitle">{t('auth.signInToContinue', 'Sign in to your account')}</p>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleLogin} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">{t('auth.email', 'Email')}</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder={t('auth.emailPlaceholder', 'your@email.com')}
            autoComplete="email"
            inputMode="email"
            className={formErrors.email ? 'error' : ''}
          />
          {formErrors.email && <span className="field-error">{formErrors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="password">{t('auth.password', 'Password')}</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
              autoComplete="current-password"
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
          {formErrors.password && <span className="field-error">{formErrors.password}</span>}
        </div>

        <button
          type="submit"
          className="auth-btn auth-btn-primary auth-submit-btn"
          disabled={isLoading}
        >
          {isLoading ? t('auth.signingIn', 'Signing in...') : t('auth.signIn', 'Sign In')}
        </button>
      </form>

      <p className="auth-switch">
        {t('auth.noAccount', "Don't have an account?")}{' '}
        <button type="button" onClick={() => setMode('register')}>
          {t('auth.signUp', 'Sign Up')}
        </button>
      </p>
    </div>
  );

  const renderRegisterForm = () => (
    <div className="auth-form-container">
      <button className="auth-back-btn" onClick={() => setMode('select')}>
        <span role="img" aria-label="back">&#8592;</span> {t('common.back', 'Back')}
      </button>

      <h2 className="auth-form-title">{t('auth.createAccount', 'Create Account')}</h2>
      <p className="auth-form-subtitle">{t('auth.joinUs', 'Join us for a better dining experience')}</p>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleRegister} className="auth-form">
        <div className="form-group">
          <label htmlFor="name">{t('auth.fullName', 'Full Name')}</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder={t('auth.namePlaceholder', 'John Doe')}
            autoComplete="name"
            className={formErrors.name ? 'error' : ''}
          />
          {formErrors.name && <span className="field-error">{formErrors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="reg-email">{t('auth.email', 'Email')}</label>
          <input
            type="email"
            id="reg-email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder={t('auth.emailPlaceholder', 'your@email.com')}
            autoComplete="email"
            inputMode="email"
            className={formErrors.email ? 'error' : emailAvailable === false ? 'error' : emailAvailable === true ? 'success' : ''}
          />
          {formErrors.email && <span className="field-error">{formErrors.email}</span>}
          {emailAvailable === true && !formErrors.email && (
            <span className="field-success">
              <span role="img" aria-label="check">&#10003;</span> {t('auth.emailAvailable', 'Email is available')}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="reg-password">{t('auth.password', 'Password')}</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="reg-password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={t('auth.passwordPlaceholder', 'Create a password')}
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
          className="auth-btn auth-btn-primary auth-submit-btn"
          disabled={isLoading}
        >
          {isLoading ? t('auth.creating', 'Creating...') : t('auth.createAccount', 'Create Account')}
        </button>
      </form>

      <p className="auth-switch">
        {t('auth.haveAccount', 'Already have an account?')}{' '}
        <button type="button" onClick={() => setMode('login')}>
          {t('auth.signIn', 'Sign In')}
        </button>
      </p>
    </div>
  );

  return (
    <div className="customer-auth-page">
      <div className="auth-container">
        {mode === 'select' && renderSelectMode()}
        {mode === 'login' && renderLoginForm()}
        {mode === 'register' && renderRegisterForm()}
      </div>
    </div>
  );
};

export default CustomerAuthPage;
