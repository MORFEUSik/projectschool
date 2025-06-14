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

interface Course {
  id: number;
  title: string;
  description: string;
  subject: string;
  class_number: number;
  teacher: { username: string };
}

// Иконки для предметов
const subjectIcons: Record<string, string> = {
  Математика: '🧮',
  'Русский язык': '📖',
  Физика: '⚛️',
  Химия: '🧪',
  Литература: '📚',
  Биология: '🌱',
  История: '🏛️',
};

// Цвета для бейджей предметов
const subjectColors: Record<string, string> = {
  Математика: 'bg-blue-100 text-blue-800',
  'Русский язык': 'bg-purple-100 text-purple-800',
  Физика: 'bg-green-100 text-green-800',
  Химия: 'bg-yellow-100 text-yellow-800',
  Литература: 'bg-pink-100 text-pink-800',
  Биология: 'bg-teal-100 text-teal-800',
  История: 'bg-orange-100 text-orange-800',
};

export default function ProfilePage() {
  const { user, isLoading, error, refetch } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [editError, setEditError] = useState('');
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setFullName(user.full_name || '');
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    if (!user) return;
    setIsCoursesLoading(true);
    setCoursesError('');
    try {
      let response;
      if (user.role === 'student') {
        response = await api.get('/enrollments', { params: { userID: user.id } });
      } else if (user.role === 'teacher' || user.role === 'admin') {
        response = await api.get('/courses', { params: { teacherID: user.id } });
      }
      setCourses(response.data.courses || []);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Ошибка загрузки курсов';
      setCoursesError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsCoursesLoading(false);
    }
  };

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
    <div className="min-h-[100dvh]">
      <div className="max-w-4xl mx-auto mt-12 px-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
        >
          Профиль
        </motion.h1>

        <Card
          className="p-6 mb-6 card-transparent card-shadow card-hover-gradient animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex flex-col items-center sm:items-start">
              {isLoading ? (
                <div className="animate-pulse h-24 w-24 rounded-full bg-gray-200" />
              ) : (
                <img
                  src={user?.avatar_url || avatarOptions[0]}
                  alt="avatar"
                  className="w-24 h-24 rounded-full border-4 border-blue-600 dark:border-blue-400 object-cover"
                />
              )}
              <Button
                onClick={() => setAvatarModalOpen(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
              >
                Выбрать аватар
              </Button>
            </div>

            {isEditing ? (
              <form onSubmit={handleEdit} className="flex-1 space-y-4">
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
              <div className="flex-1 space-y-4 text-gray-900 dark:text-gray-100">
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
                {user.role === 'student' && (
  <p>
    <strong>Баллы:</strong>{' '}
    <span className="font-semibold text-blue-600 dark:text-blue-400">
      {user.points ?? 0}
    </span>
  </p>
)}

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
                  {user.role === 'student' && (
                    <Link href="/achievements">
                      <Button
                        variant="outline"
                        className="border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-600 hover:bg-blue-600 hover:text-white dark:hover:text-white transition-colors duration-200"
                      >
                        Мои достижения 🏆
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card
          className="p-6 card-transparent card-shadow card-hover-gradient animate-fade-in-up"
          style={{ animationDelay: '400ms' }}
        >
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
            {user.role === 'student' ? 'Мои уроки' : 'Созданные уроки'}
          </h2>
          {isCoursesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse h-24 w-full bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          ) : coursesError ? (
            <p className="text-center text-red-500">{coursesError}</p>
          ) : courses.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              {user.role === 'student' ? 'Вы не записаны на уроки' : 'Вы не создали уроки'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {courses.map((course, index) => (
                <Link href={`/courses/${course.id}`} key={course.id}>
                  <Card
                    className={clsx(
                      'p-6 flex flex-col cursor-pointer card-transparent card-shadow card-hover-gradient min-h-[auto]',
                      'animate-fade-in-up transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
                      'hover:scale-102'
                    )}
                    style={{ animationDelay: `${(index + 1) * 100}ms` }}
                  >
                    <h3 className="text-lg font-bold text-blue-700 mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                    <p className="text-sm mt-2">
                      <strong>Предмет:</strong>{' '}
                      <span
                        className={clsx(
                          'inline-block px-2 py-1 rounded-full text-xs font-semibold',
                          subjectColors[course.subject]
                        )}
                      >
                        {subjectIcons[course.subject]} {course.subject}
                      </span>
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      <strong>Класс:</strong> {course.class_number}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      <strong>Преподаватель:</strong> {course.teacher.username}
                    </p>
                  </Card>
                </Link>
              ))}
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
    </div>
  );
}