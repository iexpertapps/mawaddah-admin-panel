import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  withCredentials: true, // for session cookies if needed
});

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

export default api; 