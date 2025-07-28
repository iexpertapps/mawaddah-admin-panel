import axios from 'axios';

// -----------------------
// Base URL Resolution
// -----------------------
const defaultBackend = 'https://mawaddahapp.up.railway.app';

// Priority:
// 1. VITE_BACKEND_URL (from .env or Vercel Env)
// 2. Default production backend (Railway)
// -----------------------
const baseURL = import.meta.env.VITE_BACKEND_URL || defaultBackend;

// Warn if baseURL seems incorrect
if (baseURL.includes('vercel.app')) {
  console.warn(
    `⚠️ API baseURL is pointing to a frontend domain (${baseURL}). 
    This usually means VITE_BACKEND_URL is NOT set correctly.`
  );
}

if (import.meta.env.MODE === 'development') {
  console.info(`✅ Using API baseURL: ${baseURL}`);
}

// -----------------------
// Axios Instance
// -----------------------
const api = axios.create({
  baseURL,
  withCredentials: true, // allow cookies if backend uses them
});

// -----------------------
// Request Interceptor
// -----------------------
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    if (token) {
      config.headers['Authorization'] = `Token ${token}`; // Switch to Bearer if JWT
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// -----------------------
// Response Interceptor
// -----------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle auth errors globally
    if (error.response?.status === 401) {
      console.warn('⚠️ Unauthorized - clearing auth tokens and redirecting to login');
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      window.location.href = '/login';
    }

    // Helpful log for unexpected backend response
    if (
      error.response?.data &&
      typeof error.response.data === 'string' &&
      error.response.data.startsWith('<!doctype')
    ) {
      console.error(
        '❌ Received HTML instead of JSON. Check if the API baseURL is correct or backend is down.'
      );
    }

    return Promise.reject(error);
  }
);

export default api;
