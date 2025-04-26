'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { fetchWithAuth } from '@/shared/api/fetch';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { Submission } from '@/entities/submission/model';

export default function GradeSubmissionPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [grades, setGrades] = useState<{ [key: number]: number }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id: courseId, assignmentId } = useParams();

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const token = localStorage.getItem('token') || Cookies.get('token');
        if (!token) {
          toast.error('Пожалуйста, войдите в аккаунт');
          router.push('/login');
          return;
        }

        const response = await fetchWithAuth(`/api/assignments/${assignmentId}/submissions`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
          throw new Error('Ошибка загрузки решений');
        }
        const data: Submission[] = await response.json();
        setSubmissions(data);
        setGrades(data.reduce((acc, sub) => ({ ...acc, [sub.id]: sub.grade || 0 }), {}));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить данные');
        toast.error(err instanceof Error ? err.message : 'Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [router, assignmentId]);

  const handleGradeChange = (submissionId: number, value: string) => {
    setGrades({ ...grades, [submissionId]: parseInt(value) || 0 });
  };

  const handleSubmitGrade = async (submissionId: number) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetchWithAuth(`/api/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: grades[submissionId] }),
      });
      if (!response.ok) {
        throw new Error('Ошибка выставления оценки');
      }
      toast.success('Оценка успешно выставлена!');
      setSubmissions(submissions.map(sub =>
        sub.id === submissionId ? { ...sub, grade: grades[submissionId] } : sub
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка выставления';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-xl text-gray-600">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Выставить оценки</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {submissions.length ? (
          submissions.map((submission) => (
            <Card key={submission.id} className="p-6 mb-4">
              <h3 className="text-lg font-semibold">{submission.assignment.title}</h3>
              <p className="text-gray-600">Решение: {submission.content}</p>
              <p className="text-gray-600">Текущая оценка: {submission.grade ?? 'Не оценено'}</p>
              <div className="flex gap-4 mt-4">
                <Input
                  label="Оценка"
                  type="number"
                  value={grades[submission.id].toString()}
                  onChange={(e) => handleGradeChange(submission.id, e.target.value)}
                  placeholder="Введите оценку"
                />
                <Button
                  onClick={() => handleSubmitGrade(submission.id)}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Загрузка...' : 'Сохранить'}
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <p className="text-gray-500">Решений пока нет.</p>
        )}
      </div>
    </div>
  );
}