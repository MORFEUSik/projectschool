'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { fetchWithAuth } from '@/shared/api/fetch';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

export default function SubmissionPage() {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { id: courseId, assignmentId } = useParams();

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

      const response = await fetchWithAuth(`/api/assignments/${assignmentId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        throw new Error('Ошибка отправки решения');
      }
      toast.success('Решение успешно отправлено!');
      router.push(`/courses/${courseId}/assignments/${assignmentId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка отправки';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500">
      <Card className="w-full max-w-md p-6 shadow-lg animate-bounce-in">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Отправить решение</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Решение</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              placeholder="Введите ваше решение"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Загрузка...' : 'Отправить'}
          </Button>
        </form>
      </Card>
    </div>
  );
}