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
import ConfirmModal from '@/widgets/ConfirmModal';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Course {
  id: number;
  title: string;
  description: string;
  subject: string;
  class_number: number;
  teacher: { username: string };
}

interface Progress {
  total_assignments: number;
  completed_assignments: number;
  completion_rate: number | string;
  total_points: number | string;
  completion_timeline?: { date: string; completed: number }[];
}

interface Stats {
  students_count: number;
  average_grade: number;
  completion_rate: number;
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

  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // Состояние для модалки

  // Функция для загрузки данных курса
  const fetchCourse = async () => {
    setCourseLoading(true);
    try {
      const courseResponse = await api.get<Course>(`/courses/${courseId}`);
      setCourse(courseResponse.data);
      setCourseError('');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMessage = axiosError.response?.data?.error || 'Ошибка загрузки курса';
      setCourseError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCourseLoading(false);
    }
  };

  // Функция для загрузки прогресса
  const fetchProgress = async () => {
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
  };

  // Функция для загрузки статистики
  const fetchStats = async () => {
    if (!['teacher', 'admin'].includes(user?.role || '')) return;
    setStatsLoading(true);
    try {
      const response = await api.get<Stats>(`/courses/${courseId}/stats`);
      setStats(response.data);
      setStatsError('');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMessage = axiosError.response?.data?.error || 'Ошибка загрузки статистики';
      setStatsError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setStatsLoading(false);
    }
  };

  // Проверка, записан ли пользователь
  const checkEnrollment = async () => {
    if (user?.role !== 'student' || !courseId) return;
    try {
      const res = await api.get(`/courses/${courseId}/is-enrolled`);
      setIsEnrolled(res.data.enrolled);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      toast.error(axiosError.response?.data?.error || 'Ошибка проверки записи');
      setIsEnrolled(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      fetchStats();
      checkEnrollment();
      fetchProgress();
    } else {
      setCourseLoading(false);
      setCourseError('Курс не найден');
      toast.error('Курс не найден');
    }
  }, [courseId, user]);

