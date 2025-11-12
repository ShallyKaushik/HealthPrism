import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Create the context
const AuthContext = createContext();

// Create the provider component
export function AuthProvider({ children }) {
  // Store the token in state, initializing from localStorage
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // For loading states
  const navigate = useNavigate();

  // API base URL
  const API_URL = 'http://127.0.0.1:5000/api';

  // This effect ensures that the axios default header is set
  // whenever the token changes.
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // --- Register Function ---
  const register = async (username, password) => {
    setError(null);
    setLoading(true);
    try {
      await axios.post(`${API_URL}/register`, {
        username,
        password,
      });
      // Automatically navigate to login page after successful registration
      navigate('/login');
      setLoading(false);
      return true; // Indicate success
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed';
      setError(errorMsg);
      setLoading(false);
      return false; // Indicate failure
    }
  };

  // --- Login Function ---
  const login = async (username, password) => {
    setError(null);
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login`, {
        username,
        password,
      });
      
      const newToken = response.data.access_token;
      setToken(newToken); // Update state, which triggers the useEffect
      
      // Navigate to the dashboard (homepage)
      navigate('/');
      setLoading(false);
      return true; // Indicate success

    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Invalid username or password';
      setError(errorMsg);
      setLoading(false);
      return false; // Indicate failure
    }
  };

  // --- Logout Function ---
  const logout = () => {
    setToken(null); // Update state, which triggers the useEffect
    navigate('/login'); // Redirect to login on logout
  };

  // The value to be passed to consuming components
  const value = {
    token,
    error,
    loading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Create a custom hook to use the AuthContext
export function useAuth() {
  return useContext(AuthContext);
}