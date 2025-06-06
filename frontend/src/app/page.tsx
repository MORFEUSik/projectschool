'use client';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto text-center mt-20 animate-fade-in-up">
      <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-400 text-transparent bg-clip-text mb-6">
        Добро пожаловать в ProjectSchool!
      </h1>

      <Card className="p-8 shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60 backdrop-blur">
        <p className="mb-6 text-lg text-gray-700 dark:text-gray-300">
          Обучайтесь, выполняйте задания и соревнуйтесь в таблице лидеров!
        </p>
        <Link href="/courses">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full shadow transition duration-200">
            Перейти к курсам
          </Button>
        </Link>
      </Card>
    </div>
  );
}
