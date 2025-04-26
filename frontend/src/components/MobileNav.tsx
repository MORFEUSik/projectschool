'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/shared/lib/AuthContext';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();

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
              <button className="text-left hover:underline" onClick={() => { logout(); setIsOpen(false); }}>
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