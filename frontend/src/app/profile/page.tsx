// src/app/profile/page.tsx
'use client';
import { useUser } from '@/entities/user/hook';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';

export default function ProfilePage() {
  const { user, isLoading, error } = useUser();

  if (isLoading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;
  if (!user) return <div>Пользователь не найден</div>;

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Профиль</h1>
      <Card>
        <p><strong>Имя:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Роль:</strong> {user.role}</p>
        {user.role === 'student' && <p><strong>Класс:</strong> {user.class_number}</p>}
        <p><strong>Баллы:</strong> {user.points}</p>
        <Button>Редактировать профиль</Button>
      </Card>
    </div>
  );
}