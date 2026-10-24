import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('samarth_token') || null);
  const [loading, setLoading] = useState(true);

  // Load user profile if token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await api.auth.me();
        setUser(userData);
      } catch (err) {
        console.error('Failed to load user session:', err);
        localStorage.removeItem('samarth_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (username, password) => {
    const res = await api.auth.login(username, password);
    localStorage.setItem('samarth_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (userData) => {
    const res = await api.auth.register(userData);
    localStorage.setItem('samarth_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.auth.logout();
      }
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('samarth_token');
      setToken(null);
      setUser(null);
    }
  };

  // 1-Click Fast Switcher for Competition Demo Presentation
  const switchDemoAccount = async (accountType) => {
    setLoading(true);
    let username = 'customer_rohan';
    let password = 'customer123';

    if (accountType === 'CUSTOMER') {
      username = 'customer_rohan';
      password = 'customer123';
    } else if (accountType === 'ELECTRICIAN') {
      username = 'worker_ramesh';
      password = 'worker123';
    } else if (accountType === 'PLUMBER') {
      username = 'worker_suresh';
      password = 'worker123';
    } else if (accountType === 'CARPENTER') {
      username = 'worker_manoj';
      password = 'worker123';
    } else if (accountType === 'APPLIANCE') {
      username = 'worker_amit';
      password = 'worker123';
    } else if (accountType === 'ADMIN') {
      username = 'admin';
      password = 'admin123';
    }

    try {
      const loggedUser = await login(username, password);
      return loggedUser;
    } catch (err) {
      console.error('Error switching demo account:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      switchDemoAccount,
      isAuthenticated: !!user,
      isCustomer: user?.role === 'CUSTOMER',
      isWorker: user?.role === 'WORKER',
      isAdmin: user?.role === 'ADMIN'
    }}>
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
