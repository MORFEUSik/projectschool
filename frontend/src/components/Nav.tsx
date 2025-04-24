// frontend/src/components/Nav.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

export default function Nav() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token') || Cookies.get('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    Cookies.remove('token');
    setIsAuthenticated(false);
    toast.success('Вы вышли из аккаунта');
    router.push('/login');
  };

  return (
    <nav className="hidden md:flex space-x-4">
      <Link href="/" className="hover:underline">Главная</Link>
      <Link href="/courses" className="hover:underline">Курсы</Link>
      <Link href="/tasks" className="hover:underline">Задания</Link>
      {isAuthenticated ? (
        <>
          <Link href="/profile" className="hover:underline">Профиль</Link>
          <button onClick={handleLogout} className="hover:underline">
            Выйти
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="hover:underline">Вход</Link>
          <Link href="/register" className="hover:underline">Регистрация</Link>
        </>
      )}
    </nav>
  );
}