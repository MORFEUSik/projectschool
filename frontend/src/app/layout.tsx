'use client';
import { useAuth } from '@/shared/hooks/useAuth';
import { AuthProvider } from '@/shared/hooks/useAuth';
import Link from 'next/link';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="flex flex-col min-h-screen">
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { token, logout } = useAuth(); // ✅ уже внутри AuthProvider

  return (
    <>
      <header>
        <nav className="flex justify-between items-center p-4 bg-blue-600 text-white shadow-md">
          <Link href="/" className="text-xl font-bold">ProjectSchool</Link>
          <div className="space-x-4">
            <Link href="/courses" className="hover:underline">Курсы</Link>
            <Link href="/leaderboard" className="hover:underline">Лидерборд</Link>
            <Link href="/profile" className="hover:underline">Профиль</Link>
            <Link href="/admin" className="hover:underline">Админка</Link>
            {token ? (
              <button onClick={logout} className="hover:underline">Выйти</button>
            ) : (
              <>
                <Link href="/auth/login" className="hover:underline">Войти</Link>
                <Link href="/auth/register" className="hover:underline">Регистрация</Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="flex-grow p-4">{children}</main>
      <footer className="p-4 bg-gray-800 text-white text-center">
        © 2025 ProjectSchool
      </footer>
    </>
  );
}
