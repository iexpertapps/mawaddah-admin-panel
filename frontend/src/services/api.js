import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'https://mawaddahapp.up.railway.app',
  withCredentials: true, // for session cookies if needed
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`; // Use 'Bearer' if JWT
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear any existing auth tokens
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 