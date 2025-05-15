'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/entities/user/hook';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { AxiosError } from 'axios';

interface Assignment {
  id: number;
  title: string;
  description: string;
  max_score: number;
  due_date: string;
}

interface Submission {
  id: number;
  content: string;
  grade: number;
}

interface ErrorResponse {
  error?: string;
}

export default function AssignmentPage() {
  const { id } = useParams();
  const { user } = useUser();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAssignment() {
      setIsLoading(true);
      try {
        const assignmentResponse = await api.get<Assignment>(`/assignments/${id}`);
        setAssignment(assignmentResponse.data);
        if (user?.role === 'student') {
          const submissionResponse = await api.get<Submission[]>(`/submissions?assignment_id=${id}&user_id=${user.id}`);
          setSubmission(submissionResponse.data[0] || null);
        }
      } catch (err: unknown) {
        const axiosError = err as AxiosError<ErrorResponse>;
        setError(axiosError.response?.data?.error || 'Ошибка загрузки задания');
      } finally {
        setIsLoading(false);
      }
    }
    if (user) {
      fetchAssignment();
    }
  }, [id, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/assignments/${id}/submit`, { content });
      window.location.reload();
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setError(axiosError.response?.data?.error || 'Ошибка отправки решения');
    }
  };

  if (isLoading) return <div className="text-center mt-8">Загрузка...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Ошибка: {error}</div>;
  if (!assignment) return <div className="text-center mt-8">Задание не найдено</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">{assignment.title}</h1>
      <Card className="p-6 mb-6">
        <p className="mb-2">{assignment.description}</p>
        <p className="mb-2">
          <strong>Максимальный балл:</strong> {assignment.max_score}
        </p>
        <p className="mb-2">
          <strong>Срок сдачи:</strong> {new Date(assignment.due_date).toLocaleString()}
        </p>
      </Card>
      {user?.role === 'student' && (
        <Card className="p-6">
          {submission ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Ваше решение</h2>
              <p className="mb-2">{submission.content}</p>
              <p className="mb-2">
                <strong>Оценка:</strong> {submission.grade || 'Не оценено'}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">Отправить решение</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div>
                  <label htmlFor="content" className="block text-sm font-medium mb-1">
                    Решение
                  </label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="border p-2 rounded w-full"
                    rows={5}
                    required
                  />
                </div>
                <Button type="submit">Отправить</Button>
              </form>
            </>
          )}
        </Card>
      )}
    </div>
  );
}