"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { fetchWithAuth } from '@/shared/api/fetch';
import { Card, Button, Input } from '@/shared/ui';

export default function EditProfilePage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          ...(formData.password && { password: formData.password }),
        }),
      });
      await response.json();
      toast.success('Профиль обновлён!', { id: 'edit-profile' });
      router.push('/profile');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления профиля';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'edit-profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500">
      <Card className="w-full max-w-md p-6 shadow-lg profile-card">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Редактировать профиль</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Имя пользователя"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="input"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="input"
          />
          <Input
            label="Новый пароль (опционально)"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className="input"
          />
          <Button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Загрузка...' : 'Сохранить'}
          </Button>
        </form>
      </Card>
    </div>
  );
}