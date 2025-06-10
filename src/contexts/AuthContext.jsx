import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState(localStorage.getItem('sessionToken'));

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('sessionToken');
      if (token) {
        try {
          const response = await apiService.getCurrentUser();
          setUser(response.user);
          setSessionToken(token);
        } catch (error) {
          console.log('Auth check failed:', error);
          localStorage.removeItem('sessionToken');
          setSessionToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    console.log('Attempting login with:', email);
    try {
      const response = await apiService.login({ email, password });
      console.log('Login response:', response);
      
      setUser(response.user);
      setSessionToken(response.session_token);
      localStorage.setItem('sessionToken', response.session_token);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      const message = error.response?.data?.error || error.message || 'Login failed';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setSessionToken(null);
      localStorage.removeItem('sessionToken');
    }
  };

  const value = {
    user,
    sessionToken,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
