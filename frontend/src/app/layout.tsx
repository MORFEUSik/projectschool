// src/app/layout.tsx
import { ReactNode } from 'react';
import { AuthProvider } from '@/shared/hooks/useAuth';
import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'ProjectSchool',
  description: 'Образовательная платформа',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="flex flex-col min-h-screen">
        <AuthProvider>
          <header>
            <nav className="flex justify-between items-center p-4 bg-blue-600 text-white shadow-md">
              <Link href="/" className="text-xl font-bold">
                ProjectSchool
              </Link>
              <div className="space-x-4">
                <Link href="/courses" className="hover:underline">
                  Курсы
                </Link>
                <Link href="/leaderboard" className="hover:underline">
                  Лидерборд
                </Link>
                <Link href="/profile" className="hover:underline">
                  Профиль
                </Link>
                <Link href="/admin" className="hover:underline">
                  Админка
                </Link>
                <Link href="/auth/login" className="hover:underline">
                  Войти
                </Link>
              </div>
            </nav>
          </header>
          <main className="flex-grow p-4">{children}</main>
          <footer className="p-4 bg-gray-800 text-white text-center">
            © 2025 ProjectSchool
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}