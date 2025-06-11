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
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import ConfirmModal from '@/widgets/ConfirmModal';
import { ArrowRightIcon, PlusIcon, TrashIcon, ChartBarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [modalAction, setModalAction] = useState<'unenroll' | 'delete'>('unenroll');

  const fetchCourse = async () => {
    setCourseLoading(true);
    try {
      const courseResponse = await api.get(`/courses/${courseId}`);
      setCourse(courseResponse.data);
      setCourseError('');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMessage = axiosError.response?.data?.error || 'Ошибка загрузки урока';
      setCourseError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCourseLoading(false);
    }
  };

  const fetchProgress = async () => {
    if (user?.role !== 'student') return;
    setProgressLoading(true);
    try {
      const response = await api.get(`/courses/${courseId}/progress`);
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

  const fetchStats = async () => {
    if (!['teacher', 'admin'].includes(user?.role || '')) return;
    setStatsLoading(true);
    try {
      const response = await api.get(`/courses/${courseId}/stats`);
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
      setCourseError('урок не найден');
      toast.error('урок не найден');
    }
  }, [courseId, user]);

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setIsEnrolled(true);
      toast.success('Вы записались на урок!');
      await Promise.all([fetchCourse(), fetchStats(), fetchProgress(), checkEnrollment()]);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      toast.error(axiosError.response?.data?.error || 'Ошибка при записи на урок');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    try {
      await api.delete(`/courses/${courseId}/enroll`);
      setIsEnrolled(false);
      toast.success('Вы отписались от урока');
      await Promise.all([fetchCourse(), fetchStats(), fetchProgress(), checkEnrollment()]);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      toast.error(axiosError.response?.data?.error || 'Ошибка при отписке от урока');
    } finally {
      setIsModalOpen(false);
    }
  };

  const handleDeleteCourse = async () => {
    try {
      await api.delete(`/courses/${courseId}`);
      toast.success('урок удалён');
      window.location.href = '/courses';
    } catch {
      toast.error('Ошибка при удалении');
    } finally {
      setIsModalOpen(false);
    }
  };

  const openModal = (action: 'unenroll' | 'delete') => {
    setModalAction(action);
    setIsModalOpen(true);
  };

  if (!courseId) return <div className="text-center mt-8 text-red-500 animate-fade-in-up">урок не найден</div>;
  if (courseLoading || assignmentsLoading) return <div className="text-center mt-8 animate-pulse">Загрузка...</div>;
  if (courseError) return <div className="text-center mt-8 text-red-500 animate-fade-in-up">Ошибка: {courseError}</div>;
  if (assignmentsError) return <div className="text-center mt-8 text-red-500 animate-fade-in-up">Ошибка: {assignmentsError}</div>;
  if (!course) return <div className="text-center mt-8 text-red-500 animate-fade-in-up">урок не найден</div>;

  const completionRate = progress ? parseFloat(progress.completion_rate.toString()) : 0;
  const totalPoints = progress ? parseFloat(progress.total_points.toString()) : 0;

  const chartData = {
    labels: progress?.completion_timeline?.map((item) => item.date) || [],
    datasets: [
      {
        label: 'Завершённые задания',
        data: progress?.completion_timeline?.map((item) => item.completed) || [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#3b82f6',
        pointRadius: 5,
        pointHoverRadius: 8,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: 'var(--foreground)' } },
      title: { display: true, text: 'Динамика выполнения заданий', color: 'var(--foreground)', font: { size: 16 } },
      tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.8)', titleColor: '#fff', bodyColor: '#fff' },
    },
    scales: {
      x: { title: { display: true, text: 'Дата', color: 'var(--foreground)' }, grid: { color: 'rgba(107, 114, 128, 0.1)' } },
      y: { title: { display: true, text: 'Завершено', color: 'var(--foreground)' }, grid: { color: 'rgba(107, 114, 128, 0.1)' }, beginAtZero: true },
    },
    animation: {
      duration: 2000,
      easing: 'easeOutQuart' as const,
    },
  };

  return (
    <div className="max-w-5xl mx-auto mt-12 px-4">
      <motion.h1
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.1 }}
  className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
>
  📚 {course.title}
