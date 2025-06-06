================================================================================
ФАЙЛОВАЯ СТРУКТУРА
================================================================================
frontend/
├── README.md
├── bun.lock
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── public
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src
│   ├── app
│   │   ├── achievements
│   │   │   └── page.tsx
│   │   ├── admin
│   │   │   └── page.tsx
│   │   ├── auth
│   │   │   ├── login
│   │   │   │   └── page.tsx
│   │   │   └── register
│   │   │       └── page.tsx
│   │   ├── courses
│   │   │   ├── [id]
│   │   │   │   ├── assignments
│   │   │   │   │   ├── [assignmentId]
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── new
│   │   │   │   │       └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── leaderboard
│   │   │   └── page.tsx
│   │   ├── notifications
│   │   │   └── page.tsx
│   │   ├── page.tsx
│   │   ├── profile
│   │   │   └── page.tsx
│   │   └── submissions
│   │       └── page.tsx
│   ├── entities
│   │   ├── course
│   │   │   ├── hook.ts
│   │   │   └── model.ts
│   │   └── user
│   │       ├── hook.ts
│   │       └── model.ts
│   ├── features
│   │   ├── auth
│   │   │   ├── lib.ts
│   │   │   └── login
│   │   │       └── index.tsx
│   │   └── course
│   │       └── enroll
│   │           └── index.tsx
│   └── shared
│       ├── api
│       │   └── index.ts
│       ├── hooks
│       │   ├── useAssignments.ts
│       │   ├── useAuth.tsx
│       │   ├── useCourses.ts
│       │   └── useSubmissions.ts
│       ├── lib
│       │   └── utils.ts
│       └── ui
│           ├── Button.tsx
│           ├── Card.tsx
│           ├── Input.tsx
│           └── QuizForm.tsx
├── tailwind.config.js
└── tsconfig.json

================================================================================
СОДЕРЖИМОЕ ФАЙЛОВ
================================================================================


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/entities/course/hook.ts
════════════════════════════════════════════════════════════════════════════════

// src/entities/course/hook.ts
'use client';
import { useState, useEffect } from 'react';
import { api } from '@/shared/api';
import { Course } from '@/entities/course/model';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await api.get('/courses');
        setCourses(response.data);
      } catch {
        setError('Не удалось загрузить курсы');
      } finally {
        setIsLoading(false);
      }
    }
    fetchCourses();
  }, []);

  return { courses, isLoading, error };
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/entities/course/model.ts
════════════════════════════════════════════════════════════════════════════════

// src/entities/course/model.ts
export interface Course {
	id: number;
	title: string;
	description: string;
	teacher: {
	  id: number;
	  username: string;
	};
	created_at: string;
	updated_at: string;
 }


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/entities/user/hook.ts
════════════════════════════════════════════════════════════════════════════════

'use client';
import { useEffect, useState } from 'react';
import { api } from '@/shared/api';
import { User } from '@/entities/user/model';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users/me');
      setUser(response.data);
      setError(null);
    } catch {
      setError('Не удалось загрузить профиль');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return { user, isLoading, error, refetch: fetchUser };
}



════════════════════════════════════════════════════════════════════════════════
║ frontend/src/entities/user/model.ts
════════════════════════════════════════════════════════════════════════════════

// src/entities/user/model.ts
export interface User {
	id: number;
	username: string;
	email: string;
	role: 'student' | 'teacher' | 'admin';
	class_number?: number;
	points: number;
	created_at: string;
	updated_at: string;
 }


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/layout.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';
import { useAuth } from '@/shared/hooks/useAuth';
import { AuthProvider } from '@/shared/hooks/useAuth';
import Link from 'next/link';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans transition-colors duration-300">
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { token, logout } = useAuth();

  return (
    <>
      <header className="shadow sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200 dark:bg-gray-900/80 dark:border-gray-700">
        <nav className="flex justify-between items-center max-w-6xl mx-auto px-4 py-3">
          <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition">
            ProjectSchool
          </Link>
          <div className="flex flex-wrap gap-3 text-sm">
            <NavLink href="/courses" label="Курсы" />
            <NavLink href="/leaderboard" label="Лидерборд" />
            <NavLink href="/submissions" label="Мои решения" />
            <NavLink href="/profile" label="Профиль" />
            <NavLink href="/admin" label="Админка" />
            {token ? (
              <button
                onClick={logout}
                className="text-red-600 hover:text-red-700 transition font-medium"
              >
                Выйти
              </button>
            ) : (
              <>
                <NavLink href="/auth/login" label="Войти" />
                <NavLink href="/auth/register" label="Регистрация" />
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-grow px-4 py-8">{children}</main>

      <footer className="bg-gray-900 text-white text-center py-6 mt-auto text-sm">
        © 2025 ProjectSchool. Все права защищены.
      </footer>
    </>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition font-medium"
    >
      {label}
    </Link>
  );
}



════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/page.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto text-center mt-20 animate-fade-in-up">
      <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-400 text-transparent bg-clip-text mb-6">
        Добро пожаловать в ProjectSchool!
      </h1>

      <Card className="p-8 shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60 backdrop-blur">
        <p className="mb-6 text-lg text-gray-700 dark:text-gray-300">
          Обучайтесь, выполняйте задания и соревнуйтесь в таблице лидеров!
        </p>
        <Link href="/courses">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full shadow transition duration-200">
            Перейти к курсам
          </Button>
        </Link>
      </Card>
    </div>
  );
}



════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/leaderboard/page.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';
import { useState, useEffect } from 'react';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { AxiosError } from 'axios';

interface LeaderboardUser {
  id: number;
  username: string;
  points: number;
}

interface ErrorResponse {
  error?: string;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [courseId, setCourseId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get<LeaderboardUser[]>(`/leaderboard${courseId ? `?course_id=${courseId}` : ''}`);
      setUsers(response.data);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setError(axiosError.response?.data?.error || 'Не удалось загрузить таблицу лидеров');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [courseId]);

  return (
    <div className="max-w-3xl mx-auto mt-12 px-4">
      <h1 className="text-4xl font-extrabold text-blue-600 text-center mb-8">🏆 Таблица лидеров</h1>

      <Card className="mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchLeaderboard();
          }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <Input
            type="number"
            placeholder="ID курса (опционально)"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full sm:flex-1"
          />
          <Button type="submit">Показать</Button>
        </form>
      </Card>

      {isLoading && <p className="text-center text-gray-500">Загрузка...</p>}
      {error && <p className="text-center text-red-500 mb-4">{error}</p>}

