'use client';
import { useEffect, useState } from 'react';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import { useUser } from '@/entities/user/hook';

interface Achievement {
  title: string;
  description: string;
  awarded_at: string;
}

export default function AchievementsPage() {
  useUser(); // если нужен вызов для авторизации
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAchievements() {
      try {
        const response = await api.get<Achievement[]>('/users/me/achievements');
        setAchievements(response.data);
      } catch {
        setError('Не удалось загрузить достижения');
      } finally {
        setLoading(false);
      }
    }

    fetchAchievements();
  }, []);

  if (loading) return <div className="text-center mt-8">Загрузка...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Мои достижения</h1>
      {achievements.length === 0 ? (
        <p className="text-gray-500">Вы ещё не получили ни одного достижения.</p>
      ) : (
        <div className="space-y-4">
          {achievements.map((ach, index) => (
            <Card key={index} className="p-4">
              <h2 className="text-xl font-semibold">{ach.title}</h2>
              <p className="text-gray-700">{ach.description}</p>
              <p className="text-sm text-gray-400">Получено: {new Date(ach.awarded_at).toLocaleString()}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
