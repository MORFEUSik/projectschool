'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import Link from 'next/link';
import { useUser } from '@/entities/user/hook';
import { useAssignments } from '@/shared/hooks/useAssignments';
import { AxiosError } from 'axios';

interface Course {
  id: number;
  title: string;
  description: string;
  teacher: { username: string };
}

interface Progress {
  total_assignments: number;
  completed_assignments: number;
  completion_rate: number;
  total_points: number;
}

interface ErrorResponse {
  error?: string;
}

export default function CoursePage() {
  const { id } = useParams();
  const { user } = useUser();

  // Приводим id к string, так как в маршруте [id] это строка
  const courseId = typeof id === 'string' ? id : '';

  const { assignments, loading: assignmentsLoading, error: assignmentsError } = useAssignments(courseId);
  const [course, setCourse] = useState<Course | null>(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [courseError, setCourseError] = useState('');
  const [progress, setProgress] = useState<Progress | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState('');

  useEffect(() => {
    async function fetchCourse() {
      setCourseLoading(true);
      try {
        const courseResponse = await api.get<Course>(`/courses/${courseId}`);
        setCourse(courseResponse.data);
      } catch (err: unknown) {
        const axiosError = err as AxiosError<ErrorResponse>;
        setCourseError(axiosError.response?.data?.error || 'Ошибка загрузки курса');
      } finally {
        setCourseLoading(false);
      }
    }
    if (courseId) {
      fetchCourse();
    } else {
      setCourseLoading(false);
      setCourseError('Курс не найден');
    }
  }, [courseId]);

  // Запрос прогресса (только для студентов)
  useEffect(() => {
    async function fetchProgress() {
      if (user?.role !== 'student') return; // Прогресс доступен только студентам
      setProgressLoading(true);
      try {
        const response = await api.get<Progress>(`/courses/${courseId}/progress`);
        setProgress(response.data);
      } catch (err: unknown) {
        const axiosError = err as AxiosError<ErrorResponse>;
        setProgressError(axiosError.response?.data?.error || 'Ошибка загрузки прогресса');
      } finally {
        setProgressLoading(false);
      }
    }
    if (courseId) {
      fetchProgress();
    }
  }, [courseId, user]);

  if (!courseId) return <div className="text-center mt-8">Курс не найден</div>;
  if (courseLoading || assignmentsLoading) return <div className="text-center mt-8">Загрузка...</div>;
  if (courseError) return <div className="text-center mt-8 text-red-500">Ошибка: {courseError}</div>;
  if (assignmentsError) return <div className="text-center mt-8 text-red-500">Ошибка: {assignmentsError}</div>;
  if (!course) return <div className="text-center mt-8">Курс не найден</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">{course.title}</h1>
      <Card className="p-6 mb-6">
        <p className="mb-2">{course.description}</p>
        <p>
          <strong>Преподаватель:</strong> {course.teacher.username}
        </p>
      </Card>

      {/* Отображение прогресса (только для студентов) */}
      {user?.role === 'student' && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Прогресс</h2>
          {progressLoading ? (
            <div className="text-gray-500">Загрузка прогресса...</div>
          ) : progressError ? (
            <div className="text-red-500">{progressError}</div>
          ) : progress ? (
            <>
              <p>Завершено: {progress.completed_assignments}/{progress.total_assignments}</p>
              <p>Процент завершения: {progress.completion_rate}%</p>
              <p>Набрано баллов: {progress.total_points}</p>
              <div className="relative w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-blue-600 h-2.5 rounded-full flex items-center justify-center text-xs text-white"
                  style={{ width: `${progress.completion_rate}%` }}
                >
                  {progress.completion_rate > 10 && `${progress.completion_rate}%`} {/* Показываем процент, если достаточно места */}
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-500">Нет данных о прогрессе</div>
          )}
        </Card>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Задания</h2>
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <Link href={`/courses/${courseId}/assignments/new`}>
            <Button>Создать задание</Button>
          </Link>
        )}
      </div>
      <div className="space-y-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">{assignment.title}</h3>
              <Link href={`/courses/${courseId}/assignments/${assignment.id}`}>
                <Button variant="outline">Открыть</Button>
              </Link>
            </div>
            <p className="mt-2">{assignment.description}</p>
            <p className="mt-2">
              <strong>Максимальный балл:</strong> {assignment.max_score}
            </p>
            <p className="mt-2">
              <strong>Срок сдачи:</strong> {new Date(assignment.due_date).toLocaleString()}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}