  const handleEnroll = async () => {
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setIsEnrolled(true);
      toast.success('Вы записались на курс!');
      // Обновляем данные
      await Promise.all([fetchCourse(), fetchStats(), fetchProgress(), checkEnrollment()]);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      toast.error(axiosError.response?.data?.error || 'Ошибка при записи на курс');
    }
  };

  const handleUnenroll = async () => {
    try {
      await api.delete(`/courses/${courseId}/enroll`);
      setIsEnrolled(false);
      toast.success('Вы отписались от курса');
      // Обновляем данные
      await Promise.all([fetchCourse(), fetchStats(), fetchProgress(), checkEnrollment()]);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      toast.error(axiosError.response?.data?.error || 'Ошибка при отписке от курса');
    } finally {
      setIsModalOpen(false);
    }
  };

  if (!courseId) return <div className="text-center mt-8 text-red-500">Курс не найден</div>;
  if (courseLoading || assignmentsLoading) return <div className="text-center mt-8">Загрузка...</div>;
  if (courseError) return <div className="text-center mt-8 text-red-500">Ошибка: {courseError}</div>;
  if (assignmentsError) return <div className="text-center mt-8 text-red-500">Ошибка: {assignmentsError}</div>;
  if (!course) return <div className="text-center mt-8 text-red-500">Курс не найден</div>;

  const completionRate = progress ? parseFloat(progress.completion_rate.toString()) : 0;
  const totalPoints = progress ? parseFloat(progress.total_points.toString()) : 0;

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
    <div className="max-w-5xl mx-auto mt-12 px-4">
      <h1 className="text-4xl font-extrabold text-blue-600 text-center mb-8">📘 {course.title}</h1>

      <Card className="mb-6">
        <p className="text-gray-700 mb-2">{course.description}</p>
        <p className="text-sm text-gray-500 mb-2">
          <strong>Предмет:</strong> {course.subject}
        </p>
        <p className="text-sm text-gray-500 mb-2">
          <strong>Класс:</strong> {course.class_number}
        </p>
        <p className="text-sm text-gray-500">
          <strong>Преподаватель:</strong> {course.teacher.username}
        </p>
      </Card>

      {user?.role === 'student' && (
        <div className="mb-6">
          {isEnrolled ? (
            <Button onClick={() => setIsModalOpen(true)} variant="destructive">
              Отписаться от курса
            </Button>
          ) : (
            <Button onClick={handleEnroll}>
              Записаться на курс
            </Button>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleUnenroll}
        title="Подтверждение отписки"
        message="Вы уверены, что хотите отписаться от этого курса? Ваш прогресс будет сохранён, но вы потеряете доступ к новым заданиям."
        confirmText="Отписаться"
        cancelText="Отменить"
      />

      {['teacher', 'admin'].includes(user?.role || '') && (
        <div className="mb-6 flex justify-end">
          <Link href={`/courses/${courseId}/submissions`}>
            <Button>Решения студентов</Button>
          </Link>
        </div>
      )}

      {['teacher', 'admin'].includes(user?.role || '') && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">📈 Статистика курса</h2>
          {statsLoading ? (
            <p className="text-gray-500">Загрузка...</p>
          ) : statsError ? (
            <p className="text-red-500">{statsError}</p>
          ) : stats ? (
            <div className="grid sm:grid-cols-3 gap-4 text-center">
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm text-gray-600">Студентов на курсе</p>
                <p className="text-2xl font-bold">{stats.students_count}</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm text-gray-600">Средний балл</p>
                <p className="text-2xl font-bold">{stats.average_grade.toFixed(2)}</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm text-gray-600">Завершено заданий</p>
                <p className="text-2xl font-bold">{stats.completion_rate.toFixed(1)}%</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Нет данных</p>
          )}
        </Card>
      )}

      {user?.role === 'student' && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">📊 Прогресс</h2>
          {progressLoading ? (
            <p className="text-gray-500">Загрузка прогресса...</p>
          ) : progressError ? (
            <p className="text-red-500">{progressError}</p>
          ) : progress ? (
            progress.total_assignments === 0 ? (
              <p className="text-gray-500">Заданий нет</p>
            ) : (
              <>
                <div className="grid sm:grid-cols-3 gap-4 mb-4 text-center">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Сдано заданий</p>
                    <p className="text-2xl font-bold">{progress.completed_assignments}/{progress.total_assignments}</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Процент</p>
                    <p className="text-2xl font-bold">{completionRate.toFixed(1)}%</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Баллы</p>
                    <p className="text-2xl font-bold">{totalPoints.toFixed(1)}</p>
                  </div>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
                  <div className="bg-blue-500 h-full" style={{ width: `${completionRate}%` }} />
                </div>
                {Array.isArray(progress.completion_timeline) && progress.completion_timeline.length > 0 && (
                  <div className="mt-6">
                    <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Динамика выполнения заданий' } }, scales: { y: { beginAtZero: true }, x: { title: { display: true, text: 'Дата' } } } }} />
                  </div>
                )}
              </>
            )
          ) : (
            <p className="text-gray-500">Нет данных</p>
          )}
        </Card>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">📝 Задания</h2>
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <Link href={`/courses/${courseId}/assignments/new`}>
            <Button>Создать</Button>
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{assignment.title}</h3>
              <Link href={`/courses/${courseId}/assignments/${assignment.id}`}>
                <Button variant="outline">Открыть</Button>
              </Link>
            </div>
            <p className="mt-2 text-sm text-gray-700">{assignment.description}</p>
            <p className="mt-2 text-sm text-gray-500">
              <strong>Макс. балл:</strong> {assignment.max_score}
            </p>
            <p className="text-sm text-gray-500">
              <strong>Срок сдачи:</strong> {new Date(assignment.due_date).toLocaleString()}
            </p>
          </Card>
        ))}
      </div>

      {user?.role === 'admin' && (
        <Button
          variant="destructive"
          className="mt-6"
          onClick={async () => {
            if (confirm('Удалить курс?')) {
              try {
                await api.delete(`/courses/${courseId}`);
                toast.success('Курс удалён');
                window.location.href = '/courses';
              } catch {
                toast.error('Ошибка при удалении');
              }
            }
          }}
        >
          Удалить курс
        </Button>
      )}
    </div>
  );
}