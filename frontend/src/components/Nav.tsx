'use client';

import Link from 'next/link';
import { useAuth } from '@/shared/lib/AuthContext';

export default function Nav() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="hidden md:flex space-x-4">
      <Link href="/" className="hover:underline">Главная</Link>
      <Link href="/courses" className="hover:underline">Курсы</Link>
      <Link href="/tasks" className="hover:underline">Задания</Link>
      {isAuthenticated ? (
        <>
          <Link href="/profile" className="hover:underline">Профиль</Link>
          <button onClick={logout} className="hover:underline">
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