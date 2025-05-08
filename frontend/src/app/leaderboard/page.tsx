// src/app/leaderboard/page.tsx
'use client';
import { useState } from 'react';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import { Input } from '@/shared/ui/Input';

interface LeaderboardUser {
  id: number;
  username: string;
  points: number;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [courseId, setCourseId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/leaderboard${courseId ? `?course_id=${courseId}` : ''}`);
      setUsers(response.data);
    } catch {
      setError('Не удалось загрузить таблицу лидеров');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Таблица лидеров</h1>
      <div className="mb-4">
        <Input
          type="number"
          placeholder="ID курса (опционально)"
          value={courseId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCourseId(e.target.value)}
        />
        <button
          onClick={fetchLeaderboard}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Показать
        </button>
      </div>
      {isLoading && <div>Загрузка...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <Card>
        <ul>
          {users.map((user, index) => (
            <li key={user.id}>
              {index + 1}. {user.username} - {user.points} баллов
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}