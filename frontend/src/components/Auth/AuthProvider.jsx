import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock users for development (replace with real API calls)
const mockUsers = [
  {
    id: 1,
    email: 'admin@trading.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    avatar: null,
    preferences: {
      theme: 'dark',
      notifications: true,
      riskLevel: 'medium',
    },
    accounts: [
      { id: 1, broker: 'MT5', accountNumber: '12345678', balance: 50000 },
    ],
  },
  {
    id: 2,
    email: 'trader@example.com',
    password: 'trader123',
    name: 'John Trader',
    role: 'trader',
    avatar: null,
    preferences: {
      theme: 'light',
      notifications: false,
      riskLevel: 'high',
    },
    accounts: [
      { id: 2, broker: 'MT5', accountNumber: '87654321', balance: 25000 },
    ],
  },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      // Mock authentication (replace with real API call)
      const mockUser = mockUsers.find(
        u => u.email === email && u.password === password
      );

      if (!mockUser) {
        throw new Error('Invalid email or password');
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { password: _, ...userWithoutPassword } = mockUser;
      const token = `mock-jwt-token-${Date.now()}`;

      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(userWithoutPassword));
      
      setUser(userWithoutPassword);
      return { success: true, user: userWithoutPassword };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      // Check if user already exists
      const existingUser = mockUsers.find(u => u.email === userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newUser = {
        id: mockUsers.length + 1,
        email: userData.email,
        name: userData.name,
        role: 'trader',
        avatar: null,
        preferences: {
          theme: 'light',
          notifications: true,
          riskLevel: 'medium',
        },
        accounts: [],
      };

      // Add to mock users (in real app, this would be an API call)
      mockUsers.push({ ...newUser, password: userData.password });

      const token = `mock-jwt-token-${Date.now()}`;
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(newUser));
      
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
    setError(null);
  };

  const updateUser = async (updates) => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUser = { ...user, ...updates };
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true, user: updatedUser };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const addTradingAccount = async (accountData) => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newAccount = {
        id: Date.now(),
        ...accountData,
        balance: 0,
        createdAt: new Date().toISOString(),
      };
      
      const updatedUser = {
        ...user,
        accounts: [...(user.accounts || []), newAccount],
      };
      
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true, account: newAccount };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userExists = mockUsers.find(u => u.email === email);
      if (!userExists) {
        throw new Error('No user found with this email address');
      }
      
      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    addTradingAccount,
    resetPassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;