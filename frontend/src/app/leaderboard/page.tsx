'use client';
import { useState, useEffect } from 'react';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { AxiosError } from 'axios';

interface LeaderboardUser {
  id: number;
  username: string;
  points: number;
}

interface ErrorResponse {
  error?: string;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [courseId, setCourseId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get<LeaderboardUser[]>(`/leaderboard${courseId ? `?course_id=${courseId}` : ''}`);
      setUsers(response.data);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setError(axiosError.response?.data?.error || 'Не удалось загрузить таблицу лидеров');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [courseId]);

  return (
    <div className="max-w-3xl mx-auto mt-12 px-4">
      <h1 className="text-4xl font-extrabold text-blue-600 text-center mb-8">🏆 Таблица лидеров</h1>

      <Card className="mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchLeaderboard();
          }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <Input
            type="number"
            placeholder="ID курса (опционально)"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full sm:flex-1"
          />
          <Button type="submit">Показать</Button>
        </form>
      </Card>

      {isLoading && <p className="text-center text-gray-500">Загрузка...</p>}
      {error && <p className="text-center text-red-500 mb-4">{error}</p>}

      <Card>
        {users.length === 0 && !isLoading ? (
          <p className="text-center text-gray-500">Нет данных</p>
        ) : (
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-gray-600 text-gray-500 uppercase">
                <th className="py-2 px-3">#</th>
                <th className="py-2 px-3">Пользователь</th>
                <th className="py-2 px-3">Баллы</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr
                  key={user.id}
                  className="border-b last:border-none border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <td className="py-2 px-3 font-medium">{index + 1}</td>
                  <td className="py-2 px-3">{user.username}</td>
                  <td className="py-2 px-3 font-semibold text-blue-600 dark:text-blue-400">{user.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
