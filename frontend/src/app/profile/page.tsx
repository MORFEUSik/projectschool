'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/entities/user/hook';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';
import Link from 'next/link';
import { AvatarModal } from '@/widgets/AvatarModal';
import { avatarOptions } from '@/shared/constants/avatars';

interface ErrorResponse {
  error?: string;
}

export default function ProfilePage() {
  const { user, isLoading, error, refetch } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [editError, setEditError] = useState('');
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setFullName(user.full_name || '');
    }
  }, [user]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    try {
      await api.put('/users/me', { username, email, full_name: fullName });
      await refetch();
      setIsEditing(false);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setEditError(axiosError.response?.data?.error || 'Ошибка обновления профиля');
    }
  };

  const handleAvatarUpdate = async (url: string) => {
    await refetch();
  };

  if (isLoading) return <div className="text-center mt-8">Загрузка...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Ошибка: {error}</div>;
  if (!user) return <div className="text-center mt-8">Пользователь не найден</div>;

  return (
    <div className="max-w-2xl mx-auto mt-12 px-4">
      <h1 className="text-4xl font-extrabold text-center mb-8 text-blue-600">Профиль</h1>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Аватар</h2>
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar_url || avatarOptions[0]}
            alt="avatar"
            className="w-24 h-24 rounded-full border-4 border-blue-500 object-cover"
          />
          <Button onClick={() => setAvatarModalOpen(true)}>Выбрать аватар</Button>
        </div>
      </Card>

      <Card>
        {isEditing ? (
          <form onSubmit={handleEdit} className="space-y-4">
            {editError && <p className="text-red-500 text-sm">{editError}</p>}

            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1">
                Имя
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-1">
                ФИО
              </label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <Button type="submit">Сохранить</Button>
              <Button type="button" onClick={() => setIsEditing(false)} variant="outline">
                Отмена
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-2 text-gray-800 dark:text-gray-100">
            <p><strong>Имя:</strong> {user.username}</p>
            {user.full_name && <p><strong>ФИО:</strong> {user.full_name}</p>}
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Роль:</strong> {user.role}</p>
            {user.role === 'student' && <p><strong>Класс:</strong> {user.class_number}</p>}
            <p><strong>Баллы:</strong> {user.points}</p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
              <Button onClick={() => setIsEditing(true)}>Редактировать профиль</Button>
              <Link href="/achievements">
                <Button variant="outline">Мои достижения 🏆</Button>
              </Link>
            </div>
          </div>
        )}
      </Card>

      <AvatarModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        currentAvatar={user?.avatar_url}
        onAvatarUpdate={handleAvatarUpdate}
      />
    </div>
  );
}
