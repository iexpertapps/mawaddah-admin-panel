import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const navigate = useNavigate();
  
  // TEMPORARY: For testing purposes, provide a mock token
  // In production, this should come from localStorage/sessionStorage
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || 'mock-token-for-testing'
    : 'mock-token-for-testing';
  
  // Create a user object based on token presence
  const user = token ? {
    id: 1, // Default admin user ID
    name: 'Admin User',
    email: 'admin@mawaddah.com',
    role: 'admin',
    avatar: '/ic_mawaddah_180x180.png'
  } : null

  // Logout function
  const logout = async () => {
    try {
      await fetch('/api/auth/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Token ${token}` : undefined,
        },
        credentials: 'include',
      });
    } catch (err) {
      // Ignore errors, always clear token
    }
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return {
    isAuthenticated: !!token,
    token,
    user,
    role: user?.role || null,
    logout,
  }
} 