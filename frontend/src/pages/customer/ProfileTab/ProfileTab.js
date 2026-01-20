import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCustomerAuth } from '../../../contexts/CustomerAuthContext';
import { useCart } from '../../../contexts/CartContext';
import LanguageSwitcher from '../../../components/LanguageSwitcher';
import customerAuthService from '../../../services/customerAuthService';
import './ProfileTab.css';

const ProfileTab = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { customer, isAuthenticated, logout, changePassword, getToken, updateProfile } = useCustomerAuth();
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
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    preferredLanguage: 'en'
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Initialize profile form when customer data is available
  React.useEffect(() => {
    if (customer) {
      setProfileForm({
        name: customer.name || '',
        phone: customer.phone || '',
        preferredLanguage: customer.preferredLanguage || 'en'
      });
    }
  }, [customer]);

  const handleLogout = () => {
    if (window.confirm(t('auth.logoutConfirm', 'Are you sure you want to logout?'))) {
      logout();
      // Stay on profile tab as guest
    }
  };

  const handleResendVerification = async () => {
    setResendingVerification(true);
    try {
      const token = getToken();
      await customerAuthService.resendVerification(token);
      setVerificationSent(true);
    } catch (err) {
      console.error('Failed to resend verification:', err);
    } finally {
      setResendingVerification(false);
    }
  };

  const validateProfileForm = () => {
    const { name, phone } = profileForm;

    // Validate name
    if (name && name.trim().length > 0) {
      if (name.trim().length < 2) {
        setProfileError(t('profile.nameTooShort', 'Name must be at least 2 characters'));
        return false;
      }
      if (name.trim().length > 100) {
        setProfileError(t('profile.nameTooLong', 'Name must not exceed 100 characters'));
        return false;
      }
      if (!/^[a-zA-ZÀ-ỹ\s'-]+$/.test(name.trim())) {
        setProfileError(t('profile.invalidName', 'Name can only contain letters, spaces, hyphens, and apostrophes'));
        return false;
      }
    }

    // Validate phone
    if (phone && phone.trim().length > 0) {
      if (!/^\+?[0-9]{10,15}$/.test(phone.trim())) {
        setProfileError(t('profile.invalidPhone', 'Please enter a valid phone number (10-15 digits)'));
        return false;
      }
    }

    return true;
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);

    if (!validateProfileForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateProfile(profileForm);
      if (result.success) {
        setProfileSuccess(true);
        setIsEditingProfile(false);
        setTimeout(() => {
          setProfileSuccess(false);
        }, 3000);
      } else {
        // Parse backend error and show translated message
        const errorMsg = result.error || '';
        let translatedError = '';

        // Map backend validation errors to translated messages
        if (errorMsg.includes('Phone must be a valid phone number') || errorMsg.includes('phone')) {
          translatedError = t('profile.invalidPhone', 'Please enter a valid phone number (10-15 digits)');
        } else if (errorMsg.includes('Name must be at least 2 characters')) {
          translatedError = t('profile.nameTooShort', 'Name must be at least 2 characters');
        } else if (errorMsg.includes('Name must not exceed 100 characters')) {
          translatedError = t('profile.nameTooLong', 'Name must not exceed 100 characters');
        } else if (errorMsg.includes('Name can only contain')) {
          translatedError = t('profile.invalidName', 'Name can only contain letters, spaces, hyphens, and apostrophes');
        } else if (errorMsg.includes('Preferred language must be')) {
          translatedError = t('profile.invalidLanguage', 'Please select a valid language');
        } else {
          translatedError = t('profile.updateFailed', 'Failed to update profile');
        }

        setProfileError(translatedError);
      }
    } catch (err) {
      setProfileError(t('profile.updateFailed', 'Failed to update profile'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to original customer values
    if (customer) {
      setProfileForm({
        name: customer.name || '',
        phone: customer.phone || '',
        preferredLanguage: customer.preferredLanguage || 'en'
      });
    }
    setProfileError('');
    setIsEditingProfile(false);
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

      {/* Email Verification Banner */}
      {customer && !customer.isEmailVerified && (
        <div className="verification-banner">
          <div className="verification-icon">
            <span role="img" aria-label="warning">&#9888;</span>
          </div>
          <div className="verification-content">
            <h4>{t('profile.verifyEmail', 'Verify Your Email')}</h4>
            <p>{t('profile.verifyEmailDesc', 'Please verify your email address to secure your account.')}</p>
            {verificationSent ? (
              <p className="verification-sent">
                <span role="img" aria-label="check">&#10003;</span> {t('profile.verificationSent', 'Verification email sent! Check your inbox.')}
              </p>
            ) : (
              <button
                className="resend-btn"
                onClick={handleResendVerification}
                disabled={resendingVerification}
              >
                {resendingVerification
                  ? t('profile.sending', 'Sending...')
                  : t('profile.resendVerification', 'Resend Verification Email')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Profile Info */}
      <div className="profile-info">
        <div className="profile-avatar">
          <span role="img" aria-label="user">{customer?.name?.charAt(0).toUpperCase() || 'U'}</span>
        </div>
        <div className="profile-details">
          <h2 className="profile-name">{customer?.name || t('profile.user', 'User')}</h2>
          <p className="profile-email">
            {customer?.email}
            {customer?.isEmailVerified && (
              <span className="verified-badge" title={t('profile.emailVerified', 'Email verified')}>
                <span role="img" aria-label="verified">&#10003;</span>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Success Message */}
      {profileSuccess && (
        <div className="success-banner">
          <span className="success-icon" role="img" aria-label="success">&#10003;</span>
          {t('profile.profileUpdated', 'Profile updated successfully!')}
        </div>
      )}

      {/* Profile Details Section */}
      <section className="settings-section">
        <div className="section-header">
          <h3 className="section-title">{t('profile.account', 'Account')}</h3>
          {!isEditingProfile && (
            <button className="edit-btn" onClick={() => setIsEditingProfile(true)}>
              <span role="img" aria-label="edit">&#9998;</span>
              {t('profile.editProfile', 'Edit Profile')}
            </button>
          )}
        </div>

        {isEditingProfile ? (
          <form onSubmit={handleProfileUpdate} className="profile-edit-form">
            {profileError && <div className="error-message">{profileError}</div>}

            <div className="form-group">
              <label>{t('profile.name', 'Name')}</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('profile.name', 'Name')}
              />
            </div>

            <div className="form-group">
              <label>{t('profile.phoneNumber', 'Phone Number')}</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder={t('profile.phoneNumber', 'Phone Number')}
              />
            </div>

            <div className="form-group">
              <label>{t('profile.preferredLanguage', 'Preferred Language')}</label>
              <select
                value={profileForm.preferredLanguage}
                onChange={(e) => setProfileForm(prev => ({ ...prev, preferredLanguage: e.target.value }))}
              >
                <option value="en">English</option>
                <option value="vi">Tiếng Việt</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={isSubmitting}>
                {isSubmitting ? t('common.saving', 'Saving...') : t('profile.saveChanges', 'Save Changes')}
              </button>
              <button type="button" className="cancel-btn" onClick={handleCancelEdit} disabled={isSubmitting}>
                {t('profile.cancelEdit', 'Cancel')}
              </button>
            </div>
          </form>
        ) : (
          <div className="settings-list">
            <div className="settings-item">
              <div className="settings-item-info">
                <span className="settings-icon" role="img" aria-label="name">&#128100;</span>
                <div>
                  <span className="settings-label">{t('profile.name', 'Name')}</span>
                  <span className="settings-value">{customer?.name || t('common.notSet', 'Not set')}</span>
                </div>
              </div>
            </div>

            <div className="settings-item">
              <div className="settings-item-info">
                <span className="settings-icon" role="img" aria-label="phone">&#128222;</span>
                <div>
                  <span className="settings-label">{t('profile.phoneNumber', 'Phone Number')}</span>
                  <span className="settings-value">{customer?.phone || t('common.notSet', 'Not set')}</span>
                </div>
              </div>
            </div>

            <div className="settings-item">
              <div className="settings-item-info">
                <span className="settings-icon" role="img" aria-label="language">&#127760;</span>
                <div>
                  <span className="settings-label">{t('profile.preferredLanguage', 'Preferred Language')}</span>
                  <span className="settings-value">
                    {customer?.preferredLanguage === 'vi' ? 'Tiếng Việt' : 'English'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Password Change Section */}
      <section className="settings-section">
        <h3 className="section-title">{t('profile.security', 'Security')}</h3>

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
                <span className="settings-value">{i18n.language === 'vi' ? t('menu.vietnamese', 'Tiếng Việt') : t('menu.english', 'English')}</span>
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
