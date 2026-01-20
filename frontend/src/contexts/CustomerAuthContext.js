import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import customerAuthService from '../services/customerAuthService';

const CustomerAuthContext = createContext(null);

const STORAGE_KEY = 'customer_auth';
const TOKEN_EXPIRY_DAYS = 7;

export const CustomerAuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [authMode, setAuthMode] = useState('none'); // 'none' | 'guest' | 'authenticated'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const { token, customer: storedCustomer, expiresAt, mode } = JSON.parse(stored);

          if (mode === 'guest') {
            setAuthMode('guest');
            setIsLoading(false);
            return;
          }

          if (expiresAt && Date.now() < expiresAt && token) {
            // Verify token is still valid
            try {
              const profile = await customerAuthService.getProfile(token);
              setCustomer(profile);
              setAuthMode('authenticated');
            } catch (err) {
              // Token invalid, clear storage
              localStorage.removeItem(STORAGE_KEY);
              setAuthMode('none');
            }
          } else {
            localStorage.removeItem(STORAGE_KEY);
            setAuthMode('none');
          }
        }
      } catch (err) {
        console.error('Error initializing customer auth:', err);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const saveToStorage = useCallback((token, customerData, mode) => {
    const expiresAt = Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      token,
      customer: customerData,
      expiresAt,
      mode
    }));
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await customerAuthService.login(email, password);
      const { access_token, customer: customerData } = response;

      setCustomer(customerData);
      setAuthMode('authenticated');
      saveToStorage(access_token, customerData, 'authenticated');

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [saveToStorage]);

  const register = useCallback(async (data) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await customerAuthService.register(data);
      const { access_token, customer: customerData } = response;

      setCustomer(customerData);
      setAuthMode('authenticated');
      saveToStorage(access_token, customerData, 'authenticated');

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [saveToStorage]);

  const continueAsGuest = useCallback(() => {
    setAuthMode('guest');
    setCustomer(null);
    saveToStorage(null, null, 'guest');
  }, [saveToStorage]);

  const logout = useCallback(() => {
    setCustomer(null);
    setAuthMode('guest'); // Keep as guest after logout to maintain table session
    localStorage.removeItem(STORAGE_KEY);
    // Save guest mode so user can continue ordering
    saveToStorage(null, null, 'guest');
  }, [saveToStorage]);

  const updateProfile = useCallback(async (data) => {
    setError(null);
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const updatedCustomer = await customerAuthService.updateProfile(data, stored.token);
      setCustomer(updatedCustomer);
      saveToStorage(stored.token, updatedCustomer, 'authenticated');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile.';
      setError(message);
      return { success: false, error: message };
    }
  }, [saveToStorage]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    setError(null);
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      await customerAuthService.changePassword(currentPassword, newPassword, stored.token);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to change password.';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const getToken = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return stored.token || null;
    } catch {
      return null;
    }
  }, []);

  const checkEmailAvailability = useCallback(async (email) => {
    try {
      const result = await customerAuthService.checkEmail(email);
      return result.available;
    } catch {
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    customer,
    authMode,
    isAuthenticated: authMode === 'authenticated',
    isGuest: authMode === 'guest',
    hasSession: authMode !== 'none',
    isLoading,
    error,
    login,
    register,
    continueAsGuest,
    logout,
    updateProfile,
    changePassword,
    getToken,
    checkEmailAvailability,
    clearError
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};

export default CustomerAuthContext;
