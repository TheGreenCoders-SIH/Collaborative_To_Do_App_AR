import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      auth.me()
        .then(res => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login with email:', email);
      const { data } = await auth.login({ email, password });
      console.log('Login successful:', data);
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      if (data.user?.secret_key) {
        localStorage.setItem('secretKey', data.user.secret_key);
      }
      setUser(data.user);
      return data;
    } catch (error) {
      console.error('Login failed:', error.message);
      console.error('API error response:', error.response?.data);
      throw error;
    }
  };

  const register = async (email, name, password) => {
    const { data } = await auth.register({ email, name, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    if (data.user?.secret_key) {
      localStorage.setItem('secretKey', data.user.secret_key);
    }
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('secretKey');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};