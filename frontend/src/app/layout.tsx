import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Школьная платформа',
  description: 'Учись весело с интерактивными заданиями!',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="flex flex-col min-h-screen">
        <header className="bg-primary text-white p-4 sticky top-0 z-10">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold">Школьная платформа</h1>
            <nav className="hidden md:flex space-x-4">
              <a href="/" className="hover:underline">Главная</a>
              <a href="/courses" className="hover:underline">Курсы</a>
              <a href="/tasks" className="hover:underline">Задания</a>
              <a href="/login" className="hover:underline">Вход</a>
              <a href="/register" className="hover:underline">Регистрация</a>
            </nav>
            <button className="md:hidden text-white text-2xl">☰</button>
          </div>
        </header>
        <main className="flex-grow container mx-auto p-4">{children}</main>
        <footer className="bg-primary text-white p-4 text-center">
          <p>© 2025 Школьная платформа. Все права защищены.</p>
        </footer>
      </body>
    </html>
  );
}