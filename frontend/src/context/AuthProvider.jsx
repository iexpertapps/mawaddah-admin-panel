import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AuthContext from './AuthContext';

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (storedToken) {
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        setToken(storedToken);
        api.defaults.headers.common['Authorization'] = `Token ${storedToken}`;
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            setUser(null);
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password, rememberMe) => {
    try {
      const response = await api.post('/api/auth/login/', { email, password });
      const { token: apiToken, user: apiUser } = response.data;

      setUser(apiUser);
      setToken(apiToken);
      api.defaults.headers.common['Authorization'] = `Token ${apiToken}`;

      const userString = JSON.stringify(apiUser);
      if (rememberMe) {
        localStorage.setItem('authToken', apiToken);
        localStorage.setItem('user', userString);
      } else {
        sessionStorage.setItem('authToken', apiToken);
        sessionStorage.setItem('user', userString);
      }
      
      // Navigation removed; let the caller handle it
      return { success: true };
    } catch (error) {
      let errorMessage = "An unexpected error occurred.";
      if (error.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.error || (typeof errorData === 'string' ? errorData : JSON.stringify(errorData));
      }
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
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
      // Navigation removed; let the caller handle it
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 