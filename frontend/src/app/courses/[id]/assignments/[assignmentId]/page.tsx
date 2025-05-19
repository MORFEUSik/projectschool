'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUser } from '@/entities/user/hook';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

interface Assignment {
  id: number;
  title: string;
  description: string;
  max_score: number;
  due_date: string;
  course_id: number;
}

interface Submission {
  id: number;
  user_id: number;
  username: string;
  content: string;
  score: number | null;
  submitted_at: string;
}

interface ErrorResponse {
  error?: string;
}

const submissionSchema = z.object({
  content: z.string().min(1, 'Решение не может быть пустым'),
});

const gradeSchema = z.object({
  score: z.number().min(0, 'Оценка не может быть отрицательной'),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;
type GradeFormData = z.infer<typeof gradeSchema>;

export default function AssignmentPage() {
  const { id: courseId, assignmentId } = useParams();
  const { user } = useUser();
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isEditing, setIsEditing] = useState(false);

  const submissionForm = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: { content: '' },
  });

  const gradeForm = useForm<GradeFormData>({
    resolver: zodResolver(gradeSchema),
    defaultValues: { score: 0 },
  });

  useEffect(() => {
    async function fetchAssignment() {
      setIsLoading(true);
      try {
        const assignmentResponse = await api.get<Assignment>(`/courses/${courseId}/assignments/${assignmentId}`);
        setAssignment(assignmentResponse.data);
        if (user?.role === 'teacher' || user?.role === 'admin') {
          const submissionsResponse = await api.get<Submission[]>(`/submissions?assignment_id=${assignmentId}`);
          setSubmissions(submissionsResponse.data);
        }
      } catch (err: unknown) {
        const axiosError = err as AxiosError<ErrorResponse>;
        setError(axiosError.response?.data?.error || 'Ошибка загрузки задания');
      } finally {
        setIsLoading(false);
      }
    }
    fetchAssignment();
  }, [courseId, assignmentId, user]);

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить задание?')) return;
    try {
      const token = localStorage.getItem('token');
      console.log('Attempting to delete assignment:', assignmentId, 'Token:', token);
      if (!token) {
        console.error('No token found in localStorage');
        setError('Токен отсутствует, пожалуйста, войдите снова');
        router.push('/auth/login');
        return;
      }
      const response = await api.delete(`/assignments/${assignmentId}`);
      console.log('Delete response:', response.data);
      setError('');
      router.push(`/courses/${courseId}`);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMessage = axiosError.response?.data?.error || 'Ошибка удаления задания';
      console.error('Delete error:', axiosError.response?.data, 'Status:', axiosError.response?.status);
      setError(errorMessage);
    }
  };

  const handleSubmitSolution = async (data: SubmissionFormData) => {
    if (new Date(assignment!.due_date) < new Date()) {
      setError('Дедлайн истёк');
      toast.error('Дедлайн истёк');
      return;
    }
    try {
      await api.post(`/assignments/${assignmentId}/submit`, data);
      setError('');
      submissionForm.reset();
      toast.success('Решение отправлено! Проверьте уведомления для новых достижений.');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMessage = axiosError.response?.data?.error || 'Ошибка отправки решения';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleGrade = async (submissionId: number, data: GradeFormData) => {
    try {
      await api.put(`/submissions/${submissionId}/grade`, data);
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === submissionId ? { ...sub, score: data.score } : sub))
      );
      gradeForm.reset();
      toast.success('Оценка выставлена');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMessage = axiosError.response?.data?.error || 'Ошибка выставления оценки';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (isLoading) return <div className="text-center mt-8">Загрузка...</div>;
  if (error && !assignment) return <div className="text-center mt-8 text-red-500">Ошибка: {error}</div>;
  if (!assignment) return <div className="text-center mt-8">Задание не найдено</div>;

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';
  const isStudent = user?.role === 'student';
  const isDeadlinePassed = new Date(assignment.due_date) < new Date();

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
        {isTeacherOrAdmin && (
          <div className="flex space-x-4 mt-4">
            <Button onClick={() => setIsEditing(true)}>Редактировать</Button>
            <Button variant="destructive" onClick={handleDelete}>
              Удалить
            </Button>
          </div>
        )}
      </Card>

      {isStudent && !isDeadlinePassed && (
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Отправить решение</h2>
          <form onSubmit={submissionForm.handleSubmit(handleSubmitSolution)} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-1">
                Решение
              </label>
              <textarea
                id="content"
                {...submissionForm.register('content')}
                className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                rows={5}
                placeholder="Введите ваше решение"
              />
              {submissionForm.formState.errors.content && (
                <p className="text-red-500 text-sm">{submissionForm.formState.errors.content.message}</p>
              )}
            </div>
            <Button type="submit" disabled={submissionForm.formState.isSubmitting}>
              {submissionForm.formState.isSubmitting ? 'Отправляется...' : 'Отправить'}
            </Button>
          </form>
        </Card>
      )}

      {isTeacherOrAdmin && (
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Решения студентов</h2>
          {submissions.length === 0 ? (
            <p>Решений пока нет</p>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="border p-4 rounded">
                  <p>
                    <strong>Студент:</strong> {submission.username}
                  </p>
                  <p className="mt-2">{submission.content}</p>
                  <p className="mt-2">
                    <strong>Отправлено:</strong> {new Date(submission.submitted_at).toLocaleString()}
                  </p>
                  <p className="mt-2">
                    <strong>Оценка:</strong> {submission.score ?? 'Не выставлена'}
                  </p>
                  <form
                    onSubmit={gradeForm.handleSubmit((data) => handleGrade(submission.id, data))}
                    className="mt-4 flex space-x-2"
                  >
                    <Input
                      type="number"
                      {...gradeForm.register('score', { valueAsNumber: true })}
                      placeholder="Оценка"
                      className="w-24"
                    />
                    <Button type="submit" disabled={gradeForm.formState.isSubmitting}>
                      Выставить
                    </Button>
                  </form>
                  {gradeForm.formState.errors.score && (
                    <p className="text-red-500 text-sm">{gradeForm.formState.errors.score.message}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}