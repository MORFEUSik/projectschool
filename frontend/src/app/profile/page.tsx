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
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface ErrorResponse {
  error?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: string;
  class_number?: string;
  points: number;
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
      toast.success('Профиль обновлён!');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Ошибка обновления профиля';
      setEditError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleAvatarUpdate = async (url: string) => {
    try {
      await refetch();
      toast.success('Аватар обновлён!');
    } catch (err) {
      toast.error('Ошибка обновления аватара');
      console.error('Avatar update error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center mt-12 px-4">
        <div className="animate-pulse h-24 w-24 rounded-full bg-gray-200 mx-auto mb-4" />
        <div className="animate-pulse h-6 w-48 bg-gray-200 rounded mx-auto" />
      </div>
    );
  }
  if (error) {
    return <div className="text-center mt-12 text-red-500 px-4">Ошибка: {error}</div>;
  }
  if (!user) {
    return <div className="text-center mt-12 px-4">Пользователь не найден</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-12 px-4">
      <motion.h1
			  initial={{ opacity: 0, y: 20 }}
			  animate={{ opacity: 1, y: 0 }}
			  transition={{ duration: 0.5, delay: 0.1 }}
			  className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
			>
			  Профиль
			</motion.h1>  

      <Card
        className="p-6 mb-6 card-shadow card-hover-gradient dark:bg-gray-800 animate-fade-in-up"
        style={{ animationDelay: '200ms' }}
      >
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Аватар</h2>
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="animate-pulse h-24 w-24 rounded-full bg-gray-200" />
          ) : (
            <img
              src={user?.avatar_url || avatarOptions[0]}
              alt="avatar"
              className="w-24 h-24 rounded-full border-4 border-blue-600 dark:border-blue-400 object-cover hover:scale-105 transition-transform duration-200"
            />
          )}
          <Button
            onClick={() => setAvatarModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 transition-transform duration-200"
          >
            Выбрать аватар
          </Button>
        </div>
      </Card>

      <Card
        className="p-6 card-shadow card-hover-gradient dark:bg-gray-800 animate-fade-in-up"
        style={{ animationDelay: '300ms' }}
      >
        {isEditing ? (
          <form onSubmit={handleEdit} className="space-y-4">
            {editError && (
              <p className="bg-red-500 dark:bg-red-600 text-white dark:text-gray-100 p-3 rounded text-sm animate-pulse mx-auto text-center">
                {editError}
              </p>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
              >
                Имя
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Введите имя"
                className="border-blue-600 dark:bg-gray-800 dark:text-gray-300 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
              >
                ФИО
              </label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Иванов Иван Иванович"
                className="border-blue-600 dark:bg-gray-800 dark:text-gray-300 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@domain.com"
                className="border-blue-600 dark:bg-gray-800 dark:text-gray-300 focus:ring-blue-600"
              />
            </div>

            <div
              className="flex flex-col sm:flex-row justify-end gap-3 pt-3 animate-pulse"
              style={{ animationDelay: '400ms' }}
            >
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-600/20 transition-all duration-200"
              >
                Сохранить
              </Button>
              <Button
                type="button"
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-600 hover:bg-blue-600 hover:text-white dark:hover:text-white transition-colors duration-200"
              >
                Отмена
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-gray-900 dark:text-gray-100">
            <p>
              <strong>Имя:</strong> {user.username}
            </p>
            {user.full_name && (
              <p>
                <strong>ФИО:</strong> {user.full_name}
              </p>
            )}
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p
              className="relative group"
              data-tooltip="Роль определяет ваш уровень доступа"
            >
              <strong>Роль:</strong> {user.role}
              <span className="absolute hidden group-hover:block bg-gray-800 dark:bg-gray-900 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                Роль определяет ваш уровень доступа
              </span>
            </p>
            {user.role === 'student' && (
              <p>
                <strong>Класс:</strong> {user.class_number}
              </p>
            )}
            <p>
              <strong>Баллы:</strong> {user.points}
            </p>

            <div
              className="mt-6 flex flex-col sm:flex-row gap-3 justify-end animate-pulse"
              style={{ animationDelay: '400ms' }}
            >
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-600/20 transition-all duration-200"
              >
                Редактировать профиль
              </Button>
              <Link href="/achievements">
                <Button
                  variant="outline"
                  className="border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-600 hover:bg-blue-600 hover:text-white dark:hover:text-white transition-colors duration-200"
                >
                  Мои достижения 🏆
                </Button>
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