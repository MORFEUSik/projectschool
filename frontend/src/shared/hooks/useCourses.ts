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
  refetch: (limit?: number, offset?: number, classNumber?: number | 'all') => Promise<void>;
  total: number;
}

export function useCourses(
  limit: number,
  offset: number,
  classNumber?: number | 'all'
): UseCoursesResult {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const { user } = useUser();

  const fetchCourses = async (
    newLimit?: number,
    newOffset?: number,
    newClassNumber?: number | 'all'
  ) => {
    setLoading(true);
    try {
      const params: Record<string, number | string> = {
        limit: newLimit ?? limit,
        offset: newOffset ?? offset,
      };

      // 💡 Явно передаём class_number, включая строку 'all'
      if (newClassNumber !== undefined) {
        params.class_number = newClassNumber;
      }

      const response = await api.get('/courses', { params });
      setCourses(response.data.courses);
      setTotal(response.data.total);
      setError(null);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ error?: string }>;
      setError(axiosError.response?.data?.error || 'Не удалось загрузить курсы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ⚠️ Всегда использовать classNumber проп, даже если student
    fetchCourses(limit, offset, classNumber);
  }, [limit, offset, classNumber, user?.id]);

  return { courses, loading, error, refetch: fetchCourses, total };
}
