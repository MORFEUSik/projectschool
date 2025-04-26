'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { fetchWithAuth } from '@/shared/api/fetch';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

export default function NewAssignmentPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { id: courseId } = useParams();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token') || Cookies.get('token');
      if (!token) {
        toast.error('Пожалуйста, войдите в аккаунт');
        router.push('/login');
        return;
      }

      const response = await fetchWithAuth(`/api/courses/${courseId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error('Ошибка создания задания');
      }
      toast.success('Задание успешно создано!');
      router.push(`/courses/${courseId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка создания';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500">
      <Card className="w-full max-w-md p-6 shadow-lg animate-bounce-in">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Создать задание</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Название задания"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Введите название"
            className="mb-4"
          />
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Описание</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Введите описание"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Загрузка...' : 'Создать'}
          </Button>
        </form>
      </Card>
    </div>
  );
}