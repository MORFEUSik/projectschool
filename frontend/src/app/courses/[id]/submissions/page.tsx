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
import { motion, AnimatePresence } from 'framer-motion';

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
    if (isNaN(grade) || grade < 0 || grade > 10) {
      toast.error('Оценка должна быть от 0 до 10');
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
    return (
      <div className="container text-center mt-8 text-red-500">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Доступ запрещён
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

  if (error)
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
        Решения студентов
      </motion.h1>
      <Card className="p-6 card-shadow card-subtle animate-fade-in-up">
        {submissions.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Решений нет</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm text-gray-700 dark:text-gray-200">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 uppercase">
                  <th className="py-3 px-4">Студент</th>
                  <th className="py-3 px-4">Задание</th>
                  <th className="py-3 px-4">Решение</th>
                  <th className="py-3 px-4">Оценка</th>
                  <th className="py-3 px-4">Дата</th>
                  <th className="py-3 px-4">Действия</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {submissions.map((submission, idx) => (
                    <motion.tr
                      key={submission.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <td className="py-3 px-4">{submission.username}</td>
                      <td className="py-3 px-4">{submission.assignment_title}</td>
                      <td className="py-3 px-4 truncate max-w-xs">{submission.content}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={gradeInputs[submission.id] ?? submission.score.toString()}
                            onChange={(e) => handleGradeChange(submission.id, e.target.value)}
                            className="w-16"
                          />
                          <span
  className={`text-sm px-2 py-1 rounded ${
    submission.score >= 8
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : submission.score >= 5
      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }`}
>
  {submission.score.toFixed(1)}
</span>


                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(submission.submitted_at).toLocaleString('ru-RU', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          onClick={() => handleSetGrade(submission.id)}
                          className="hover:scale-105 transition-transform duration-200"
                        >
                          Сохранить
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </motion.div>
  );
}