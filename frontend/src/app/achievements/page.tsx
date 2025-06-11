'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/entities/user/hook';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface Achievement {
  title: string;
  description: string;
  awarded_at: string;
}

export default function AchievementsPage() {
  const { user } = useUser(); // Для авторизации
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAchievements() {
      try {
        const response = await api.get<Achievement[]>('/users/me/achievements');
        setAchievements(response.data);
      } catch (err: unknown) {
        const errorMsg = 'Не удалось загрузить достижения';
        setError(errorMsg);
        toast.error(errorMsg);
        console.error('API error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAchievements();
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-12 px-4">
		  <motion.h1
			  initial={{ opacity: 0, y: 20 }}
			  animate={{ opacity: 1, y: 0 }}
			  transition={{ duration: 0.5, delay: 0.1 }}
			  className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
			>
			 🏅 Мои достижения
			</motion.h1>  
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse h-32 w-full bg-gray-200 dark:bg-gray-700 rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-12 px-4">
		  <motion.h1
			  initial={{ opacity: 0, y: 20 }}
			  animate={{ opacity: 1, y: 0 }}
			  transition={{ duration: 0.5, delay: 0.1 }}
			  className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
			>
			 🏅 Мои достижения
			</motion.h1>  
        <p
          className="text-center bg-red-500 dark:bg-red-600 text-white p-3 rounded mb-4 animate-pulse"
          style={{ animationDelay: '200ms' }}
        >
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 px-4">
      <h1
        className="text-4xl font-extrabold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text animate-fade-in-up"
        style={{ animationDelay: '100ms' }}
      >
        🏅 Мои достижения
      </h1>

      {achievements.length === 0 ? (
        <p
          className="text-center text-gray-500 dark:text-gray-400 animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          Вы ещё не получили ни одного достижения.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {achievements.map((ach, index) => {
            const awardedDate = new Date(ach.awarded_at);
            const isNew = (Date.now() - awardedDate.getTime()) / (1000 * 60 * 60 * 24) < 7;
            return (
              <Card
                key={index}
                className={clsx(
                  'p-5 card-shadow card-hover-gradient dark:bg-gray-800 hover:scale-105 transition-transform duration-200 animate-fade-in-up group',
                  isNew && 'animate-pulse'
                )}
                style={{ animationDelay: `${200 + index * 100}ms` }}
                data-tooltip={`Получено: ${awardedDate.toLocaleString('ru-RU', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🏅</span>
                  <div>
                    <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                      {ach.title}
                    </h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1 line-clamp-2">
                      {ach.description}
                    </p>
                    <p className="text-xs text-gray-400">
                      Получено:{' '}
                      {awardedDate.toLocaleString('ru-RU', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                </div>
                <span className="absolute hidden group-hover:block bg-gray-800 dark:bg-gray-900 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  Получено: {awardedDate.toLocaleString('ru-RU', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}