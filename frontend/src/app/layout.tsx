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
      <body>
        <AuthProvider>
          <header>
            <nav className="flex justify-between p-4 bg-blue-600 text-white">
              <Link href="/">ProjectSchool</Link>
              <div>
                <Link href="/courses" className="mx-2">Курсы</Link>
                <Link href="/leaderboard" className="mx-2">Лидерборд</Link>
                <Link href="/profile" className="mx-2">Профиль</Link>
                <Link href="/admin" className="mx-2">Админка</Link>
                <Link href="/auth/login" className="mx-2">Войти</Link>
              </div>
            </nav>
          </header>
          <main className="p-4">{children}</main>
          <footer className="p-4 bg-gray-800 text-white text-center">
            © 2025 ProjectSchool
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}