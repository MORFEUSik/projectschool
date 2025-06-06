'use client';
import { useState, useEffect } from 'react';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

interface Notification {
  id: number;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface ErrorResponse {
  error?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<Notification[]>('/notifications');
      setNotifications(response.data);
      setError('');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setError(axiosError.response?.data?.error || 'Ошибка загрузки уведомлений');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling каждые 30 секунд
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      toast.success('Уведомление помечено как прочитанное');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      toast.error(axiosError.response?.data?.error || 'Ошибка пометки уведомления');
    }
  };

  if (isLoading && !notifications.length) {
    return <div className="text-center mt-8">Загрузка...</div>;
  }
  if (error) {
    return <div className="text-center mt-8 text-red-500">Ошибка: {error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-12 px-4">
  <h1 className="text-4xl font-extrabold text-center text-blue-600 mb-8">🔔 Уведомления</h1>

  {isLoading && !notifications.length && (
    <p className="text-center text-gray-500">Загрузка...</p>
  )}
  {error && <p className="text-center text-red-500">Ошибка: {error}</p>}

  <div className="space-y-4">
    {notifications.length === 0 ? (
      <Card className="p-6">
        <p className="text-center text-gray-500">Нет уведомлений</p>
      </Card>
    ) : (
      notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-l-4 transition-all ${
            notification.is_read
              ? 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/40'
              : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          }`}
        >
          <div className="flex-1">
            <p className={`text-sm sm:text-base ${notification.is_read ? 'text-gray-500' : 'font-semibold text-blue-800 dark:text-blue-200'}`}>
              {notification.message}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(notification.created_at).toLocaleString()}
            </p>
          </div>

          {!notification.is_read && (
            <div className="shrink-0">
              <Button
                onClick={() => markAsRead(notification.id)}
                className="text-sm px-3 py-1"
              >
                Прочитано
              </Button>
            </div>
          )}
        </Card>
      ))
    )}
  </div>
</div>
  );
}