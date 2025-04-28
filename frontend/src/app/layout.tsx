import './globals.css';
import { ReactNode } from 'react';
import Nav from '@/components/Nav';
import MobileNav from '@/components/MobileNav';
import ClientProvider from './ClientProvider';

export const metadata = {
  title: 'Школьная платформа',
  description: 'Учись весело с интерактивными заданиями!',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="flex flex-col min-h-screen">
        <ClientProvider>
          <header className="bg-primary text-white p-4 sticky top-0 z-10">
            <div className="container mx-auto flex justify-between items-center">
              <h1 className="text-2xl md:text-3xl font-bold">Школьная платформа</h1>
              <Nav />
              <MobileNav />
            </div>
          </header>
          <main className="flex-grow container mx-auto p-4">{children}</main>
          <footer className="bg-primary text-white p-4 text-center">
            <p>© 2025 Школьная платформа. Все права защищены.</p>
          </footer>
        </ClientProvider>
      </body>
    </html>
  );
}