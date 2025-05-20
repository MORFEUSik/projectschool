import { useState, useEffect } from 'react';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';

interface Assignment {
  id: number;
  title: string;
  description: string;
  max_score: number;
  due_date: string;
  file_url?: string; // Добавлено
}

interface ErrorResponse {
  error?: string;
}

export function useAssignments(courseId: string | string[]) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssignments() {
      setLoading(true);
      try {
        const response = await api.get<Assignment[]>(`/courses/${courseId}/assignments`);
        setAssignments(response.data);
        setError(null);
      } catch (err: unknown) {
        const axiosError = err as AxiosError<ErrorResponse>;
        setError(axiosError.response?.data?.error || 'Не удалось загрузить задания');
      } finally {
        setLoading(false);
      }
    }
    fetchAssignments();
  }, [courseId]);

  const refetch = () => {
    async function fetchAssignments() {
      setLoading(true);
      try {
        const response = await api.get<Assignment[]>(`/courses/${courseId}/assignments`);
        setAssignments(response.data);
        setError(null);
      } catch (err: unknown) {
        const axiosError = err as AxiosError<ErrorResponse>;
        setError(axiosError.response?.data?.error || 'Не удалось загрузить задания');
      } finally {
        setLoading(false);
      }
    }
    fetchAssignments();
  };

  return { assignments, loading, error, refetch };
}