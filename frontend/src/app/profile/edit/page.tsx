'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { fetchWithAuth } from '@/shared/api/fetch';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { User } from '@/entities/user/model';

export default function EditProfilePage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token') || Cookies.get('token');
        if (!token) {
          toast.error('Пожалуйста, войдите в аккаунт');
          router.push('/login');
          return;
        }

        const response = await fetchWithAuth('/api/users/me', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
          throw new Error('Ошибка загрузки профиля');
        }
        const data: User = await response.json();
        setFormData({
          username: data.username,
          email: data.email,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить данные');
        toast.error(err instanceof Error ? err.message : 'Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetchWithAuth('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error('Ошибка обновления профиля');
      }
      toast.success('Профиль успешно обновлён!');
      router.push('/profile');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-xl text-gray-600">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500">
      <Card className="w-full max-w-md p-6 shadow-lg animate-bounce-in">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Редактировать профиль</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Имя пользователя"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Введите имя"
            className="mb-4"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Введите email"
            className="mb-4"
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Загрузка...' : 'Сохранить'}
          </Button>
        </form>
      </Card>
    </div>
  );
}