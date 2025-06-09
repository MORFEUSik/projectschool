'use client';
import { useAuth } from '@/shared/hooks/useAuth';
import { AuthProvider } from '@/shared/hooks/useAuth';
import Link from 'next/link';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans transition-colors duration-300">
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { token, logout } = useAuth();

  return (
    <>
      <header className="shadow sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200 dark:bg-gray-900/80 dark:border-gray-700">
        <nav className="flex justify-between items-center max-w-6xl mx-auto px-4 py-3">
          <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition">
            ProjectSchool
          </Link>
          <div className="flex flex-wrap gap-3 text-sm">
            <NavLink href="/courses" label="Уроки" />
            <NavLink href="/leaderboard" label="Лидерборд" />
            <NavLink href="/submissions" label="Мои решения" />
            <NavLink href="/profile" label="Профиль" />
            <NavLink href="/admin" label="Админка" />
            {token ? (
              <button
                onClick={logout}
                className="text-red-600 hover:text-red-700 transition font-medium"
              >
                Выйти
              </button>
            ) : (
              <>
                <NavLink href="/auth/login" label="Войти" />
                <NavLink href="/auth/register" label="Регистрация" />
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-grow px-4 py-8">{children}</main>

      <footer className="bg-gray-900 text-white text-center py-6 mt-auto text-sm">
        © 2025 ProjectSchool. Все права защищены.
      </footer>
    </>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition font-medium"
    >
      {label}
    </Link>
  );
}
