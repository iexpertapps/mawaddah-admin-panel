import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// This hook should be the single source of truth for authentication.
export const useAuth = () => {
  const navigate = useNavigate();

  // We derive the auth state from the presence of a token.
  // The actual user data should be fetched and managed here or in a separate context.
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    : null;

  const user = token ? JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null') : null;

  const login = async (email, password, rememberMe) => {
    try {
      const response = await api.post('/api/auth/login/', { email, password });
      
      // Axios automatically parses JSON, so we can use response.data directly.
      const { token: authToken, user: userData } = response.data;

      const userString = JSON.stringify(userData);
      if (rememberMe) {
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', userString);
      } else {
        sessionStorage.setItem('authToken', authToken);
        sessionStorage.setItem('user', userString);
      }
      
      api.defaults.headers.common['Authorization'] = `Token ${authToken}`;
      
      navigate('/admin', { replace: true });
      return { success: true };
    } catch (error) {
      // Robust error handling to prevent crashes from non-JSON responses.
      let errorMessage = "An unexpected error occurred.";
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else {
          try {
            errorMessage = JSON.stringify(errorData);
          } catch (parseError) {
            errorMessage = "Failed to parse error response.";
          }
        }
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      }
      
      console.error("Login failed:", errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout/');
    } catch (error) {
      console.error('Logout failed, but proceeding with client-side cleanup.', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      navigate('/login', { replace: true });
    }
  };

  return {
    isAuthenticated: !!token,
    token,
    user,
    role: user?.role || null,
    login, // Expose the login function
    logout,
  };
}; 