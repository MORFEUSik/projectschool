'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@/entities/user/hook';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';

interface User {
  id: number;
  username: string;
  role: string;
}

interface Course {
  id: number;
  title: string;
}

interface ErrorResponse {
  error?: string;
}

export default function AdminPage() {
  const { user, isLoading } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const usersResponse = await api.get<User[]>('/users');
      const coursesResponse = await api.get<Course[]>('/courses');
      setUsers(usersResponse.data);
      setCourses(coursesResponse.data);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setError(axiosError.response?.data?.error || 'Ошибка загрузки данных');
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/users/${userId}/role`, { role });
      fetchData();
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setError(axiosError.response?.data?.error || 'Ошибка изменения роли');
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  if (isLoading) return <div className="text-center mt-8">Загрузка...</div>;
  if (!user || user.role !== 'admin')
    return <div className="text-center mt-8 text-red-500">Доступ запрещён</div>;

  return (
    <div className="max-w-4xl mx-auto mt-12 px-4">
  <h1 className="text-4xl font-extrabold text-center text-blue-600 mb-8">🛠 Админ-панель</h1>
  {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

  <Card className="mb-6">
    <h2 className="text-xl font-semibold mb-4">Управление пользователями</h2>
    <form onSubmit={handleUpdateRole} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="userId" className="block text-sm font-medium mb-1">ID пользователя</label>
        <Input id="userId" type="number" value={userId} onChange={(e) => setUserId(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium mb-1">Роль</label>
        <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="student, teacher, admin" required />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit">Изменить роль</Button>
      </div>
    </form>
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Список пользователей</h3>
      <ul className="text-sm space-y-1">
        {users.map((u) => (
          <li key={u.id} className="text-gray-700 dark:text-gray-300">{u.username} (ID: {u.id}, Роль: {u.role})</li>
        ))}
      </ul>
    </div>
  </Card>

  <Card>
    <h2 className="text-xl font-semibold mb-4">Управление курсами</h2>
    <ul className="text-sm space-y-1">
      {courses.map((c) => (
        <li key={c.id}>{c.title} (ID: {c.id})</li>
      ))}
    </ul>
  </Card>
</div>
  );
}