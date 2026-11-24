import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: any) => Promise<User>;
  logout: () => void;
  quickLogin: (role: Role, vendorIndex?: number) => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize current user
  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          removeAuthToken();
          setToken(null);
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
        removeAuthToken();
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.login({ email, password });
    if (res.success && res.token) {
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (payload: any): Promise<User> => {
    const res = await api.register(payload);
    if (res.success && res.token) {
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    removeAuthToken();
    setToken(null);
    setUser(null);
  };

  // Demo 1-click Quick Login for instantaneous testing of any role
  const quickLogin = async (role: Role, vendorIndex = 1) => {
    let email = 'student1@canteen.edu';
    if (role === 'ADMIN') {
      email = 'admin@canteen.edu';
    } else if (role === 'VENDOR') {
      email = vendorIndex === 2 ? 'vendor2@canteen.edu' : 'vendor1@canteen.edu';
    } else if (role === 'FACULTY') {
      email = 'faculty1@canteen.edu';
    } else {
      email = 'student1@canteen.edu';
    }

    await login(email, 'Password123!');
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedUser });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        quickLogin,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
