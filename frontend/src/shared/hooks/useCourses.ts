'use client';
import { useEffect, useState } from 'react';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';

interface Course {
  id: number;
  title: string;
  description: string;
  teacher: { username: string };
}

interface UseCoursesResult {
  courses: Course[];
  loading: boolean;
  error: string | null;
  refetch: (limit?: number, offset?: number) => Promise<void>;
  total: number; // Общее количество курсов
}

export function useCourses(limit: number = 6, offset: number = 0): UseCoursesResult {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0); // Общее количество курсов

  const fetchCourses = async (newLimit?: number, newOffset?: number) => {
    setLoading(true);
    try {
      const response = await api.get('/courses', {
        params: {
          limit: newLimit || limit,
          offset: newOffset || offset,
        },
      });
      // Предполагаем, что бэк возвращает { courses: [], total: number }
      setCourses(response.data.courses || response.data);
      setTotal(response.data.total || (response.data.length || 0)); // Если total нет, используем длину массива как временное решение
      setError(null);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ error?: string }>;
      console.error('Ошибка загрузки курсов:', err);
      setError(axiosError.response?.data?.error || 'Не удалось загрузить курсы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(limit, offset);
  }, [limit, offset]);

  return { courses, loading, error, refetch: fetchCourses, total };
}