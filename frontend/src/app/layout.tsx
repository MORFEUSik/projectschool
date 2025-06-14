'use client';

import { useAuth } from '@/shared/hooks/useAuth';
import { AuthProvider } from '@/shared/hooks/useAuth';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import './globals.css';
import { Button } from '@/shared/ui/Button';
import { useUser } from '@/entities/user/hook';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="flex flex-col min-h-screen font-sans transition-colors duration-300">
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<string | null>(null);
  const { token, logout } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme = prefersDark ? 'dark' : 'light';
      setTheme(defaultTheme);
      document.body.setAttribute('data-theme', defaultTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <>
      <header className="shadow sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <nav className="flex justify-between items-center container py-3">
          <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition">
            ProjectSchool
          </Link>
          <div className="flex flex-wrap gap-3 text-sm items-center">
            <NavLink href="/courses" label="Уроки" />
            <NavLink href="/leaderboard" label="Лидерборд" />
            {token && user?.role === 'student' && (
              <>
                <NavLink href="/submissions" label="Мои решения" />
                <NavLink href="/notifications" label="🔔" className="hover:scale-105 transition-transform" />
              </>
            )}
            <NavLink href="/profile" label="Профиль" />
            {token && user?.role === 'admin' && <NavLink href="/admin" label="Админка" />}
            {token ? (
              <button onClick={logout} className="text-red-600 hover:text-red-700 transition font-medium">
                Выйти
              </button>
            ) : (
              <>
                <NavLink href="/auth/login" label="Войти" />
                <NavLink href="/auth/register" label="Регистрация" />
              </>
            )}
            <Button
              onClick={toggleTheme}
              className="ml-2 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              variant="outline"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-grow container py-8">{children}</main>

      <footer className="bg-gray-900 text-white text-center py-6 mt-auto text-sm">
        © 2025 ProjectSchool. Все права защищены.
      </footer>
    </>
  );
}

function NavLink({ href, label, className }: { href: string; label: string; className?: string }) {
  return (
    <Link
      href={href}
      className={className || "text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition font-medium"}
    >
      {label}
    </Link>
  );
}
