import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createCourse } from './api';

export function useCreateCourse() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleCreate(formData: { title: string; description: string }) {
    setLoading(true);
    setError('');
    try {
      await createCourse(formData);
      toast.success('Курс успешно создан!', { id: 'create-course' });
      router.push('/courses');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка создания';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'create-course' });
    } finally {
      setLoading(false);
    }
  }

  return { handleCreate, loading, error };
}