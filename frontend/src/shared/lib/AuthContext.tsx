'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token') || localStorage.getItem('token');
    console.log('AuthContext: Initial token check:', token); // Лог для отладки
    setIsAuthenticated(!!token);
  }, []);

  const login = (token: string) => {
    console.log('AuthContext: Saving token:', token); // Лог для отладки
    Cookies.set('token', token, { expires: 7, secure: true, sameSite: 'strict' });
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    toast.success('Вход выполнен успешно!', { id: 'auth-login' });
    router.push('/profile');
  };

  const logout = () => {
    console.log('AuthContext: Logging out'); // Лог для отладки
    Cookies.remove('token');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    toast.success('Вы вышли из аккаунта', { id: 'auth-logout' });
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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