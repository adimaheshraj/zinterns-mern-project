import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const AppContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL.replace(/\/api\/?$/, '');

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('token') || '');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [activeTab, setActiveTab] = useState('home');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef({ socket: null, key: null, cleanupTimer: null });

  // Apply Theme class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Connect socket when user/token changes
  useEffect(() => {
    const connectionKey = token && user ? `${token}:${user.employeeId}:${user.department}` : null;
    const connection = socketRef.current;

    if (connection.cleanupTimer) {
      clearTimeout(connection.cleanupTimer);
      connection.cleanupTimer = null;
    }

    if (!token || !user) {
      if (connection.socket) {
        connection.socket.disconnect();
        connection.socket = null;
        connection.key = null;
        setSocket(null);
      }
      return;
    }

    if (connection.socket && connection.key === connectionKey) {
      return;
    }

    if (connection.socket) {
      connection.socket.disconnect();
    }

    const newSocket = io(SOCKET_URL);
    connection.socket = newSocket;
    connection.key = connectionKey;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🔌 Connected to Socket.IO notification channel');
      newSocket.emit('join_user', user.employeeId);
      newSocket.emit('join_dept', user.department);
    });

    newSocket.on('new_notification', (data) => {
      // Add notification to list
      setNotifications((prev) => [
        {
          id: Math.random().toString(),
          title: data.title,
          message: data.message,
          type: data.type || 'info',
          timestamp: new Date()
        },
        ...prev
      ]);
    });

    return () => {
      connection.cleanupTimer = setTimeout(() => {
        if (connection.socket === newSocket) {
          newSocket.disconnect();
          connection.socket = null;
          connection.key = null;
          setSocket(null);
        }
      }, 0);
    };
  }, [token, user]);

  // Load User profile on startup
  useEffect(() => {
    async function loadMe() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data.user);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (e) {
        console.error('Failed to load user info', e);
      } finally {
        setLoading(false);
      }
    }
    loadMe();
  }, [token]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const login = async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      sessionStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const updatePassword = async (oldPassword, newPassword) => {
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }
      if (data.user) {
        setUser(data.user);
      } else {
        setUser(prev => prev ? { ...prev, mustChangePassword: false } : null);
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    setToken('');
    setUser(null);
    setActiveTab('home');
  };

  const updateUserProfile = async (profileData) => {
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    setUser,
    token,
    theme,
    toggleTheme,
    activeTab,
    setActiveTab,
    notifications,
    setNotifications,
    loading,
    login,
    logout,
    updatePassword,
    updateUserProfile,
    socket,
    API_URL
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
