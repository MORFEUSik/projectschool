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
  description?: string;
  max_score: number;
  due_date: string;
  course_id: number;
  file_url?: string;
  type: 'text' | 'multiple_choice';
}

interface Subtask {
  id: number;
  ID?: number;
  question: string;
  Question?: string;
  options: string[];
  Options?: string[];
  sort_order: number;
  SortOrder?: number;
  input_type: 'multiple_choice' | 'text_input';
  Type?: 'multiple_choice' | 'text_input';
  file_url?: string;
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
        const assignmentRes = await api.get(`/courses/${courseId}/assignments/${assignmentId}`);
        setAssignment(assignmentRes.data);

        if (assignmentRes.data.type === 'multiple_choice') {
          const subtasksRes = await api.get(`/assignments/${assignmentId}/subtasks`);
          const normalizedSubtasks = subtasksRes.data.map((subtask: any) => ({
            id: subtask.ID || subtask.id,
            question: subtask.Question || subtask.question || '',
            options: Array.isArray(subtask.Options)
              ? subtask.Options
              : Array.isArray(subtask.options)
              ? subtask.options
              : [],
            sort_order: subtask.SortOrder || subtask.sort_order || 0,
            input_type: subtask.Type || subtask.input_type || 'text_input',
            file_url: subtask.File_url || subtask.file_url,
          }));
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

    if (user) {
      fetchData();
    }
  }, [assignmentId, courseId, user]);

  const isStudent = user?.role === 'student';
  const isDeadlinePassed = assignment ? new Date(assignment.due_date) < new Date() : false;

  const handleSubmit = async (data: SubmissionFormData) => {
    if (!assignment) return;

    try {
      await api.post(`/assignments/${assignmentId}/submit`, data);
      submissionForm.reset();
      toast.success('Решение отправлено!');
      setIsSubmitted(true);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ErrorResponse>;
      toast.error(axiosErr.response?.data?.error || 'Ошибка при отправке');
    }
  };

  const handleQuizSubmit = (result: QuizResult) => {
    setQuizResult(result);
    setIsSubmitted(true);
  };

  if (!user) {
    return <div className="text-center mt-8">Пожалуйста, войдите в систему</div>;
  }

  if (isLoading) return <div className="text-center mt-8">Загрузка...</div>;
  if (error && !assignment) return <div className="text-center mt-8 text-red-500">Ошибка: {error}</div>;
  if (!assignment) return <div className="text-center mt-8">Задание не найдено</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">{assignment.title}</h1>

      <Card className="p-6 mb-6">
        <div className="prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {assignment.description || 'Описание отсутствует'}
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

      {isStudent && !isDeadlinePassed && assignment.type === 'text' && !isSubmitted && (
        <Card className="mb-6 p-6">
          <h3 className="text-xl font-semibold mb-4">Отправить решение</h3>
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
                placeholder="Введите ваш ответ"
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

      {assignment.type === 'multiple_choice' && subtasks.length > 0 && (
        <Card className="mb-6 p-6">
          <h3 className="text-xl font-semibold mb-4">Подзадания</h3>
          {isStudent && !isDeadlinePassed && !isSubmitted ? (
            <QuizForm assignmentId={Number(assignmentId)} subtasks={subtasks} onSubmit={handleQuizSubmit} />
          ) : (
            <div className="space-y-4">
              {subtasks.map((subtask) => (
                <div key={subtask.id} className="border p-4 rounded">
                  <p className="font-semibold">{subtask.question}</p>
                  {subtask.file_url && (
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
                          alt={`Subtask ${subtask.id} image`}
                          width={300}
                          height={300}
                          className="rounded"
                          onError={() => setImageError(`Ошибка загрузки изображения для вопроса ${subtask.id}`)}
                        />
                      )}
                    </div>
                  )}
                  {subtask.input_type === 'multiple_choice' && subtask.options.length > 0 && (
                    <ul className="list-disc pl-5 mt-2">
                      {subtask.options.map((option, idx) => (
                        <li key={idx}>{option}</li>
                      ))}
                    </ul>
                  )}
                  {subtask.input_type === 'text_input' && (
                    <p className="text-sm text-gray-600 mt-2">Текстовый ответ</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {isSubmitted && quizResult && (
        <Card className="mt-4">
          <div>
            <p className="font-semibold">Оценка: {quizResult.grade.toFixed(1)}</p>
            <p className="font-semibold">
              Баллы: {quizResult.totalScore.toFixed(1)} / {assignment.max_score}
            </p>
            <div className="mt-2">
              {quizResult.answers.map((answer, idx) => {
                const subtask = subtasks.find((s) => s.id === answer.SubtaskID);
                const subtaskScore = assignment.max_score / subtasks.length;
                return (
                  <div key={answer.SubtaskID} className="mb-4 border-b pb-2">
                    <p className="font-medium">
                      Вопрос {idx + 1}: {subtask?.question ?? 'Вопрос отсутствует'}
                    </p>
                    {subtask?.file_url && (
                      <div className="my-2">
                        {subtask.file_url.endsWith('.pdf') ? (
                          <a
                            href={subtask.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            Просмотреть PDF
                          </a>
                        ) : (
                          <Image
                            src={subtask.file_url}
                            alt={`Вопрос ${idx + 1}`}
                            width={300}
                            height={200}
                            onError={() =>
                              setImageError(`Ошибка загрузки изображения для вопроса ${idx + 1}`)
                            }
                          />
                        )}
                      </div>
                    )}
                    <p>
                      Ваш ответ:{' '}
                      <span className={answer.IsCorrect ? 'text-green-600' : 'text-red-600'}>
                        {answer.Answer || 'Не отвечено'}
                      </span>
                    </p>
                    {!answer.IsCorrect && answer.CorrectAnswer && (
                      <p>Правильный ответ: {answer.CorrectAnswer}</p>
                    )}
                    <p>Попытки: {answer.Attempts}</p>
                    <p>
                      Баллы: {answer.Score.toFixed(1)} / {subtaskScore.toFixed(1)}
                    </p>
                    {subtask?.input_type === 'multiple_choice' && subtask?.options.length > 0 && (
                      <div>
                        <p>Варианты:</p>
                        <ul className="list-disc ml-5">
                          {subtask.options.map((option, optIdx) => (
                            <li
                              key={optIdx}
                              className={
                                option === answer.Answer
                                  ? answer.IsCorrect
                                    ? 'text-green-600'
                                    : 'text-red-600'
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