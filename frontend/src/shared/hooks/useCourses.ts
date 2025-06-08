'use client';
import { useEffect, useState } from 'react';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';
import { useUser } from '@/entities/user/hook';

interface Course {
  id: number;
  title: string;
  description: string;
  subject: string;
  class_number: number;
  teacher: { username: string };
}

interface UseCoursesResult {
  courses: Course[];
  loading: boolean;
  error: string | null;
  refetch: (limit?: number, offset?: number, classNumber?: number) => Promise<void>;
  total: number;
}

export function useCourses(limit: number = 6, offset: number = 0, classNumber?: number): UseCoursesResult {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const { user } = useUser();

  const fetchCourses = async (newLimit?: number, newOffset?: number, newClassNumber?: number) => {
    setLoading(true);
    try {
      const params: any = {
        limit: newLimit || limit,
        offset: newOffset || offset,
      };
      // Отправляем class_number, если он указан (включая undefined для "Все классы")
      if (newClassNumber !== undefined) {
        params.class_number = newClassNumber;
      }
      console.log('Fetching courses with params:', params); // Для отладки
      const response = await api.get('/courses', { params });
      setCourses(response.data.courses);
      setTotal(response.data.total);
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
    // Используем classNumber из пропса, если он есть, иначе user.class_number для студентов
    const initialClassNumber = classNumber !== undefined ? classNumber : (user?.role === 'student' && user?.class_number ? user.class_number : undefined);
    fetchCourses(limit, offset, initialClassNumber);
  }, [limit, offset, classNumber, user?.id]);

  return { courses, loading, error, refetch: fetchCourses, total };
}