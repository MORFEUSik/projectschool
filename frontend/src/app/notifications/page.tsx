'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/entities/user/hook';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import clsx from 'clsx';
import { BellIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface ErrorResponse {
  error?: string;
}

export default function NotificationsPage() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    async function fetchNotifications() {
      setIsLoading(true);
      try {
        const response = await api.get('/notifications');
        setNotifications(response.data);
        setError(null);
      } catch (err: unknown) {
        const axiosError = err as AxiosError<ErrorResponse>;
        const errorMsg = axiosError.response?.data?.error || 'Ошибка загрузки уведомлений';
        setError(errorMsg);
        toast.error(errorMsg);
        console.error('API error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, is_read: true } : notif))
      );
      toast.success('Уведомление отмечено как прочитанное');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Ошибка пометки уведомления';
      toast.error(errorMsg);
      console.error('Mark as read error:', err);
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.is_read;
    if (filter === 'read') return notif.is_read;
    return true;
  });

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto mt-12 px-4">

			<motion.h1
			  initial={{ opacity: 0, y: 20 }}
			  animate={{ opacity: 1, y: 0 }}
			  transition={{ duration: 0.5, delay: 0.1 }}
			  className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
			>
			  🔔 Уведомления
			</motion.h1>        
        <p className="text-center text-gray-600 dark:text-gray-400">
          Пожалуйста, войдите в систему
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 px-4">
      <motion.h1
			  initial={{ opacity: 0, y: 20 }}
			  animate={{ opacity: 1, y: 0 }}
			  transition={{ duration: 0.5, delay: 0.1 }}
			  className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
			>
			  🔔 Уведомления
			</motion.h1> 

      {error && (
        <p
          className="text-center bg-red-500 dark:bg-red-600 text-white p-3 rounded mb-4 animate-pulse"
          style={{ animationDelay: '200ms' }}
        >
          {error}
        </p>
      )}

      <Card
        className="p-4 mb-6 card-shadow card-hover-gradient dark:bg-gray-800 animate-fade-in-up"
        style={{ animationDelay: '200ms' }}
      >
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            onClick={() => setFilter('all')}
            className={clsx(
              'text-sm',
              filter === 'all'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            )}
          >
            Все
          </Button>
          <Button
            onClick={() => setFilter('unread')}
            className={clsx(
              'text-sm',
              filter === 'unread'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            )}
          >
            Непрочитанные
          </Button>
          <Button
            onClick={() => setFilter('read')}
            className={clsx(
              'text-sm',
              filter === 'read'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            )}
          >
            Прочитанные
          </Button>
        </div>
      </Card>

      {isLoading && !notifications.length ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card
              key={i}
              className="p-4 card-shadow dark:bg-gray-800 animate-pulse"
            >
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-1/4 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
            </Card>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card
          className="p-6 text-center card-shadow card-hover-gradient dark:bg-gray-800 animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          <BellIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'unread'
              ? 'Нет непрочитанных уведомлений'
              : filter === 'read'
              ? 'Нет прочитанных уведомлений'
              : 'Нет уведомлений'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification, index) => (
            <Card
              key={notification.id}
              className={clsx(
                'p-4 card-shadow card-hover-gradient dark:bg-gray-800 transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg',
                notification.is_read ? 'opacity-75' : 'border-l-4 border-blue-600'
              )}
              style={{ animationDelay: `${200 + index * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                <BellIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-gray-800 dark:text-gray-200">{notification.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(notification.created_at).toLocaleString('ru-RU', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    <span
                      className={clsx(
                        'text-xs px-2 py-1 rounded-full',
                        notification.is_read
                          ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      )}
                    >
                      {notification.is_read ? 'Прочитано' : 'Непрочитано'}
                    </span>
                  </div>
                </div>
                {!notification.is_read && (
                  <Button
                    onClick={() => markAsRead(notification.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 hover:scale-105 transition-transform duration-200 flex items-center gap-1"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Прочитано
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}