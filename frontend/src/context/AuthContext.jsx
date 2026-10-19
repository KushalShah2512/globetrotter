import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('gt_token'));
  const [loading, setLoading] = useState(true);

  // Helper function to perform authenticated API calls
  const apiCall = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Session expired or invalid
      logout();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Something went wrong');
    }

    // Handle empty responses (like logout or delete)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  };

  // Check user authentication status on load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const userData = await apiCall('/api/auth/me');
          setUser(userData);
        } catch (error) {
          console.error('Auto-login failed', error);
          localStorage.removeItem('gt_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Log in
  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Invalid email or password');
    }

    const data = await res.json();
    localStorage.setItem('gt_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  // Sign up
  const signup = async (registerData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Registration failed');
    }

    const data = await res.json();
    localStorage.setItem('gt_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  // Log out
  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (e) {
        console.error('Logout API error', e);
      }
    }
    localStorage.removeItem('gt_token');
    setToken(null);
    setUser(null);
  };

  // Update profile
  const updateProfile = async (profileData) => {
    const updatedUser = await apiCall('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    setUser(updatedUser);
    return updatedUser;
  };

  // Delete account
  const deleteAccount = async () => {
    await apiCall('/api/auth/account', {
      method: 'DELETE',
    });
    localStorage.removeItem('gt_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    deleteAccount,
    apiCall,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
