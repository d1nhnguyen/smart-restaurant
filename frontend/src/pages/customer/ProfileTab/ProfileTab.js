import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCustomerAuth } from '../../../contexts/CustomerAuthContext';
import { useCart } from '../../../contexts/CartContext';
import LanguageSwitcher from '../../../components/LanguageSwitcher';
import './ProfileTab.css';

const ProfileTab = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { customer, isAuthenticated, logout, changePassword } = useCustomerAuth();
  const { table } = useCart();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = () => {
    if (window.confirm(t('auth.logoutConfirm', 'Are you sure you want to logout?'))) {
      logout();
      // Stay on profile tab as guest
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('auth.passwordMismatch', 'Passwords do not match'));
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError(t('auth.passwordTooShort', 'Password must be at least 8 characters'));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (result.success) {
        setPasswordSuccess(true);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess(false);
        }, 2000);
      } else {
        setPasswordError(result.error);
      }
    } catch (err) {
      setPasswordError(t('auth.passwordChangeFailed', 'Failed to change password'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guest View
  if (!isAuthenticated) {
    return (
      <div className="profile-tab">
        <header className="profile-header">
          <h1>{t('tabs.profile', 'Profile')}</h1>
          {table && <span className="table-badge">{t('menu.table', 'Table')} {table.tableNumber}</span>}
        </header>

        <div className="guest-profile">
          <div className="guest-avatar">
            <span role="img" aria-label="guest">&#128100;</span>
          </div>
          <h2>{t('auth.guestUser', 'Guest User')}</h2>
          <p>{t('auth.guestMessage', 'Sign in to access your order history and save your preferences.')}</p>

          <div className="guest-actions">
            <button className="auth-btn primary" onClick={() => navigate('/c/auth')}>
              {t('auth.signIn', 'Sign In')}
            </button>
            <button className="auth-btn secondary" onClick={() => navigate('/c/auth')}>
              {t('auth.createAccount', 'Create Account')}
            </button>
          </div>
        </div>

        {/* Settings Section (available for guests too) */}
        <section className="settings-section">
          <h3 className="section-title">{t('profile.settings', 'Settings')}</h3>

          <div className="settings-list">
            <div className="settings-item">
              <div className="settings-item-info">
                <span className="settings-icon" role="img" aria-label="language">&#127760;</span>
                <div>
                  <span className="settings-label">{t('profile.language', 'Language')}</span>
                  <span className="settings-value">{i18n.language === 'vi' ? 'Tiếng Việt' : 'English'}</span>
                </div>
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Authenticated User View
  return (
    <div className="profile-tab">
      <header className="profile-header">
        <h1>{t('tabs.profile', 'Profile')}</h1>
        {table && <span className="table-badge">{t('menu.table', 'Table')} {table.tableNumber}</span>}
      </header>

      {/* Profile Info */}
      <div className="profile-info">
        <div className="profile-avatar">
          <span role="img" aria-label="user">{customer?.name?.charAt(0).toUpperCase() || 'U'}</span>
        </div>
        <div className="profile-details">
          <h2 className="profile-name">{customer?.name || t('profile.user', 'User')}</h2>
          <p className="profile-email">{customer?.email}</p>
        </div>
      </div>

      {/* Account Section */}
      <section className="settings-section">
        <h3 className="section-title">{t('profile.account', 'Account')}</h3>

        <div className="settings-list">
          <button className="settings-item clickable" onClick={() => setShowPasswordModal(true)}>
            <div className="settings-item-info">
              <span className="settings-icon" role="img" aria-label="lock">&#128274;</span>
              <span className="settings-label">{t('profile.changePassword', 'Change Password')}</span>
            </div>
            <span className="settings-arrow">
              <span role="img" aria-label="arrow">&#8250;</span>
            </span>
          </button>
        </div>
      </section>

      {/* Settings Section */}
      <section className="settings-section">
        <h3 className="section-title">{t('profile.settings', 'Settings')}</h3>

        <div className="settings-list">
          <div className="settings-item">
            <div className="settings-item-info">
              <span className="settings-icon" role="img" aria-label="language">&#127760;</span>
              <div>
                <span className="settings-label">{t('profile.language', 'Language')}</span>
                <span className="settings-value">{i18n.language === 'vi' ? 'Tiếng Việt' : 'English'}</span>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </section>

      {/* Logout Button */}
      <div className="logout-section">
        <button className="logout-btn" onClick={handleLogout}>
          <span role="img" aria-label="logout">&#128682;</span>
          {t('sidebar.logout', 'Logout')}
        </button>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{t('profile.changePassword', 'Change Password')}</h3>
              <button className="close-btn" onClick={() => setShowPasswordModal(false)}>
                <span role="img" aria-label="close">&#10005;</span>
              </button>
            </div>

            {passwordSuccess ? (
              <div className="success-message">
                <span className="success-icon" role="img" aria-label="success">&#10003;</span>
                <p>{t('profile.passwordChanged', 'Password changed successfully!')}</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange}>
                {passwordError && <div className="error-message">{passwordError}</div>}

                <div className="form-group">
                  <label>{t('profile.currentPassword', 'Current Password')}</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t('profile.newPassword', 'New Password')}</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    minLength={8}
                  />
                </div>

                <div className="form-group">
                  <label>{t('auth.confirmPassword', 'Confirm Password')}</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                </div>

                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileTab;
