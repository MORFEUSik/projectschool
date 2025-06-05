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
  file_url?: string; // Добавляем file_url
  File_url?: string;
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
    Score: number;
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
            file_url: subtask.file_url ?? subtask.File_url, // Нормализуем file_url
          }));
          console.log('Normalized subtasks:', normalizedSubtasks);
          setSubtasks(normalizedSubtasks);

          // Проверяем, отправлено ли решение
          try {
            const submissionRes = await api.get(`/assignments/${assignmentId}/submit-quiz`);
            if (submissionRes.data) {
              setIsSubmitted(true);
              setQuizResult(submissionRes.data);
            }
          } catch (_) {
            // Игнорируем ошибку, если решение ещё не отправлено
          }
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

        {assignment.file_url && !imageError && (
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
          alt="Assignment file"
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
        <Card className="mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4">Отправить решение</h2>
          <form onSubmit={submissionForm.handleSubmit(handleSubmit)} className="space-y-4">
            <div>
              <label htmlFor="content" className="block mb-1 text-sm font-medium">
                Ответ
              </label>
              <textarea
                id="content"
                {...submissionForm.register('content')}
                className="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                rows={5}
              />
              {submissionForm.formState.errors.content && (
                <p className="text-sm text-red-500">
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
        <Card className="mb-6 mt-6 p-4">
          <h2 className="text-2xl font-semibold mb-4">Квиз</h2>
          <QuizForm assignmentId={Number(assignmentId)} subtasks={subtasks} onSubmit={handleQuizSubmit} />
        </Card>
      )}

      {isSubmitted && quizResult && (
        <Card title="Результаты теста" className="p-6">
          <div className="space-y-4">
            <p>
              <strong>Оценка:</strong> {quizResult.grade.toFixed(1)}
            </p>
            <p>
              <strong>Баллы:</strong> {quizResult.totalScore.toFixed(1)} / {assignment.max_score}
            </p>
            <div className="space-y-4">
              {quizResult.answers.map((answer, idx) => {
                const subtask = subtasks.find((s) => (s.id ?? s.ID) === answer.SubtaskID);
                const options = subtask?.options ?? subtask?.Options ?? [];
                const subtaskScore = assignment.max_score / subtasks.length;
                console.log(`Answer ${idx + 1}:`, { answer, subtask });
                return (
                  <div key={idx} className="border p-4 rounded">
                    <p className="font-semibold">
                      Вопрос {idx + 1}: {subtask?.question ?? subtask?.Question ?? 'Вопрос отсутствует'}
                    </p>
                    {subtask?.file_url && (
                      <div className="mt-2">
                        {subtask.file_url.endsWith('.pdf') ? (
                          <a
                            href={subtask.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Просмотреть PDF
                          </a>
                        ) : (
                          <Image
                            src={subtask.file_url}
                            alt={`Subtask ${idx + 1} image`}
                            width={300}
                            height={300}
                            className="rounded"
                            onError={() => setImageError(`Ошибка загрузки изображения для вопроса ${idx + 1}`)}
                          />
                        )}
                        {imageError && <p className="text-red-500 text-sm">{imageError}</p>}
                      </div>
                    )}
                    <p>
                      <strong>Ваш ответ:</strong>{' '}
                      <span className={answer.IsCorrect ? 'text-green-600' : 'text-red-600'}>
                        {answer.Answer || 'Не отвечено'}
                      </span>
                    </p>
                    {!answer.IsCorrect && answer.CorrectAnswer && (
                      <p>
                        <strong>Правильный ответ:</strong> {answer.CorrectAnswer}
                      </p>
                    )}
                    <p>
                      <strong>Попытки:</strong> {answer.Attempts}
                    </p>
                    <p>
                      <strong>Баллы:</strong> {answer.Score.toFixed(1)} / {subtaskScore.toFixed(1)}
                    </p>
                    {options.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Варианты:</p>
                        <ul className="list-disc pl-5">
                          {options.map((option, optIdx) => (
                            <li
                              key={optIdx}
                              className={
                                option === answer.CorrectAnswer
                                  ? 'text-green-600'
                                  : answer.Answer === option && !answer.IsCorrect
                                  ? 'text-red-600'
                                  : ''
                              }
                            >
                              {option}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
