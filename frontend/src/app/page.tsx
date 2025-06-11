'use client';

import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-20">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container text-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
        >
          📚 Добро пожаловать в ProjectSchool!
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-8 card-shadow card-hover-gradient rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60 backdrop-blur hover:scale-[1.02] transition-transform duration-300">
            <p className="mb-6 text-lg text-gray-700 dark:text-gray-300 line-clamp-3">
              Обучайтесь новым навыкам, выполняйте практические задания и соревнуйтесь с другими в таблице лидеров!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/courses">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full shadow hover:scale-105 transition duration-200">
                  Перейти к урокам
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button
  variant="outline"
  className="bg-white dark:bg-gray-900 border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:text-white px-6 py-2 rounded-full hover:scale-105 transition duration-200"
>
  Лидерборд
</Button>

              </Link>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </main>
  );
}