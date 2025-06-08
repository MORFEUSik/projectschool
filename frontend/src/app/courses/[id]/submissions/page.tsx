'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/entities/user/hook';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

interface Submission {
  id: number;
  user_id: number;
  username: string;
  assignment_id: number;
  assignment_title: string;
  course_id: number;
  course_title: string;
  content: string;
  score: number;
  submitted_at: string;
}


interface ErrorResponse {
  error?: string;
}

export default function CourseSubmissionsPage() {
  const { id: courseId } = useParams();
  const { user } = useUser();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [gradeInputs, setGradeInputs] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    async function fetchSubmissions() {
      setIsLoading(true);
      try {
        const response = await api.get(`/submissions?course_id=${courseId}`);
        setSubmissions(response.data);
        setError('');
      } catch (err: unknown) {
        const axiosError = err as AxiosError<ErrorResponse>;
        setError(axiosError.response?.data?.error || 'Ошибка загрузки решений');
        toast.error(axiosError.response?.data?.error || 'Ошибка загрузки решений');
      } finally {
        setIsLoading(false);
      }
    }
    if (user && ['teacher', 'admin'].includes(user.role)) {
      fetchSubmissions();
    }
  }, [courseId, user]);

  const handleGradeChange = (submissionId: number, value: string) => {
    setGradeInputs((prev) => ({ ...prev, [submissionId]: value }));
  };

  const handleSetGrade = async (submissionId: number) => {
  const grade = parseFloat(gradeInputs[submissionId]);
  if (isNaN(grade) || grade < 0 || grade > 5) {
    toast.error('Оценка должна быть от 0 до 5');
    return;
  }
  try {
    await api.put(`/submissions/${submissionId}/grade`, { grade });
    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === submissionId ? { ...sub, score: grade } : sub
      )
    );
    toast.success('Оценка выставлена');
  } catch (err: unknown) {
    const axiosError = err as AxiosError<ErrorResponse>;
    toast.error(axiosError.response?.data?.error || 'Ошибка при выставлении оценки');
  }
};


  if (!user || !['teacher', 'admin'].includes(user.role)) {
    return <div className="text-center mt-8 text-red-500">Доступ запрещён</div>;
  }

  if (isLoading) return <div className="text-center mt-8">Загрузка...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Ошибка: {error}</div>;

  return (
    <div className="max-w-5xl mx-auto mt-12 px-4">
      <h1 className="text-4xl font-extrabold text-blue-600 text-center mb-8">📝 Решения студентов</h1>
      <Card>
        {submissions.length === 0 ? (
          <p className="text-center text-gray-500">Решений нет</p>
        ) : (
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-gray-600 text-gray-500 uppercase">
                <th className="py-2 px-3">Студент</th>
                <th className="py-2 px-3">Задание</th>
                <th className="py-2 px-3">Решение</th>
                <th className="py-2 px-3">Оценка</th>
                <th className="py-2 px-3">Дата</th>
                <th className="py-2 px-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
  <tr key={submission.id} className="...">
    <td className="py-2 px-3">{submission.username}</td>
    <td className="py-2 px-3">{submission.assignment_title}</td>
    <td className="py-2 px-3 truncate max-w-xs">{submission.content}</td>
    <td className="py-2 px-3">
      <Input
        type="number"
        step="0.1"
        min="0"
        max="5"
        value={gradeInputs[submission.id] ?? submission.score.toString()}
        onChange={(e) => handleGradeChange(submission.id, e.target.value)}
        className="w-16"
      />
    </td>
    <td className="py-2 px-3">{new Date(submission.submitted_at).toLocaleString()}</td>
    <td className="py-2 px-3">
      <Button onClick={() => handleSetGrade(submission.id)}>Сохранить</Button>
    </td>
  </tr>
))}

            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}