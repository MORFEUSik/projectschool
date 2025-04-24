// frontend/src/components/MobileNav.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
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
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      <button
        className="text-white text-2xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        ☰
      </button>
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-primary text-white flex flex-col space-y-2 p-4">
          <Link href="/" className="hover:underline" onClick={() => setIsOpen(false)}>
            Главная
          </Link>
          <Link href="/courses" className="hover:underline" onClick={() => setIsOpen(false)}>
            Курсы
          </Link>
          <Link href="/tasks" className="hover:underline" onClick={() => setIsOpen(false)}>
            Задания
          </Link>
          {isAuthenticated ? (
            <>
              <Link href="/profile" className="hover:underline" onClick={() => setIsOpen(false)}>
                Профиль
              </Link>
              <button className="text-left hover:underline" onClick={handleLogout}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline" onClick={() => setIsOpen(false)}>
                Вход
              </Link>
              <Link href="/register" className="hover:underline" onClick={() => setIsOpen(false)}>
                Регистрация
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}