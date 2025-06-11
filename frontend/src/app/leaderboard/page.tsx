'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/entities/user/hook';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

import { motion } from 'framer-motion';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface LeaderboardUser {
  id: number;
  username: string;
  points: number;
}

interface ErrorResponse {
  error?: string;
}

export default function LeaderboardPage() {
  const { user } = useUser();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [courseId, setCourseId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get<LeaderboardUser[]>(
        `/leaderboard${courseId ? `?course_id=${courseId}` : ''}`
      );
      setUsers(response.data);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Не удалось загрузить таблицу лидеров';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('API error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [courseId]);

  return (
    <div className="max-w-3xl mx-auto mt-12 px-4">

		<motion.h1
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.1 }}
  className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
>
  🏆 Таблица лидеров
</motion.h1>

      

      <Card
        className="p-6 mb-6 card-shadow card-hover-gradient dark:bg-gray-800 animate-fade-in-up"
        style={{ animationDelay: '200ms' }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchLeaderboard();
          }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <div
            className="relative w-full sm:flex-1 group"
            data-tooltip="Введите ID урока"
          >
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <Input
              type="number"
              placeholder="Введите ID урока"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="pl-10 border-blue-600 dark:bg-gray-700 dark:text-gray-300 focus:ring-blue-600 w-full"
            />
            <span className="absolute hidden group-hover:block bg-gray-800 dark:bg-gray-900 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              Введите ID урока
            </span>
          </div>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full hover:scale-105 transition duration-200"
          >
            Показать
          </Button>
        </form>
      </Card>

      {error && (
        <p
          className="text-center bg-red-500 dark:bg-red-600 text-white p-3 rounded mb-4 animate-pulse"
          style={{ animationDelay: '300ms' }}
        >
          {error}
        </p>
      )}

      <Card
        className="p-6 card-shadow card-hover-gradient dark:bg-gray-800 animate-fade-in-up"
        style={{ animationDelay: '300ms' }}
      >
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse h-12 w-full bg-gray-200 dark:bg-gray-700 rounded"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Нет данных</p>
        ) : (
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 uppercase">
                <th className="py-3 px-4 text-left">#</th>
                <th className="py-3 px-4 text-left">Пользователь</th>
                <th className="py-3 px-4 text-left">Баллы</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userItem, index) => (
                <tr
                  key={userItem.id}
                  className={clsx(
                    'border-b last:border-none border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition animate-fade-in-up',
                    userItem.id === user?.id && 'bg-blue-50 dark:bg-blue-900'
                  )}
                  style={{ animationDelay: `${(index + 1) * 100}ms` }}
                >
                  <td className="py-3 px-4 font-medium">
                    {index + 1}
                    {index === 0 && ' 🥇'}
                    {index === 1 && ' 🥈'}
                    {index === 2 && ' 🥉'}
                  </td>
                  <td className="py-3 px-4 line-clamp-2">{userItem.username}</td>
                  <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">
                    {userItem.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}