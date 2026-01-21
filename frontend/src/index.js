import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import axios from 'axios';
import { authService } from './utils/auth';

// Configure axios base URL - Remove trailing /api or slash to avoid duplication
const rawApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
axios.defaults.baseURL = rawApiUrl.replace(/\/api$/, '').replace(/\/$/, '');

// Export base URL for use in image URLs
export const API_BASE_URL = axios.defaults.baseURL;

// Add request interceptor to include auth token
axios.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Public pages that don't require login
      const publicPaths = ['/menu', '/', '/table/', '/order-status/', '/checkout', '/payment/'];
      const currentPath = window.location.pathname;

      // Only redirect to login if not on a public page
      const isPublicPage = publicPaths.some(path => currentPath.startsWith(path));

      if (!isPublicPage) {
        // Redirect to login on unauthorized access for protected pages
        authService.logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