      <Card>
        {users.length === 0 && !isLoading ? (
          <p className="text-center text-gray-500">Нет данных</p>
        ) : (
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-gray-600 text-gray-500 uppercase">
                <th className="py-2 px-3">#</th>
                <th className="py-2 px-3">Пользователь</th>
                <th className="py-2 px-3">Баллы</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr
                  key={user.id}
                  className="border-b last:border-none border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <td className="py-2 px-3 font-medium">{index + 1}</td>
                  <td className="py-2 px-3">{user.username}</td>
                  <td className="py-2 px-3 font-semibold text-blue-600 dark:text-blue-400">{user.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}



════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/courses/page.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';
import { useState } from 'react';
import { useCourses } from '@/shared/hooks/useCourses';
import { useUser } from '@/entities/user/hook';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { EnrollButton } from '@/features/course/enroll';
import { api } from '@/shared/api';
import Link from 'next/link';
import { AxiosError } from 'axios';

interface Course {
  id: number;
  title: string;
  description: string;
  teacher: { username: string };
}

interface ErrorResponse {
  error?: string;
}

export default function CoursesPage() {
  const { courses, loading: isLoading, refetch, error, total } = useCourses(6, 0); // limit=6, offset=0
  const { user } = useUser();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [page, setPage] = useState(1); // Текущая страница
  const limit = 6; // Количество курсов на странице

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/courses', { title, description });
      await refetch(limit, (page - 1) * limit); // Обновляем текущую страницу
      setShowCreateForm(false);
      setTitle('');
      setDescription('');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setFormError(axiosError.response?.data?.error || 'Ошибка создания курса');
    }
  };

  const handleUnenroll = async (courseId: number) => {
    try {
      await api.delete(`/courses/${courseId}/enroll`);
      await refetch(limit, (page - 1) * limit); // Обновляем текущую страницу
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      alert(axiosError.response?.data?.error || 'Ошибка отмены записи');
    }
  };

  const handlePageChange = (newPage: number) => {
    const newOffset = (newPage - 1) * limit;
    if (newOffset < 0 || (total && newOffset >= total)) return;
    setPage(newPage);
    refetch(limit, newOffset);
  };

  if (isLoading) return <div className="text-center mt-8">Загрузка...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Ошибка: {error}</div>;

  const totalPages = total ? Math.ceil(total / limit) : 1;

  return (
    <div className="max-w-5xl mx-auto mt-12 px-4">
  <h1 className="text-4xl font-extrabold text-blue-600 text-center mb-8">📚 Курсы</h1>

  {(user?.role === 'teacher' || user?.role === 'admin') && (
    <div className="text-center mb-6">
      <Button onClick={() => setShowCreateForm(!showCreateForm)}>
        {showCreateForm ? 'Отменить' : 'Создать курс'}
      </Button>
    </div>
  )}

  {showCreateForm && (
    <Card className="mb-8">
      <form onSubmit={handleCreateCourse} className="space-y-4">
        {formError && <p className="text-red-500 text-sm text-center">{formError}</p>}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">Название курса</label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Введите название курса" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">Описание</label>
          <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Введите описание" />
        </div>
        <Button type="submit" className="w-full">Создать курс</Button>
      </form>
    </Card>
  )}

  {isLoading ? (
    <p className="text-center text-gray-500">Загрузка...</p>
  ) : error ? (
    <p className="text-center text-red-500">Ошибка: {error}</p>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {courses.map((course: Course) => (
        <Card key={course.id} className="p-6 flex flex-col justify-between">
          <div>
            <Link href={`/courses/${course.id}`}>
              <h2 className="text-xl font-bold text-blue-700 hover:underline mb-2">{course.title}</h2>
            </Link>
            <p className="text-sm text-gray-600 mb-2">{course.description}</p>
            <p className="text-sm text-gray-400">
              <strong>Преподаватель:</strong> {course.teacher.username}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <EnrollButton courseId={course.id} />
            {user?.role === 'student' && (
              <Button onClick={() => handleUnenroll(course.id)} variant="destructive">
                Отменить запись
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  )}

  {total && total > limit && (
    <div className="mt-8 flex justify-center items-center gap-4 text-sm">
      <Button
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
        className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
      >
        ⬅ Предыдущая
      </Button>
      <span className="text-gray-600">Страница {page} из {totalPages}</span>
      <Button
        onClick={() => handlePageChange(page + 1)}
        disabled={page === totalPages}
        className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
      >
        Следующая ➡
      </Button>
    </div>
  )}
</div>
  );
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/courses/[id]/page.tsx
════════════════════════════════════════════════════════════════════════════════

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

	useEffect(() => {
  async function fetchStats() {
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
  }
  if (courseId) {
    fetchStats();
  }
}, [courseId, user]);


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
  <div className="max-w-5xl mx-auto mt-12 px-4">
  <h1 className="text-4xl font-extrabold text-blue-600 text-center mb-8">📘 {course.title}</h1>

  <Card className="mb-6">
    <p className="text-gray-700 mb-2">{course.description}</p>
    <p className="text-sm text-gray-500">
      <strong>Преподаватель:</strong> {course.teacher.username}
    </p>
  </Card>

  {/* Статистика */}
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

  {/* Прогресс */}
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

  {/* Задания */}
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


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/courses/[id]/assignments/[assignmentId]/page.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/entities/user/hook';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
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
  question: string;
  options: string[];
  sort_order: number;
  input_type: 'multiple_choice' | 'text_input';
  file_url?: string;
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
          const subtasksRes = await api.get<Subtask[]>(`/assignments/${assignmentId}/subtasks`);
          const normalizedSubtasks = subtasksRes.data.map((subtask) => ({
            id: subtask.id,
            question: subtask.question,
            options: subtask.options || [],
            sort_order: subtask.sort_order,
            input_type: subtask.input_type || 'multiple_choice',
            file_url: subtask.file_url,
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
      <p className="font-semibold">
        Оценка: {quizResult.grade.toFixed(1)}
      </p>
      <p className="font-semibold">
        Баллы: {quizResult.totalScore.toFixed(1)} / {assignment.max_score}
      </p>
      <div className="mt-2">
        {quizResult.answers.map((answer, idx) => {
          const subtask = subtasks.find((s) => s.id === answer.SubtaskID);
          const subtaskScore = assignment.max_score / subtasks.length;
          return (
            <div key={answer.SubtaskID} className="mb-4 border-b pb-2"> {/* Добавляем key */}
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
                <p>
                  Правильный ответ: {answer.CorrectAnswer}
                </p>
              )}
              <p>
                Попытки: {answer.Attempts}
              </p>
              <p>
                Баллы: {answer.Score.toFixed(1)} / {subtaskScore.toFixed(1)}
              </p>
              {subtask?.input_type === 'multiple_choice' && subtask?.options.length > 0 && (
                <div>
                  <p>Варианты:</p>
                  <ul className="list-disc ml-5">
                    {subtask.options.map((option, optIdx) => (
                      <li
                        key={optIdx} // Добавляем key для вариантов ответа
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


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/courses/[id]/assignments/new/page.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
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
import Image from 'next/image';

const assignmentSchema = z.object({
  title: z.string().min(3, 'Название должно быть не короче 3 символов'),
  description: z.string().optional(),
  max_score: z.number().min(1, 'Максимальный балл должен быть больше 0'),
  due_date: z.string().refine((val) => new Date(val) > new Date(), {
    message: 'Срок сдачи должен быть в будущем',
  }),
  file: z.any().optional(),
  type: z.enum(['text', 'multiple_choice']),
});

type FormData = z.infer<typeof assignmentSchema>;

interface Subtask {
  question: string;
  options: string[];
  answer: string;
  numOptions: number;
  inputType?: 'multiple_choice' | 'text_input';
  image?: File | null;
  imagePreview?: string | null;
}

interface ErrorResponse {
  error?: string;
}

export default function CreateAssignmentPage() {
  const { id: courseId } = useParams();
  const { user } = useUser();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [assignmentType, setAssignmentType] = useState<'text' | 'multiple_choice'>('text');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      max_score: 100,
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      type: 'text',
    },
  });

  const handleAddSubtask = () => {
    setSubtasks([
      ...subtasks,
      {
        question: '',
        options: ['', ''],
        answer: '',
        numOptions: 2,
        inputType: 'multiple_choice',
        image: null,
        imagePreview: null,
      },
    ]);
  };

  const handleRemoveSubtask = (index: number) => {
    const subtask = subtasks[index];
    if (subtask.imagePreview) {
      URL.revokeObjectURL(subtask.imagePreview);
    }
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubtaskChange = (
    index: number,
    field: keyof Subtask,
    value: string | string[] | number | File | null
  ) => {
    const newSubtasks = [...subtasks];

    if (field === 'numOptions' && typeof value === 'number') {
      newSubtasks[index].numOptions = value;
      newSubtasks[index].options = Array(value).fill('');
      newSubtasks[index].answer = '';
    } else if (field === 'options' && Array.isArray(value)) {
      newSubtasks[index].options = value.map(opt => opt.trim());
    } else if (field === 'image' && value instanceof File) {
      if (value.size > 10 * 1024 * 1024) {
        toast.error(`Файл подзадания ${index + 1} слишком большой (макс. 10 МБ)`);
        return;
      }
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(value.type)) {
        toast.error(`Неподдерживаемый тип файла для подзадания ${index + 1} (jpg, png, pdf)`);
        return;
      }
      if (newSubtasks[index].imagePreview) {
        URL.revokeObjectURL(newSubtasks[index].imagePreview);
      }
      newSubtasks[index].image = value;
      newSubtasks[index].imagePreview = URL.createObjectURL(value);
    } else if (field === 'inputType' && typeof value === 'string') {
      newSubtasks[index].inputType = value as 'multiple_choice' | 'text_input';
      if (value === 'text_input') {
        newSubtasks[index].options = [];
        newSubtasks[index].answer = '';
        console.log(`Subtask ${index} switched to text_input, options cleared:`, newSubtasks[index].options);
      } else {
        newSubtasks[index].options = ['', ''];
        newSubtasks[index].answer = '';
        newSubtasks[index].numOptions = 2;
        console.log(`Subtask ${index} switched to multiple_choice, options set:`, newSubtasks[index].options);
      }
    } else if (typeof value === 'string') {
      switch (field) {
        case 'question':
          newSubtasks[index].question = value.trim();
          break;
        case 'answer':
          if (newSubtasks[index].inputType === 'multiple_choice') {
            const normalizedOptions = newSubtasks[index].options.map(opt => opt.trim());
            if (value && !normalizedOptions.includes(value.trim())) {
              toast.error('Правильный ответ должен быть одним из вариантов');
              return;
            }
          }
          newSubtasks[index].answer = value.trim();
          break;
        default:
          break;
      }
    }

    setSubtasks(newSubtasks);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Файл слишком большой (макс. 10 МБ)');
        toast.error('Файл слишком большой (макс. 10 МБ)');
        return;
      }
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        setError('Неподдерживаемый тип файла (jpg, png, pdf)');
        toast.error('Неподдерживаемый тип файла (jpg, png, pdf)');
        return;
      }
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setValue('file', file);
      setError('');
      toast.success('Файл выбран');
    }
  };

  const onSubmit = async (data: FormData) => {
    setError('');
    setIsSubmitting(true);
    try {
      if (!courseId || typeof courseId !== 'string') {
        const errorMessage = 'ID курса не указан';
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      const formData = new FormData();
      formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      formData.append('max_score', data.max_score.toString());
      formData.append('due_date', `${data.due_date}:00+00:00`);
      formData.append('course_id', courseId);
      formData.append('type', assignmentType);
      if (data.file) formData.append('file', data.file);

      if (assignmentType === 'multiple_choice') {
        if (subtasks.length === 0) {
          setError('Тест должен содержать хотя бы одно подзадание');
          toast.error('Тест должен содержать хотя бы одно подзадание');
          return;
        }
        for (const [index, subtask] of subtasks.entries()) {
          if (!subtask.question) {
            setError(`Вопрос ${index + 1} должен быть заполнен`);
            toast.error(`Вопрос ${index + 1} должен быть заполнен`);
            return;
          }
          if (subtask.inputType === 'multiple_choice') {
            if (subtask.options.filter(opt => opt.trim()).length < 2 || subtask.options.length > 6) {
              setError(`Подзадание ${index + 1} должно иметь от 2 до 6 вариантов ответа`);
              toast.error(`Подзадание ${index + 1} должно иметь от 2 до 6 вариантов ответа`);
              return;
            }
          } else if (subtask.inputType === 'text_input') {
            if (subtask.options.length > 0) {
              setError(`Подзадание ${index + 1} с текстовым вводом не должно содержать варианты ответа`);
              toast.error(`Подзадание ${index + 1} с текстовым вводом не должно содержать варианты ответа`);
              return;
            }
          }
          if (!subtask.answer) {
            setError(`Подзадание ${index + 1} должно иметь правильный ответ`);
            toast.error(`Подзадание ${index + 1} должно иметь правильный ответ`);
            return;
          }
          if (subtask.image) {
            formData.append(`subtask_image_${index}`, subtask.image);
          }
        }

        const normalizedSubtasks = subtasks.map((subtask, index) => ({
          Question: subtask.question,
          Options: subtask.inputType === 'multiple_choice' ? subtask.options.filter(opt => opt.trim()) : [],
          Answer: subtask.answer,
          SortOrder: index + 1,
          Type: subtask.inputType || 'multiple_choice',
        }));
        formData.append('subtasks_json', JSON.stringify(normalizedSubtasks));
      }

      const response = await api.post('/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Задание успешно создано!');
      window.location.href = `/courses/${courseId}/assignments/${response.data.assignment_id}`;
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMessage = axiosError.response?.data?.error || 'Ошибка при создании задания';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return <div>Доступ запрещён</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card title="Создать задание">
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && <div className="text-red-500 mb-4">{error}</div>}

          <div className="mb-4">
            <label className="block mb-2">Тип задания</label>
            <select
              value={assignmentType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAssignmentType(e.target.value as 'text' | 'multiple_choice')}
              className="border p-2 rounded w-full"
            >
              <option value="text">Обычное задание</option>
              <option value="multiple_choice">Тест с вариантами</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-2">Название</label>
            <Input {...register('title')} />
            {errors.title && <p className="text-red-500">{errors.title.message}</p>}
          </div>

          <div className="mb-4">
            <label className="block mb-2">Описание</label>
            <Input {...register('description')} />
          </div>

          <div className="mb-4">
            <label className="block mb-2">Максимальный балл</label>
            <Input type="number" {...register('max_score', { valueAsNumber: true })} />
            {errors.max_score && <p className="text-red-500">{errors.max_score.message}</p>}
          </div>

          <div className="mb-4">
            <label className="block mb-2">Срок сдачи</label>
            <Input type="datetime-local" {...register('due_date')} />
            {errors.due_date && <p className="text-red-500">{errors.due_date.message}</p>}
          </div>

          <div className="mb-4">
            <label className="block mb-2">Файл (jpg, png, pdf)</label>
            <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={handleFileChange} />
            {preview && (
              <div className="mt-2">
                {preview.endsWith('.pdf') ? (
                  <a href={preview} target="_blank" rel="noopener noreferrer">
                    Просмотреть PDF
                  </a>
                ) : (
                  <Image src={preview} alt="Preview" width={200} height={200} />
                )}
              </div>
            )}
          </div>

          {assignmentType === 'multiple_choice' && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Подзадания</h3>
              {subtasks.map((subtask, idx) => (
                <div key={idx} className="border p-4 mb-2 rounded">
                  <label className="block mb-2">Вопрос</label>
                  <Input
                    value={subtask.question}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleSubtaskChange(idx, 'question', e.target.value)
                    }
                    className="mb-2"
                  />
                  <label className="block mb-2">Тип подзадания</label>
                  <select
                    value={subtask.inputType || 'multiple_choice'}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      handleSubtaskChange(idx, 'inputType', e.target.value)
                    }
                    className="border p-2 rounded w-full mb-2"
                  >
                    <option value="multiple_choice">С выбором ответа</option>
                    <option value="text_input">С вводом ответа</option>
                  </select>

                  <label className="block mb-2">Файл подзадания (jpg, png, pdf)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleSubtaskChange(idx, 'image', e.target.files?.[0] || null)
                    }
                    className="mb-2"
                  />
                  {subtask.imagePreview && (
                    <div className="mt-2 mb-2">
                      {subtask.image?.type === 'application/pdf' ? (
                        <a href={subtask.imagePreview} target="_blank" rel="noopener noreferrer">
                          Просмотреть PDF
                        </a>
                      ) : (
                        <Image src={subtask.imagePreview} alt={`Subtask ${idx + 1} Preview`} width={200} height={200} />
                      )}
                    </div>
                  )}
                  {subtask.inputType !== 'text_input' && (
                    <>
                      <label className="block mb-2">Количество вариантов ответа (2–6)</label>
                      <select
                        value={subtask.numOptions}
                        onChange={(e) =>
                          handleSubtaskChange(idx, 'numOptions', Number(e.target.value))
                        }
                        className="border p-2 rounded w-full mb-2"
                      >
                        {[2, 3, 4, 5, 6].map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                      <label className="block mb-2">Варианты ответа</label>
                      {subtask.options.map((option, optIdx) => (
                        <Input
                          key={optIdx}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...subtask.options];
                            newOptions[optIdx] = e.target.value;
                            handleSubtaskChange(idx, 'options', newOptions);
                          }}
                          className="mb-1"
                          placeholder={`Вариант ${optIdx + 1}`}
                        />
                      ))}
                    </>
                  )}

                  <label className="block mb-2">Правильный ответ</label>
                  {subtask.inputType === 'text_input' ? (
                    <Input
                      value={subtask.answer}
                      onChange={(e) =>
                        handleSubtaskChange(idx, 'answer', e.target.value)
                      }
                      className="mb-2"
                      placeholder="Введите правильный ответ"
                    />
                  ) : (
                    <select
                      value={subtask.answer}
                      onChange={(e) => handleSubtaskChange(idx, 'answer', e.target.value)}
                      className="border p-2 rounded w-full"
                    >
                      <option value="">Выберите ответ</option>
                      {subtask.options.map((opt, i) =>
                        opt.trim() ? (
                          <option key={i} value={opt}>
                            {opt}
                          </option>
                        ) : null
                      )}
                    </select>
                  )}

                  <Button
                    type="button"
                    onClick={() => handleRemoveSubtask(idx)}
                    className="mt-2 bg-red-600 text-white"
                  >
                    Удалить подзадание
                  </Button>
                </div>
              ))}
              <Button type="button" onClick={handleAddSubtask}>
                Добавить подзадание
              </Button>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Создаётся...' : 'Создать'}
          </Button>
        </form>
      </Card>
    </div>
  );
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/notifications/page.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';
import { useState, useEffect } from 'react';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

interface Notification {
  id: number;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface ErrorResponse {
  error?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<Notification[]>('/notifications');
      setNotifications(response.data);
      setError('');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setError(axiosError.response?.data?.error || 'Ошибка загрузки уведомлений');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling каждые 30 секунд
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      toast.success('Уведомление помечено как прочитанное');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      toast.error(axiosError.response?.data?.error || 'Ошибка пометки уведомления');
    }
  };

  if (isLoading && !notifications.length) {
    return <div className="text-center mt-8">Загрузка...</div>;
  }
  if (error) {
    return <div className="text-center mt-8 text-red-500">Ошибка: {error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-12 px-4">
  <h1 className="text-4xl font-extrabold text-center text-blue-600 mb-8">🔔 Уведомления</h1>

  {isLoading && !notifications.length && (
    <p className="text-center text-gray-500">Загрузка...</p>
  )}
  {error && <p className="text-center text-red-500">Ошибка: {error}</p>}

  <div className="space-y-4">
    {notifications.length === 0 ? (
      <Card className="p-6">
        <p className="text-center text-gray-500">Нет уведомлений</p>
      </Card>
    ) : (
      notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-l-4 transition-all ${
            notification.is_read
              ? 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/40'
              : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          }`}
        >
          <div className="flex-1">
            <p className={`text-sm sm:text-base ${notification.is_read ? 'text-gray-500' : 'font-semibold text-blue-800 dark:text-blue-200'}`}>
              {notification.message}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(notification.created_at).toLocaleString()}
            </p>
          </div>

          {!notification.is_read && (
            <div className="shrink-0">
              <Button
                onClick={() => markAsRead(notification.id)}
                className="text-sm px-3 py-1"
              >
                Прочитано
              </Button>
            </div>
          )}
        </Card>
      ))
    )}
  </div>
</div>
  );
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/submissions/page.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';
import { useSubmissions } from '@/shared/hooks/useSubmissions';
import { useUser } from '@/entities/user/hook';
import { Card } from '@/shared/ui/Card';
import Link from 'next/link';
import { parseISO, format } from 'date-fns';

interface Submission {
  id: number;
  assignment_id: number;
  user_id: number;
  score: number;
  submitted_at: string;
  assignment_title: string;
  course_id: number;
  course_title: string;
}

export default function SubmissionsPage() {
  const { user, isLoading: userLoading } = useUser();
  const { submissions, loading, error } = useSubmissions();

  if (userLoading || loading) {
    return <div className="text-center mt-8">Загрузка...</div>;
  }

  if (!user) {
    return <div className="text-center mt-8 text-red-500">Пожалуйста, войдите в систему</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">Ошибка: {error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto mt-12 px-4">
      <h1 className="text-4xl font-extrabold text-blue-600 text-center mb-8">📄 Мои решения</h1>

      <Card>
        {submissions.length === 0 ? (
          <p className="text-center text-gray-500">Решения отсутствуют</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-600 text-gray-500 uppercase">
                  <th className="py-2 px-3">Задание</th>
                  <th className="py-2 px-3">Курс</th>
                  <th className="py-2 px-3">Оценка</th>
                  <th className="py-2 px-3">Дата отправки</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission: Submission) => (
                  <tr
                    key={submission.id}
                    className="border-b last:border-none border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                  >
                    <td className="py-2 px-3">
                      {submission.course_id && submission.assignment_id ? (
                        <Link
                          href={`/courses/${submission.course_id}/assignments/${submission.assignment_id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {submission.assignment_title}
                        </Link>
                      ) : (
                        submission.assignment_title
                      )}
                    </td>
                    <td className="py-2 px-3">{submission.course_title}</td>
                    <td className="py-2 px-3">
                      {submission.score > 0 ? (
                        submission.score.toFixed(2)
                      ) : (
                        <span className="text-gray-400 italic">Не оценено</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {submission.submitted_at
                        ? format(parseISO(submission.submitted_at), 'dd.MM.yyyy HH:mm')
                        : 'Не указано'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}



════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/auth/register/page.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';
import { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { api } from '@/shared/api';
import { useAuth } from '@/shared/hooks/useAuth';
import { Card } from '@/shared/ui/Card';
import { AxiosError } from 'axios';

interface ErrorResponse {
  error?: string;
}

export default function RegisterPage() {
  const { setToken } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [classNumber, setClassNumber] = useState(''); // 👈
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const classNumInt = parseInt(classNumber);
    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }
    if (!classNumInt || classNumInt < 1 || classNumInt > 11) {
      setError('Номер класса должен быть от 1 до 11');
      return;
    }

    try {
      const res = await api.post('/register', {
        email,
        username,
        password,
        role: 'student',
        class_number: classNumInt, // 👈
      });
      setToken(res.data.token);
      window.location.href = '/profile';
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setError(axiosError.response?.data?.error || 'Ошибка регистрации');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 px-4">
  <h1 className="text-4xl font-extrabold text-center text-blue-600 mb-8">Регистрация</h1>
  <Card className="p-6">
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-1">Имя пользователя</label>
        <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">Пароль</label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="classNumber" className="block text-sm font-medium mb-1">Класс (1–11)</label>
        <Input id="classNumber" type="number" value={classNumber} onChange={(e) => setClassNumber(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full">Зарегистрироваться</Button>
    </form>
  </Card>
</div>
  );
}



════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/auth/login/page.tsx
════════════════════════════════════════════════════════════════════════════════

// src/app/auth/login/page.tsx
'use client';
import { LoginForm } from '@/features/auth/login';
import { Card } from '@/shared/ui/Card';

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto mt-12 px-4">
  <h1 className="text-4xl font-extrabold text-center text-blue-600 mb-8">Вход</h1>
  <Card className="p-6">
    <LoginForm />
  </Card>
</div>
  );
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/profile/page.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@/entities/user/hook';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';
import Link from 'next/link';

interface ErrorResponse {
  error?: string;
}

export default function ProfilePage() {
  const { user, isLoading, error, refetch } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    try {
      await api.put('/users/me', { username, email });
      await refetch();
      setIsEditing(false);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setEditError(axiosError.response?.data?.error || 'Ошибка обновления профиля');
    }
  };

  if (isLoading) return <div className="text-center mt-8">Загрузка...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Ошибка: {error}</div>;
  if (!user) return <div className="text-center mt-8">Пользователь не найден</div>;

  return (
    <div className="max-w-2xl mx-auto mt-12 px-4">
      <h1 className="text-4xl font-extrabold text-center mb-8 text-blue-600">Профиль</h1>

      <Card>
        {isEditing ? (
          <form onSubmit={handleEdit} className="space-y-4">
            {editError && <p className="text-red-500 text-sm">{editError}</p>}

            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1">
                Имя
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <Button type="submit">Сохранить</Button>
              <Button type="button" onClick={() => setIsEditing(false)} variant="outline">
                Отмена
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-2 text-gray-800 dark:text-gray-100">
            <p><strong>Имя:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Роль:</strong> {user.role}</p>
            {user.role === 'student' && <p><strong>Класс:</strong> {user.class_number}</p>}
            <p><strong>Баллы:</strong> {user.points}</p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
              <Button onClick={() => setIsEditing(true)}>Редактировать профиль</Button>
              <Link href="/achievements">
                <Button variant="outline">Мои достижения 🏆</Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}



════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/achievements/page.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';
import { useEffect, useState } from 'react';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import { useUser } from '@/entities/user/hook';

interface Achievement {
  title: string;
  description: string;
  awarded_at: string;
}

export default function AchievementsPage() {
  useUser(); // если нужен вызов для авторизации
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAchievements() {
      try {
        const response = await api.get<Achievement[]>('/users/me/achievements');
        setAchievements(response.data);
      } catch {
        setError('Не удалось загрузить достижения');
      } finally {
        setLoading(false);
      }
    }

    fetchAchievements();
  }, []);

  if (loading) return <div className="text-center mt-8">Загрузка...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto mt-12 px-4">
  <h1 className="text-4xl font-extrabold text-center text-blue-600 mb-8">🏅 Мои достижения</h1>

  {achievements.length === 0 ? (
    <p className="text-center text-gray-500">Вы ещё не получили ни одного достижения.</p>
  ) : (
    <div className="grid gap-4 sm:grid-cols-2">
      {achievements.map((ach, index) => (
        <Card key={index} className="p-5">
          <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-400">{ach.title}</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{ach.description}</p>
          <p className="text-xs text-gray-400">Получено: {new Date(ach.awarded_at).toLocaleString()}</p>
        </Card>
      ))}
    </div>
  )}
</div>
  );
}



════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/admin/page.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@/entities/user/hook';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';

interface User {
  id: number;
  username: string;
  role: string;
}

interface Course {
  id: number;
  title: string;
}

interface ErrorResponse {
  error?: string;
}

export default function AdminPage() {
  const { user, isLoading } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const usersResponse = await api.get<User[]>('/users');
      const coursesResponse = await api.get<Course[]>('/courses');
      setUsers(usersResponse.data);
      setCourses(coursesResponse.data);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setError(axiosError.response?.data?.error || 'Ошибка загрузки данных');
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/users/${userId}/role`, { role });
      fetchData();
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setError(axiosError.response?.data?.error || 'Ошибка изменения роли');
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  if (isLoading) return <div className="text-center mt-8">Загрузка...</div>;
  if (!user || user.role !== 'admin')
    return <div className="text-center mt-8 text-red-500">Доступ запрещён</div>;

  return (
    <div className="max-w-4xl mx-auto mt-12 px-4">
  <h1 className="text-4xl font-extrabold text-center text-blue-600 mb-8">🛠 Админ-панель</h1>
  {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

  <Card className="mb-6">
    <h2 className="text-xl font-semibold mb-4">Управление пользователями</h2>
    <form onSubmit={handleUpdateRole} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="userId" className="block text-sm font-medium mb-1">ID пользователя</label>
        <Input id="userId" type="number" value={userId} onChange={(e) => setUserId(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium mb-1">Роль</label>
        <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="student, teacher, admin" required />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit">Изменить роль</Button>
      </div>
    </form>
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Список пользователей</h3>
      <ul className="text-sm space-y-1">
        {users.map((u) => (
          <li key={u.id} className="text-gray-700 dark:text-gray-300">{u.username} (ID: {u.id}, Роль: {u.role})</li>
        ))}
      </ul>
    </div>
  </Card>

  <Card>
    <h2 className="text-xl font-semibold mb-4">Управление курсами</h2>
    <ul className="text-sm space-y-1">
      {courses.map((c) => (
        <li key={c.id}>{c.title} (ID: {c.id})</li>
      ))}
    </ul>
  </Card>
</div>
  );
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/features/auth/lib.ts
════════════════════════════════════════════════════════════════════════════════

// src/features/auth/lib.ts
import { api } from '@/shared/api';

interface LoginCredentials {
  email: string;
  password: string;
}

export async function login(credentials: LoginCredentials) {
  const response = await api.post('/login', credentials);
  return response.data;
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/features/auth/login/index.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';
import { useState } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { login } from '@/features/auth/lib';
import { AxiosError } from 'axios';

interface ErrorResponse {
  error?: string;
}

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setToken } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { token } = await login({ email, password });
      setToken(token);
      window.location.href = '/profile';
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setError(axiosError.response?.data?.error || 'Неверный email или пароль');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Пароль
        </label>
        <Input
          id="password"
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Войти
      </Button>
    </form>
  );
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/features/course/enroll/index.tsx
════════════════════════════════════════════════════════════════════════════════

// src/features/course/enroll/index.tsx
'use client';
import { useState } from 'react';
import { api } from '@/shared/api';
import { Button } from '@/shared/ui/Button';

interface EnrollButtonProps {
  courseId: number;
}

export function EnrollButton({ courseId }: EnrollButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEnroll = async () => {
    setIsLoading(true);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      alert('Вы записаны на курс!');
    } catch {
      setError('Не удалось записаться на курс');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {error && <p className="text-red-500">{error}</p>}
      <Button onClick={handleEnroll} disabled={isLoading}>
        {isLoading ? 'Запись...' : 'Записаться'}
      </Button>
    </>
  );
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/shared/api/index.ts
════════════════════════════════════════════════════════════════════════════════

import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/shared/hooks/useAuth.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('token');
      setToken(stored);
    }
  }, []);

  const handleSetToken = (newToken: string | null) => {
    setToken(newToken);
    if (typeof window !== 'undefined') {
      if (newToken) {
        localStorage.setItem('token', newToken);
      } else {
        localStorage.removeItem('token');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ token, setToken: handleSetToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');

  const logout = () => {
    context.setToken(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  };

  return { ...context, logout };
}



════════════════════════════════════════════════════════════════════════════════
║ frontend/src/shared/hooks/useSubmissions.ts
════════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';

interface APISubmission {
  ID: number;
  UserID: number;
  AssignmentID: number;
  Grade: number;
  CreatedAt: string;
  Content: string; // Добавляем поле Content
  Assignment: {
    ID: number;
    Title: string;
    CourseID: number;
    Course: {
      ID: number;
      Title: string;
    };
  };
}

interface Submission {
  id: number;
  user_id: number;
  score: number;
  submitted_at: string;
  assignment_id: number;
  assignment_title: string;
  course_id: number;
  course_title: string;
  content: string;
  username?: string; // Поле необязательное, так как API его не возвращает
}

interface ErrorResponse {
  error?: string;
}

export function useSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubmissions() {
      setLoading(true);
      try {
        const response = await api.get<APISubmission[]>('/users/me/submissions');
        console.log('Ответ от /api/users/me/submissions:', response.data); // Для отладки
        // Преобразуем вложенную структуру в плоскую
        const transformedSubmissions: Submission[] = response.data.map((sub) => ({
          id: sub.ID,
          user_id: sub.UserID,
          score: sub.Grade,
          submitted_at: sub.CreatedAt,
          assignment_id: sub.AssignmentID,
          assignment_title: sub.Assignment?.Title || 'Без названия',
          course_id: sub.Assignment?.Course?.ID || 0,
          course_title: sub.Assignment?.Course?.Title || 'Без названия',
          content: sub.Content || '',
          username: '', // Поле не возвращается API
        }));
        setSubmissions(transformedSubmissions);
        setError(null);
      } catch (err: unknown) {
        const axiosError = err as AxiosError<ErrorResponse>;
        setError(axiosError.response?.data?.error || 'Не удалось загрузить решения');
        console.error('Ошибка загрузки решений:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubmissions();
  }, []);

  return { submissions, loading, error };
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/shared/hooks/useAssignments.ts
════════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';

interface Assignment {
  id: number;
  title: string;
  description: string;
  max_score: number;
  due_date: string;
  file_url?: string; // Добавлено
}

interface ErrorResponse {
  error?: string;
}

export function useAssignments(courseId: string | string[]) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssignments() {
      setLoading(true);
      try {
        const response = await api.get<Assignment[]>(`/courses/${courseId}/assignments`);
        setAssignments(response.data);
        setError(null);
      } catch (err: unknown) {
        const axiosError = err as AxiosError<ErrorResponse>;
        setError(axiosError.response?.data?.error || 'Не удалось загрузить задания');
      } finally {
        setLoading(false);
      }
    }
    fetchAssignments();
  }, [courseId]);

  const refetch = () => {
    async function fetchAssignments() {
      setLoading(true);
      try {
        const response = await api.get<Assignment[]>(`/courses/${courseId}/assignments`);
        setAssignments(response.data);
        setError(null);
      } catch (err: unknown) {
        const axiosError = err as AxiosError<ErrorResponse>;
        setError(axiosError.response?.data?.error || 'Не удалось загрузить задания');
      } finally {
        setLoading(false);
      }
    }
    fetchAssignments();
  };

  return { assignments, loading, error, refetch };
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/shared/hooks/useCourses.ts
════════════════════════════════════════════════════════════════════════════════

'use client';
import { useEffect, useState } from 'react';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';

interface Course {
  id: number;
  title: string;
  description: string;
  teacher: { username: string };
}

interface UseCoursesResult {
  courses: Course[];
  loading: boolean;
  error: string | null;
  refetch: (limit?: number, offset?: number) => Promise<void>;
  total: number; // Общее количество курсов
}

export function useCourses(limit: number = 6, offset: number = 0): UseCoursesResult {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0); // Общее количество курсов

  const fetchCourses = async (newLimit?: number, newOffset?: number) => {
    setLoading(true);
    try {
      const response = await api.get('/courses', {
        params: {
          limit: newLimit || limit,
          offset: newOffset || offset,
        },
      });
      // Предполагаем, что бэк возвращает { courses: [], total: number }
      setCourses(response.data.courses || response.data);
      setTotal(response.data.total || (response.data.length || 0)); // Если total нет, используем длину массива как временное решение
      setError(null);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ error?: string }>;
      console.error('Ошибка загрузки курсов:', err);
      setError(axiosError.response?.data?.error || 'Не удалось загрузить курсы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(limit, offset);
  }, [limit, offset]);

  return { courses, loading, error, refetch: fetchCourses, total };
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/shared/ui/Input.tsx
════════════════════════════════════════════════════════════════════════════════

import { InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={clsx(
        'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all',
        className
      )}
      {...props}
    />
  );
}



════════════════════════════════════════════════════════════════════════════════
║ frontend/src/shared/ui/Button.tsx
════════════════════════════════════════════════════════════════════════════════

import { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant?: 'default' | 'outline' | 'destructive';
  children?: ReactNode;
}

export function Button({ children, className = '', variant = 'default', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium text-sm transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  return (
    <button
      className={clsx(base, variants[variant], className, 'px-4 py-2')}
      {...props}
    >
      {children ?? 'Default Button'}
    </button>
  );
}



════════════════════════════════════════════════════════════════════════════════
║ frontend/src/shared/ui/Card.tsx
════════════════════════════════════════════════════════════════════════════════

import { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={clsx(
      'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 transition-all',
      className
    )}>
      {title && <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{title}</h2>}
      {children}
    </div>
  );
}



════════════════════════════════════════════════════════════════════════════════
║ frontend/src/shared/ui/QuizForm.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import { api } from '@/shared/api';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import Image from 'next/image';

interface Subtask {
  id: number;
  ID?: number;
  question: string;
  Question?: string;
  options?: string[];
  Options?: string[];
  sort_order: number;
  SortOrder?: number;
  input_type?: string;
InputType?: string;

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

interface QuizFormProps {
  assignmentId: number;
  subtasks: Subtask[];
  onSubmit: (result: QuizResult) => void;
}

export function QuizForm({ assignmentId, subtasks, onSubmit }: QuizFormProps) {
  const [answers, setAnswers] = useState<Record<number, { answer: string; attempts: number; isCorrect?: boolean }>>({});
  const [incorrectOptions, setIncorrectOptions] = useState<Record<number, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, string>>({});
  const [currentSubtaskIndex, setCurrentSubtaskIndex] = useState(0); // Текущий вопрос

  console.log('QuizForm props:', { assignmentId, subtasks });

  // Инициализация состояния
  useEffect(() => {
    const initialAnswers: Record<number, { answer: string; attempts: number; isCorrect?: boolean }> = {};
    const initialIncorrectOptions: Record<number, string[]> = {};
    subtasks.forEach((subtask) => {
      const subtaskId = subtask.id ?? subtask.ID ?? 0;
      const stored = localStorage.getItem(`quiz_${assignmentId}_${subtaskId}`);
      const data = stored ? JSON.parse(stored) : { attempts: 0, incorrectOptions: [] };
      initialAnswers[subtaskId] = { answer: '', attempts: data.attempts || 0, isCorrect: undefined };
      initialIncorrectOptions[subtaskId] = data.incorrectOptions || [];
    });
    setAnswers(initialAnswers);
    setIncorrectOptions(initialIncorrectOptions);

    // Очищаем localStorage при монтировании, если квиз новый
    return () => {
      subtasks.forEach((subtask) => {
        const subtaskId = subtask.id ?? subtask.ID ?? 0;
        localStorage.removeItem(`quiz_${assignmentId}_${subtaskId}`);
      });
    };
  }, [assignmentId, subtasks]);

  if (!Array.isArray(subtasks) || subtasks.length === 0) {
    console.warn('QuizForm: subtasks is empty or not an array');
    return <div>Нет вопросов для квиза</div>;
  }

  const handleChange = async (subtaskId: number, answer: string) => {
    const normalizedAnswer = answer.trim();

    try {
      const response = await api.post(`/assignments/${assignmentId}/check-subtask`, {
        subtask_id: subtaskId,
        answer: normalizedAnswer,
      });
      const { isCorrect, attempts } = response.data;

      setAnswers((prev) => ({
        ...prev,
        [subtaskId]: {
          answer: normalizedAnswer,
          attempts,
          isCorrect,
        },
      }));

      if (!isCorrect) {
        setIncorrectOptions((prev) => ({
          ...prev,
          [subtaskId]: [...(prev[subtaskId] || []), normalizedAnswer],
        }));
        toast.error('Неправильный ответ, попробуйте снова!');
      } else {
        toast.success('Правильный ответ!');
      }

      // Сохраняем в localStorage
      localStorage.setItem(
        `quiz_${assignmentId}_${subtaskId}`,
        JSON.stringify({
          attempts,
          answer: normalizedAnswer,
          isCorrect,
          incorrectOptions: [...(incorrectOptions[subtaskId] || []), ...(isCorrect ? [] : [normalizedAnswer])],
        })
      );
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      toast.error(axiosErr.response?.data?.error || 'Ошибка при проверке ответа');
      console.error('Check answer error:', err);
    }
  };

  const handleNext = () => {
    const subtaskId = subtasks[currentSubtaskIndex].id ?? subtasks[currentSubtaskIndex].ID ?? 0;
    if (!answers[subtaskId]?.answer) {
      toast.error('Пожалуйста, выберите ответ перед переходом к следующему вопросу');
      return;
    }
    if (currentSubtaskIndex < subtasks.length - 1) {
      setCurrentSubtaskIndex(currentSubtaskIndex + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subtaskId = subtasks[currentSubtaskIndex].id ?? subtasks[currentSubtaskIndex].ID ?? 0;
    if (!answers[subtaskId]?.answer) {
      toast.error('Пожалуйста, выберите ответ');
      return;
    }

    const payload = subtasks.map((subtask) => {
      const subtaskId = subtask.id ?? subtask.ID ?? 0;
      const answer = answers[subtaskId]?.answer || '';
      const attempts = answers[subtaskId]?.attempts || 0;
      return {
        SubtaskID: subtaskId,
        Answer: answer,
        Attempts: attempts,
      };
    });

    console.log('Submitting quiz payload:', { answers: payload });

    setIsSubmitting(true);
    try {
      const response = await api.post(`/assignments/${assignmentId}/submit-quiz`, { answers: payload });
      console.log('Quiz response:', response.data);
      toast.success('Ответы отправлены!');
      onSubmit(response.data);
      // Очищаем localStorage
      subtasks.forEach((subtask) => {
        const subtaskId = subtask.id ?? subtask.ID ?? 0;
        localStorage.removeItem(`quiz_${assignmentId}_${subtaskId}`);
      });
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      toast.error(axiosErr.response?.data?.error || 'Ошибка при отправке');
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSubtask = subtasks[currentSubtaskIndex];
  const subtaskId = currentSubtask.id ?? currentSubtask.ID ?? 0;
  const inputType = currentSubtask.input_type ?? currentSubtask.InputType ?? 'multiple_choice';
const options = Array.isArray(currentSubtask.options)
  ? currentSubtask.options
  : Array.isArray(currentSubtask.Options)
  ? currentSubtask.Options
  : [];

const question = currentSubtask.question ?? currentSubtask.Question ?? 'Вопрос отсутствует';
const fileUrl = currentSubtask.file_url ?? currentSubtask.File_url;


  if (inputType === 'multiple_choice' && !options.length) {
  console.error(`Subtask ${subtaskId} has invalid options:`, currentSubtask);
  return (
    <div className="text-red-500">
      Ошибка: некорректные варианты ответа для вопроса `{question}`
    </div>
  );
}


  const isCorrect = answers[subtaskId]?.isCorrect;
  const incorrectOptionsForSubtask = incorrectOptions[subtaskId] || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-4">
        <p className="font-semibold mb-2">
          {currentSubtaskIndex + 1}. {question} ({currentSubtaskIndex + 1}/{subtasks.length})
        </p>
        {fileUrl && !imageErrors[subtaskId] && (
  <div className="mt-2 mb-4">
    {fileUrl.endsWith('.pdf') ? (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        Просмотреть PDF
      </a>
    ) : (
      <>
        <Image
          src={fileUrl}
          alt={`Subtask ${currentSubtaskIndex + 1} image`}
          width={300}
          height={300}
          className="rounded"
          onError={() =>
            setImageErrors((prev) => ({
              ...prev,
              [subtaskId]: `Ошибка загрузки изображения для вопроса ${currentSubtaskIndex + 1}`,
            }))
          }
        />
        {imageErrors[subtaskId] && <p className="text-red-500 text-sm">{imageErrors[subtaskId]}</p>}
      </>
    )}
  </div>
)}
        <div className="space-y-2">
  {inputType === 'multiple_choice' ? (
    options.map((option: string, i: number) => {
      const isOptionIncorrect = incorrectOptionsForSubtask.includes(option);
      return (
        <label key={i} className="flex items-center space-x-2">
          <input
            type="radio"
            name={`subtask-${subtaskId}`}
            value={option}
            checked={answers[subtaskId]?.answer === option}
            onChange={() => handleChange(subtaskId, option)}
            disabled={isCorrect === true}
            className={`accent-blue-600 ${isOptionIncorrect ? 'border-red-500 bg-red-100' : ''}`}
          />
          <span className={isOptionIncorrect ? 'text-red-600' : ''}>{option}</span>
        </label>
      );
    })
  ) : (
    <input
      type="text"
      value={answers[subtaskId]?.answer || ''}
      onChange={(e) => handleChange(subtaskId, e.target.value)}
      disabled={isCorrect === true}
      className="w-full border rounded px-3 py-2"
      placeholder="Введите ответ"
    />
  )}
  <p className="text-sm text-gray-500 mt-1">Попытки: {answers[subtaskId]?.attempts || 0}</p>
</div>

      </div>
      <div className="flex space-x-4">
        {currentSubtaskIndex < subtasks.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
          >
            Далее
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
          >
            {isSubmitting ? 'Отправка...' : 'Завершить тест'}
          </button>
        )}
      </div>
    </form>
  );
}



════════════════════════════════════════════════════════════════════════════════
║ frontend/src/shared/lib/utils.ts
════════════════════════════════════════════════════════════════════════════════

import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}