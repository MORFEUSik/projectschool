'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/entities/user/hook';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { QuizForm } from '@/shared/ui/QuizForm';
import { AxiosError } from 'axios';

interface Assignment {
  id: number;
  title: string;
  description: string;
  max_score: number;
  due_date: string;
  course_id: number;
  file_url?: string;
  type: string;
}

interface Subtask {
  id: number;
  ID?: number;
  question: string;
  Question?: string;
  options: string[] | undefined;
  Options?: string[];
  sort_order: number;
  SortOrder?: number;
}

interface QuizResult {
  grade: number;
  totalScore: number;
  answers: {
    SubtaskID: number;
    Answer: string;
    IsCorrect: boolean;
    Attempts: number;
    CorrectAnswer?: string;
  }[];
}

interface ErrorResponse {
  error?: string;
}

const submissionSchema = z.object({
  content: z.string().min(1, 'Решение не может быть пустым'),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

export default function AssignmentPage() {
  const { id: courseId, assignmentId } = useParams();
  const { user } = useUser();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const submissionForm = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: { content: '' },
  });

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const assignmentRes = await api.get<Assignment>(`/courses/${courseId}/assignments/${assignmentId}`);
        setAssignment(assignmentRes.data);

        if (assignmentRes.data.type === 'multiple_choice') {
          const subtasksRes = await api.get<Subtask[]>(`/assignments/${assignmentId}/subtasks`);
          console.log('API subtasks response:', subtasksRes.data);

          const normalizedSubtasks = subtasksRes.data.map((subtask) => ({
            id: subtask.id ?? subtask.ID,
            question: subtask.question ?? subtask.Question,
            options: subtask.options ?? subtask.Options ?? [],
            sort_order: subtask.sort_order ?? subtask.SortOrder,
          }));
          console.log('Normalized subtasks:', normalizedSubtasks);
          setSubtasks(normalizedSubtasks);
        }
      } catch (err: unknown) {
        const axiosErr = err as AxiosError<ErrorResponse>;
        setError(axiosErr.response?.data?.error || 'Ошибка загрузки задания');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [assignmentId, courseId]);

  useEffect(() => {
    // Логирование для дебаггинга
    if (quizResult) {
      console.log('QuizResult:', quizResult);
    }
    if (subtasks.length > 0) {
      console.log('Subtasks:', subtasks);
    }
  }, [quizResult, subtasks]);

  const isStudent = user?.role === 'student';
  const isDeadlinePassed = assignment ? new Date(assignment.due_date) < new Date() : false;

  const handleSubmit = async (data: SubmissionFormData) => {
    if (!assignment) return;

    try {
      await api.post(`/assignments/${assignmentId}/submit`, data);
      submissionForm.reset();
      toast.success('Решение отправлено!');
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ErrorResponse>;
      toast.error(axiosErr.response?.data?.error || 'Ошибка при отправке');
    }
  };

  const handleQuizSubmit = (result: QuizResult) => {
    setQuizResult(result);
    setIsSubmitted(true);
  };

  if (isLoading) return <div className="text-center mt-8">Загрузка...</div>;
  if (error && !assignment) return <div className="text-center mt-8 text-red-500">Ошибка: {error}</div>;
  if (!assignment) return <div className="text-center mt-8">Задание не найдено</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">{assignment.title}</h1>
      <Card className="p-6 mb-6">
        <div className="prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {assignment.description}
          </ReactMarkdown>
        </div>

        {assignment.file_url && (
          <div className="mt-4">
            {assignment.file_url.endsWith('.pdf') ? (
              <a
                href={assignment.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Просмотреть PDF
              </a>
            ) : (
              <>
                <Image
                  src={assignment.file_url}
                  alt="Файл"
                  width={500}
                  height={500}
                  className="rounded"
                  onError={() => setImageError('Ошибка загрузки изображения')}
                />
                {imageError && <p className="text-red-500 text-sm">{imageError}</p>}
              </>
            )}
          </div>
        )}

        <p className="mt-4">
          <strong>Макс. балл:</strong> {assignment.max_score}
        </p>
        <p>
          <strong>Срок:</strong>{' '}
          {new Date(assignment.due_date).toLocaleString('ru-RU', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
      </Card>

      {isStudent && !isDeadlinePassed && assignment.type === 'text' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Отправить решение</h2>
          <form onSubmit={submissionForm.handleSubmit(handleSubmit)} className="space-y-4">
            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-1">
                Ответ
              </label>
              <textarea
                id="content"
                {...submissionForm.register('content')}
                className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                rows={5}
              />
              {submissionForm.formState.errors.content && (
                <p className="text-red-500 text-sm">
                  {submissionForm.formState.errors.content.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={submissionForm.formState.isSubmitting}>
              {submissionForm.formState.isSubmitting ? 'Отправляется...' : 'Отправить'}
            </Button>
          </form>
        </Card>
      )}

      {isStudent && !isDeadlinePassed && assignment.type === 'multiple_choice' && subtasks.length > 0 && !isSubmitted && (
        <Card className="p-6 mt-4">
          <h2 className="text-2xl font-semibold mb-4">Квиз</h2>
          <QuizForm assignmentId={Number(assignmentId)} subtasks={subtasks} onSubmit={handleQuizSubmit} />
        </Card>
      )}

      {isSubmitted && quizResult && (
        <Card title="Результаты теста">
          <div className="space-y-2">
            <p>Оценка: {quizResult.grade.toFixed(1)}</p>
            <p>Баллы: {quizResult.totalScore.toFixed(1)}</p>
            <div className="space-y-4">
              {quizResult.answers.map((answer, idx) => {
                const subtask = subtasks.find((st) => (st.id ?? st.ID) === answer.SubtaskID);
                console.log(`Answer ${idx + 1}:`, { answer, subtask });
                return (
                  <div key={idx} className="border p-2 rounded">
                    <p>
                      Вопрос {idx + 1}: {subtask?.question ?? subtask?.Question ?? 'Вопрос не найден'} —{' '}
                      {answer.IsCorrect ? '✅ Правильно' : '❌ Неправильно'}
                    </p>
                    <p>Ваш ответ: {answer.Answer}</p>
                    <p>Попыток: {answer.Attempts}</p>
                    {!answer.IsCorrect && answer.CorrectAnswer && (
                      <p className="text-green-600">Правильный ответ: {answer.CorrectAnswer}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {isSubmitted && !quizResult && (
        <Card className="p-6 text-green-600 font-semibold text-center">
          ✅ Вы успешно прошли этот тест
        </Card>
      )}
    </div>
  );
}