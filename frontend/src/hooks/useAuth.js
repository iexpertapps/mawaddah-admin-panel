import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Import the centralized api service

export const useAuth = () => {
  const navigate = useNavigate();
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    : null;
  
  // Create a user object based on token presence
  // In a real app, this should come from an API endpoint like /users/me/
  const user = token ? {
    id: 1, // This is mock data and should be replaced with actual user data from API
    name: 'Admin User',
    email: 'admin@mawaddah.com',
    role: 'admin',
    avatar: '/ic_mawaddah_180x180.png'
  } : null

  // Logout function
  const logout = async () => {
    try {
      // Use the centralized 'api' service to make a POST request
      // This ensures the correct backend URL and headers are used.
      await api.post('/api/auth/logout/');
    } catch (error) {
      // Even if the API call fails (e.g., token already expired),
      // we still want to log the user out on the frontend.
      console.error('Logout failed, but proceeding with client-side cleanup.', error);
    } finally {
      // Always clear the token and navigate to the login page.
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      delete api.defaults.headers.common['Authorization']; // Clean up api instance
      navigate('/login', { replace: true });
    }
  };

  return {
    isAuthenticated: !!token,
    token,
    user,
    role: user?.role || null,
    logout,
  }
} 