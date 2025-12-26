// Authentication utilities
export const authService = {
  // Get token from localStorage
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Get user from localStorage
  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Add Authorization header to fetch options
  getAuthHeaders: () => {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  },
};

// Protected fetch wrapper that includes auth token
export const authenticatedFetch = async (url, options = {}) => {
  const token = authService.getToken();
  
  const authOptions = {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await fetch(url, authOptions);

  // If unauthorized, redirect to login
  if (response.status === 401) {
    authService.logout();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
};
