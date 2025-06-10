'use client';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-20">
      <div className="max-w-4xl mx-auto text-center">
        <h1
          className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text mb-6 animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          📚 Добро пожаловать в ProjectSchool!
        </h1>

        <Card
          className="p-8 card-shadow card-hover-gradient rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60 backdrop-blur hover:scale-[1.02] transition-transform duration-300"
          style={{ animationDelay: '200ms' }}
        >
          <p
            className="mb-6 text-lg text-gray-700 dark:text-gray-300 line-clamp-3 animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            Обучайтесь новым навыкам, выполняйте практические задания и соревнуйтесь с другими в таблице лидеров!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <Link href="/courses">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full shadow animate-pulse hover:scale-105 transition duration-200">
                Перейти к курсам
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button className="bg-transparent border border-blue-600 text-gray-900 dark:text-gray-900 dark:border-blue-400 hover:bg-blue-600 hover:text-gray-900 dark:hover:text-gray-900 px-6 py-2 rounded-full transition duration-200">
                Лидерборд
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}