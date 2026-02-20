/**
 * Botivate HR Support - Auth Context
 * Manages user session, login/logout, and protected routes.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('botivate_user');
    const token = localStorage.getItem('botivate_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    const userData = response.data;
    localStorage.setItem('botivate_token', userData.access_token);
    localStorage.setItem('botivate_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('botivate_token');
    localStorage.removeItem('botivate_user');
    setUser(null);
  };

  const isAuthority = () => {
    return user && ['manager', 'hr', 'admin', 'ceo'].includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthority }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
