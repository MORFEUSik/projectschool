// src/app/admin/page.tsx
'use client';
import { useUser } from '@/entities/user/hook';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';

export default function AdminPage() {
  const { user, isLoading } = useUser();

  if (isLoading) return <div>Загрузка...</div>;
  if (!user || user.role !== 'admin') return <div>Доступ запрещён</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Админ-панель</h1>
      <Card>
        <h2 className="text-xl font-semibold mb-2">Управление пользователями</h2>
        <Button>Изменить роль</Button>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold mb-2">Управление курсами</h2>
        <Button>Создать курс</Button>
        <Button>Удалить курс</Button>
      </Card>
    </div>
  );
}