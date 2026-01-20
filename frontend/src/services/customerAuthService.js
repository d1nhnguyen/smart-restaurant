import axios from 'axios';

const API_BASE = '/api/customer/auth';

const customerAuthService = {
  async register(data) {
    const response = await axios.post(`${API_BASE}/register`, data);
    return response.data;
  },

  async login(email, password) {
    const response = await axios.post(`${API_BASE}/login`, { email, password });
    return response.data;
  },

  async checkEmail(email) {
    const response = await axios.get(`${API_BASE}/check-email`, {
      params: { email }
    });
    return response.data;
  },

  async getProfile(token) {
    const response = await axios.get(`${API_BASE}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async updateProfile(data, token) {
    const response = await axios.put(`${API_BASE}/profile`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async changePassword(currentPassword, newPassword, token) {
    const response = await axios.put(
      `${API_BASE}/change-password`,
      { currentPassword, newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async getOrderHistory(page = 1, limit = 10, token) {
    const response = await axios.get(`${API_BASE}/orders`, {
      params: { page, limit },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Email verification
  async verifyEmail(token) {
    const response = await axios.get(`${API_BASE}/verify-email/${token}`);
    return response.data;
  },

  async resendVerification(authToken) {
    const response = await axios.post(
      `${API_BASE}/resend-verification`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  },

  async resendVerificationByEmail(email) {
    const response = await axios.post(`${API_BASE}/resend-verification-email`, { email });
    return response.data;
  },

  // Password reset
  async forgotPassword(email) {
    const response = await axios.post(`${API_BASE}/forgot-password`, { email });
    return response.data;
  },

  async validateResetToken(token) {
    const response = await axios.get(`${API_BASE}/validate-reset-token/${token}`);
    return response.data;
  },

  async resetPassword(token, newPassword) {
    const response = await axios.post(`${API_BASE}/reset-password`, {
      token,
      newPassword
    });
    return response.data;
  }
};

export default customerAuthService;
