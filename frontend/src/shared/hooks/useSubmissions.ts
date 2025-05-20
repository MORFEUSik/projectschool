import { useState, useEffect } from 'react';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';

interface Submission {
  id: number;
  user_id: number;
  username: string;
  content: string;
  score: number;
  submitted_at: string;
  assignment_id: number;
  assignment_title: string;
  course_id: number;
  course_title: string;
}

interface ErrorResponse {
  error?: string;
}

export function useSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubmissions() {
      setLoading(true);
      try {
        const response = await api.get<Submission[]>('/users/me/submissions');
        console.log('Ответ от /api/users/me/submissions:', response.data); // Для отладки
        setSubmissions(response.data);
        setError(null);
      } catch (err: unknown) {
        const axiosError = err as AxiosError<ErrorResponse>;
        setError(axiosError.response?.data?.error || 'Не удалось загрузить решения');
        console.error('Ошибка загрузки решений:', err); // Для отладки
      } finally {
        setLoading(false);
      }
    }
    fetchSubmissions();
  }, []);

  return { submissions, loading, error };
}