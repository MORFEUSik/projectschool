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
import { motion, AnimatePresence } from 'framer-motion';

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
    return (
      <div className="container text-center mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Пожалуйста, войдите в систему
        </motion.div>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="container text-center mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Загрузка...
        </motion.div>
      </div>
    );

  if (error && !assignment)
    return (
      <div className="container text-center mt-8 text-red-500">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Ошибка: {error}
        </motion.div>
      </div>
    );

  if (!assignment)
    return (
      <div className="container text-center mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Задание не найдено
        </motion.div>
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mt-8"
    >
		<motion.h1
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.1 }}
  className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
>
  {assignment.title}
</motion.h1>

      <Card className="mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-6"
        >
          <div className="prose dark:prose-invert max-w-none">
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
                  className="text-blue-600 hover:text-blue-700 transition hover:scale-105 inline-block"
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
                    className="rounded-lg shadow-md"
                    onError={() => setImageError('Ошибка загрузки изображения')}
                  />
                  {imageError && <p className="text-red-500 text-sm mt-2">{imageError}</p>}
                </>
              )}
            </div>
          )}
          <div className="mt-4 space-y-2">
            <p className="text-gray-700 dark:text-gray-200">
              <strong>Макс. балл:</strong> {assignment.max_score}
            </p>
            <p className="text-gray-700 dark:text-gray-200">
              <strong>Срок:</strong>{' '}
              {new Date(assignment.due_date).toLocaleString('ru-RU', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
        </motion.div>
      </Card>

      {isStudent && !isDeadlinePassed && assignment.type === 'text' && !isSubmitted && (
        <Card className="mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-6"
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              Отправить решение
            </h3>
            <form onSubmit={submissionForm.handleSubmit(handleSubmit)} className="space-y-4">
              <div>
                <label htmlFor="content" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Ответ
                </label>
                <textarea
                  id="content"
                  {...submissionForm.register('content')}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                  rows={5}
                  placeholder="Введите ваш ответ"
                />
                {submissionForm.formState.errors.content && (
                  <p className="text-sm text-red-500 mt-1">
                    {submissionForm.formState.errors.content.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={submissionForm.formState.isSubmitting}
                className="hover:scale-105 transition transform"
              >
                {submissionForm.formState.isSubmitting ? 'Отправляется...' : 'Отправить'}
              </Button>
            </form>
          </motion.div>
        </Card>
      )}

      {assignment.type === 'multiple_choice' && subtasks.length > 0 && (
        <Card className="mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-6"
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Подзадания</h3>
            {isStudent && !isDeadlinePassed && !isSubmitted ? (
              <QuizForm
                assignmentId={Number(assignmentId)}
                subtasks={subtasks}
                onSubmit={handleQuizSubmit}
              />
            ) : (
              <div className="space-y-4">
                {subtasks.map((subtask, idx) => (
                  <motion.div
                    key={subtask.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * idx }}
                    className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg"
                  >
                    <p className="font-semibold text-gray-800 dark:text-white">{subtask.question}</p>
                    {subtask.file_url && (
                      <div className="mt-2">
                        {subtask.file_url.endsWith('.pdf') ? (
                          <a
                            href={subtask.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 transition hover:scale-105 inline-block"
                          >
                            Просмотреть PDF
                          </a>
                        ) : (
                          <Image
                            src={subtask.file_url}
                            alt={`Subtask ${subtask.id} image`}
                            width={300}
                            height={300}
                            className="rounded-lg shadow-md"
                            onError={() =>
                              setImageError(`Ошибка загрузки изображения для вопроса ${subtask.id}`)
                            }
                          />
                        )}
                      </div>
                    )}
                    {subtask.input_type === 'multiple_choice' && subtask.options.length > 0 && (
                      <ul className="list-disc pl-5 mt-2 text-gray-700 dark:text-gray-200">
                        {subtask.options.map((option, idx) => (
                          <li key={idx}>{option}</li>
                        ))}
                      </ul>
                    )}
                    {subtask.input_type === 'text_input' && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Текстовый ответ</p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </Card>
      )}

      {isSubmitted && quizResult && (
        <Card className="mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="p-6"
          >
            <p className="font-semibold text-gray-800 dark:text-white">
              Оценка: {quizResult.grade.toFixed(1)}
            </p>
            <p className="font-semibold text-gray-800 dark:text-white">
              Баллы: {quizResult.totalScore.toFixed(1)} / {assignment.max_score}
            </p>
            <div className="mt-4 space-y-4">
              {quizResult.answers.map((answer, idx) => {
                const subtask = subtasks.find((s) => s.id === answer.SubtaskID);
                const subtaskScore = assignment.max_score / subtasks.length;
                return (
                  <motion.div
                    key={answer.SubtaskID}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * idx }}
                    className="border-b border-gray-200 dark:border-gray-700 pb-4"
                  >
                    <p className="font-medium text-gray-800 dark:text-white">
                      Вопрос {idx + 1}: {subtask?.question ?? 'Вопрос отсутствует'}
                    </p>
                    {subtask?.file_url && (
                      <div className="my-2">
                        {subtask.file_url.endsWith('.pdf') ? (
                          <a
                            href={subtask.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 transition hover:scale-105 inline-block"
                          >
                            Просмотреть PDF
                          </a>
                        ) : (
                          <Image
                            src={subtask.file_url}
                            alt={`Вопрос ${idx + 1}`}
                            width={300}
                            height={200}
                            className="rounded-lg shadow-md"
                            onError={() =>
                              setImageError(`Ошибка загрузки изображения для вопроса ${idx + 1}`)
                            }
                          />
                        )}
                      </div>
                    )}
                    <p className="text-gray-700 dark:text-gray-200">
                      Ваш ответ:{' '}
                      <span className={answer.IsCorrect ? 'text-green-600' : 'text-red-600'}>
                        {answer.Answer || 'Не отвечено'}
                      </span>
                    </p>
                    {!answer.IsCorrect && answer.CorrectAnswer && (
                      <p className="text-gray-700 dark:text-gray-200">
                        Правильный ответ: {answer.CorrectAnswer}
                      </p>
                    )}
                    <p className="text-gray-700 dark:text-gray-200">Попытки: {answer.Attempts}</p>
                    <p className="text-gray-700 dark:text-gray-200">
                      Баллы: {answer.Score.toFixed(1)} / {subtaskScore.toFixed(1)}
                    </p>
                    {subtask?.input_type === 'multiple_choice' && subtask?.options.length > 0 && (
                      <div className="mt-2">
                        <p className="text-gray-700 dark:text-gray-200">Варианты:</p>
                        <ul className="list-disc ml-5 text-gray-700 dark:text-gray-200">
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
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </Card>
      )}
    </motion.div>
  );
}