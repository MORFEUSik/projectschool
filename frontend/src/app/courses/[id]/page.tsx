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
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Регистрация компонентов Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Course {
  id: number;
  title: string;
  description: string;
  teacher: { username: string };
}

interface Progress {
  total_assignments: number;
  completed_assignments: number;
  completion_rate: number | string;
  total_points: number | string;
  completion_timeline?: { date: string; completed: number }[]; // Новый поле
}

interface ErrorResponse {
  error?: string;
}

export default function CoursePage() {
  const { id } = useParams();
  const { user } = useUser();

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
        toast.error(axiosError.response?.data?.error || 'Ошибка загрузки курса');
      } finally {
        setCourseLoading(false);
      }
    }
    if (courseId) {
      fetchCourse();
    } else {
      setCourseLoading(false);
      setCourseError('Курс не найден');
      toast.error('Курс не найден');
    }
  }, [courseId]);

  useEffect(() => {
    async function fetchProgress() {
      if (user?.role !== 'student') return;
      setProgressLoading(true);
      try {
        const response = await api.get<Progress>(`/courses/${courseId}/progress`);
        setProgress(response.data);
        setProgressError('');
      } catch (err: unknown) {
        const axiosError = err as AxiosError<ErrorResponse>;
        const errorMessage = axiosError.response?.data?.error || 'Ошибка загрузки прогресса';
        setProgressError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setProgressLoading(false);
      }
    }
    if (courseId) {
      fetchProgress();
    }
  }, [courseId, user]);

  if (!courseId) return <div className="text-center mt-8 text-red-500">Курс не найден</div>;
  if (courseLoading || assignmentsLoading) return <div className="text-center mt-8">Загрузка...</div>;
  if (courseError) return <div className="text-center mt-8 text-red-500">Ошибка: {courseError}</div>;
  if (assignmentsError) return <div className="text-center mt-8 text-red-500">Ошибка: {assignmentsError}</div>;
  if (!course) return <div className="text-center mt-8 text-red-500">Курс не найден</div>;

  const completionRate = progress ? parseFloat(progress.completion_rate.toString()) : 0;
  const totalPoints = progress ? parseFloat(progress.total_points.toString()) : 0;

  // Данные для графика
  const chartData = {
    labels: progress?.completion_timeline?.map((item) => item.date) || [],
    datasets: [
      {
        label: 'Завершённые задания',
        data: progress?.completion_timeline?.map((item) => item.completed) || [],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        fill: true,
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">{course.title}</h1>
      <Card className="p-6 mb-6">
        <p className="mb-2">{course.description}</p>
        <p>
          <strong>Преподаватель:</strong> {course.teacher.username}
        </p>
      </Card>

      {user?.role === 'student' && (
        <Card className="p-6 mb-6">
  <h2 className="text-xl font-semibold mb-4">📊 Прогресс по курсу</h2>

  {progressLoading ? (
    <div className="text-gray-500">Загрузка прогресса...</div>
  ) : progressError ? (
    <div className="text-red-500">{progressError}</div>
  ) : progress ? (
    progress.total_assignments === 0 ? (
      <div className="text-gray-500">Заданий в курсе пока нет</div>
    ) : (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-center">
          <div className="bg-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-600">Сдано заданий</p>
            <p className="text-xl font-bold">{progress.completed_assignments}/{progress.total_assignments}</p>
          </div>
          <div className="bg-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-600">Процент завершения</p>
            <p className="text-xl font-bold">{completionRate.toFixed(1)}%</p>
          </div>
          <div className="bg-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-600">Набрано баллов</p>
            <p className="text-xl font-bold">{totalPoints.toFixed(1)}</p>
          </div>
        </div>

        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div
            className="bg-blue-500 h-4 transition-all duration-500 ease-in-out"
            style={{ width: `${completionRate}%` }}
          />
        </div>

        {Array.isArray(progress.completion_timeline) && progress.completion_timeline.length > 0 && (
          <div className="mt-6">
            <Line
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: true, text: 'Динамика выполнения заданий' },
                },
                scales: {
                  y: { beginAtZero: true, title: { display: true, text: 'Сдано заданий' } },
                  x: { title: { display: true, text: 'Дата' } },
                },
              }}
            />
          </div>
        )}
      </>
    )
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