</motion.h1>



      <Card className="p-6 mb-6 card-shadow card-hover-gradient animate-fade-in-up animation-delay-100">
        <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{course.description}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-500 dark:text-gray-400">
          <p><strong>Предмет:</strong> {course.subject}</p>
          <p><strong>Класс:</strong> {course.class_number}</p>
          <p><strong>Преподаватель:</strong> {course.teacher.username}</p>
        </div>
      </Card>

      {user?.role === 'student' && (
        <div className="mb-6 text-center animate-fade-in-up animation-delay-200">
          {isEnrolled ? (
            <Button
              variant="destructive"
              onClick={() => openModal('unenroll')}
              className="hover:scale-105 transition-transform duration-300 flex items-center gap-2"
              disabled={isEnrolling}
            >
              <XCircleIcon className="w-5 h-5" /> Отписаться
            </Button>
          ) : (
            <Button
              onClick={handleEnroll}
              className="hover:scale-105 transition-transform duration-300 flex items-center gap-2 animate-pulse"
              disabled={isEnrolling}
            >
              {isEnrolling ? 'Запись...' : <><CheckCircleIcon className="w-5 h-5" /> Записаться</>}
            </Button>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={modalAction === 'unenroll' ? handleUnenroll : handleDeleteCourse}
        title={modalAction === 'unenroll' ? 'Подтверждение отписки' : 'Подтверждение удаления'}
        message={
          modalAction === 'unenroll'
            ? 'Вы уверены, что хотите отписаться? Прогресс сохранится, но доступ к новым заданиям будет закрыт.'
            : 'Вы уверены, что хотите удалить этот урок? Все данные будут потеряны.'
        }
        confirmText={modalAction === 'unenroll' ? 'Отписаться' : 'Удалить'}
        cancelText="Отменить"
        className="animate-fade-in-up"
      />

      {['teacher', 'admin'].includes(user?.role || '') && (
        <div className="mb-6 flex justify-end animate-fade-in-up animation-delay-200">
          <Link href={`/courses/${courseId}/submissions`}>
            <Button className="hover:scale-105 transition-transform duration-300 flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5" /> Решения студентов
            </Button>
          </Link>
        </div>
      )}

      {['teacher', 'admin'].includes(user?.role || '') && (
        <Card className="p-6 mb-6 card-shadow card-hover-gradient animate-fade-in-up animation-delay-300">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-6 h-6" /> Статистика урока
          </h2>
          {statsLoading ? (
            <div className="text-center animate-pulse">Загрузка...</div>
          ) : statsError ? (
            <div className="text-red-500 text-center">{statsError}</div>
          ) : stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Студентов</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">{stats.students_count}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Средний балл</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-300">{stats.average_grade.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900 rounded-lg text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Завершено</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">{stats.completion_rate.toFixed(1)}%</p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">Нет данных</div>
          )}
        </Card>
      )}

      {user?.role === 'student' && (
        <Card className="p-6 mb-6 card-shadow card-hover-gradient animate-fade-in-up animation-delay-300">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            📊 Мой прогресс
          </h2>
          {progressLoading ? (
            <div className="text-center animate-pulse">Загрузка...</div>
          ) : progressError ? (
            <div className="text-red-500 text-center">{progressError}</div>
          ) : progress ? (
            progress.total_assignments === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400">Заданий нет</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Сдано заданий</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">{progress.completed_assignments}/{progress.total_assignments}</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Процент</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-300">{completionRate.toFixed(1)}%</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900 rounded-lg text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Баллы</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">{totalPoints.toFixed(1)}</p>
                  </div>
                </div>
                <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-6">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-custom"
                    style={{ width: `${completionRate}%` }}
                  />
                  <span className="absolute right-2 top-0 text-xs font-medium text-gray-600 dark:text-gray-300">{completionRate.toFixed(1)}%</span>
                </div>
                {Array.isArray(progress.completion_timeline) && progress.completion_timeline.length > 0 && (
                  <div className="mt-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl card-shadow">
                      <Line data={chartData} options={chartOptions} height={200} />
                    </div>
                  </div>
                )}
              </>
            )
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">Нет данных</div>
          )}
        </Card>
      )}

      <Card className="p-6 mb-6 card-shadow card-hover-gradient animate-fade-in-up animation-delay-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            📝 Задания
          </h2>
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <Link href={`/courses/${courseId}/assignments/new`}>
              <Button className="hover:scale-105 transition-transform duration-300 flex items-center gap-2">
                <PlusIcon className="w-5 h-5" /> Создать
              </Button>
            </Link>
          )}
        </div>
        {assignments.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">Заданий нет</div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment, index) => (
              <Link href={`/courses/${courseId}/assignments/${assignment.id}`} key={assignment.id}>
                <Card
                  className={clsx(
                    'p-6 card-shadow card-hover-gradient hover:scale-[1.01] transition-all duration-300 animate-fade-in-up',
                    { 'animation-delay-100': index % 3 === 0, 'animation-delay-200': index % 3 === 1, 'animation-delay-300': index % 3 === 2 }
                  )}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-300">{assignment.title}</h3>
                    <Button variant="outline" className="flex items-center gap-2">
                      Открыть <ArrowRightIcon className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{assignment.description}</p>
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <p><strong>Макс. балл:</strong> {assignment.max_score}</p>
                    <p><strong>Срок сдачи:</strong> {new Date(assignment.due_date).toLocaleString()}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {user?.role === 'admin' && (
        <div className="text-center animate-fade-in-up animation-delay-300">
          <Button
            variant="destructive"
            onClick={() => openModal('delete')}
            className="hover:scale-105 transition-transform duration-300 flex items-center gap-2"
          >
            <TrashIcon className="w-5 h-5" /> Удалить урок
          </Button>
        </div>
      )}
    </div>
  );
}