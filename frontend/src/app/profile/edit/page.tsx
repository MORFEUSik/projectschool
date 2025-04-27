// src/app/profile/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { fetchWithAuth } from '@/shared/api/fetch';
import { useAuthCheck } from '@/shared/lib/useAuthCheck';
import { User } from '@/entities/user/model';

export default function EditProfilePage() {
  useAuthCheck();
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetchWithAuth('/api/users/me');
        const user: User = await response.json();
        setFormData({
          username: user.username,
          email: user.email,
          password: '',
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки профиля';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await fetchWithAuth('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      toast.success('Профиль обновлён!');
      router.push('/profile');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления профиля';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md p-6 animate-bounce-in">
        <h1 className="text-3xl font-bold text-center mb-6">Редактировать профиль</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Имя пользователя"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Введите имя"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Введите email"
          />
          <Input
            label="Новый пароль (оставьте пустым, если не меняете)"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Введите новый пароль"
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </form>
      </Card>
    </div>
  );
}