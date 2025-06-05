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
      <body className="flex flex-col min-h-screen">
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
      <header>
        <nav className="flex justify-between items-center p-4 bg-blue-600 text-white shadow-md">
          <Link href="/" className="text-xl font-bold">ProjectSchool</Link>
          <div className="space-x-4">
            <Link href="/courses" className="hover:underline">Курсы</Link>
            <Link href="/leaderboard" className="hover:underline">Лидерборд</Link>
            <Link href="/submissions" className="hover:underline">Мои решения</Link>
            <Link href="/profile" className="hover:underline">Профиль</Link>
            <Link href="/admin" className="hover:underline">Админка</Link>
            {token ? (
              <button onClick={logout} className="hover:underline">Выйти</button>
            ) : (
              <>
                <Link href="/auth/login" className="hover:underline">Войти</Link>
                <Link href="/auth/register" className="hover:underline">Регистрация</Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="flex-grow p-4">{children}</main>
      <footer className="p-4 bg-gray-800 text-white text-center">
        © 2025 ProjectSchool
      </footer>
    </>
  );
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/page.tsx
════════════════════════════════════════════════════════════════════════════════

// src/app/page.tsx
'use client';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="text-center max-w-4xl mx-auto mt-8">
      <h1 className="text-4xl font-bold mb-6">Добро пожаловать в ProjectSchool!</h1>
      <Card className="p-6">
        <p className="mb-4">Обучайтесь, выполняйте задания и соревнуйтесь в таблице лидеров!</p>
        <Link href="/courses">
          <Button>Перейти к курсам</Button>
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
	const load = async () => {
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
 
	load();
 }, [courseId]); // ✅ или [] если грузим один раз
 

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Таблица лидеров</h1>
      <Card className="p-6 mb-6">
        <div className="flex space-x-4">
          <Input
            type="number"
            placeholder="ID курса (опционально)"
            value={courseId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCourseId(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={fetchLeaderboard}>Показать</Button>
        </div>
      </Card>
      {isLoading && <div className="text-center">Загрузка...</div>}
      {error && <div className="text-red-500 text-center mb-4">{error}</div>}
      <Card className="p-6">
        {users.length === 0 && !isLoading ? (
          <p className="text-center">Нет данных</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">#</th>
                <th className="text-left p-2">Пользователь</th>
                <th className="text-left p-2">Баллы</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} className="border-b">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">{user.username}</td>
                  <td className="p-2">{user.points}</td>
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
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Курсы</h1>
      {(user?.role === 'teacher' || user?.role === 'admin') && (
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="mb-4">
          {showCreateForm ? 'Отменить' : 'Создать курс'}
        </Button>
      )}
      {showCreateForm && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleCreateCourse} className="space-y-4">
            {formError && <p className="text-red-500 text-sm">{formError}</p>}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Название курса
              </label>
              <Input
                id="title"
                placeholder="Название курса"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Описание
              </label>
              <Input
                id="description"
                placeholder="Описание"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
              />
            </div>
            <Button type="submit">Создать</Button>
          </form>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course: Course) => (
          <Card key={course.id} className="p-6">
            <Link href={`/courses/${course.id}`}>
              <h2 className="text-xl font-semibold hover:underline">{course.title}</h2>
            </Link>
            <p className="mt-2">{course.description}</p>
            <p className="mt-2">
              <strong>Преподаватель:</strong> {course.teacher.username}
            </p>
            <div className="mt-4 flex space-x-2">
              <EnrollButton courseId={course.id} />
              {user?.role === 'student' && (
                <Button
                  onClick={() => handleUnenroll(course.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Отменить запись
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
      {/* Пагинация */}
      {total && total > limit && (
        <div className="mt-4 flex justify-center space-x-2">
          <Button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200"
          >
            Предыдущая
          </Button>
          <span className="text-sm mt-2">
            Страница {page} из {totalPages}
          </span>
          <Button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200"
          >
            Следующая
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
  <div className="max-w-4xl mx-auto mt-8">
    <h1 className="text-3xl font-bold mb-6">{course.title}</h1>

    <Card className="p-6 mb-6">
      <p className="mb-2">{course.description}</p>
      <p>
        <strong>Преподаватель:</strong> {course.teacher.username}
      </p>
    </Card>

    {/* Статистика (для teacher и admin) */}
    {['teacher', 'admin'].includes(user?.role || '') && (
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">📈 Статистика курса</h2>
        {statsLoading ? (
          <div className="text-gray-500">Загрузка статистики...</div>
        ) : statsError ? (
          <div className="text-red-500">{statsError}</div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-600">Студентов на курсе</p>
              <p className="text-xl font-bold">{stats.students_count}</p>
            </div>
            <div className="bg-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-600">Средний балл</p>
              <p className="text-xl font-bold">{stats.average_grade.toFixed(2)}</p>
            </div>
            <div className="bg-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-600">Завершено заданий</p>
              <p className="text-xl font-bold">{stats.completion_rate.toFixed(1)}%</p>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">Нет данных о статистике</div>
        )}
      </Card>
    )}

    {/* Прогресс (для student) */}
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

    {/* Список заданий */}
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

    {/* Удаление курса (admin) */}
    {user?.role === 'admin' && (
      <Button
        variant="destructive"
        className="mt-4"
        onClick={async () => {
          if (confirm('Вы уверены, что хотите удалить этот курс?')) {
            try {
              await api.delete(`/courses/${courseId}`);
              toast.success('Курс успешно удалён');
              window.location.href = '/courses';
            } catch (err) {
              console.error('Ошибка при удалении курса:', err);
              toast.error('Ошибка при удалении курса');
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
  answers: { SubtaskID: number; Answer: string; IsCorrect: boolean }[];
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
        <Card className="p-6 mt-4">
          <h2 className="text-2xl font-semibold mb-4">Результаты теста</h2>
          <p>
            <strong>Оценка:</strong> {quizResult.grade.toFixed(1)}
          </p>
          <p>
            <strong>Баллы:</strong> {quizResult.totalScore.toFixed(1)}
          </p>
          <div className="mt-4">
            {quizResult.answers.map((answer, idx) => {
              const subtask = subtasks.find((st) => (st.id ?? st.ID) === answer.SubtaskID);
              return (
                <div key={idx} className="mb-2">
                  <p>
                    Вопрос {idx + 1}: {subtask?.question ?? subtask?.Question} —{' '}
                    {answer.IsCorrect ? '✅ Правильно' : '❌ Неправильно'}
                  </p>
                  <p>Ваш ответ: {answer.Answer}</p>
                </div>
              );
            })}
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
  type: z.string().optional(),
});

type FormData = z.infer<typeof assignmentSchema>;

interface Subtask {
  question: string;
  options: string[];
  answer: string;
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
  const [assignmentType, setAssignmentType] = useState('text');
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
    setSubtasks([...subtasks, { question: '', options: ['', '', '', ''], answer: '' }]);
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubtaskChange = (
    index: number,
    field: keyof Subtask,
    value: string | string[]
  ) => {
    const newSubtasks = [...subtasks];
    if (field === 'options' && Array.isArray(value)) {
      newSubtasks[index].options = value;
    } else if (field !== 'options' && typeof value === 'string') {
      if (field === 'answer') {
        // Проверка, что ответ входит в варианты
        if (value && !newSubtasks[index].options.includes(value)) {
          toast.error('Правильный ответ должен быть одним из вариантов');
          return;
        }
      }
      newSubtasks[index][field] = value;
    }
    setSubtasks(newSubtasks);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        // Валидация подзаданий
        if (subtasks.length === 0) {
          setError('Тест должен содержать хотя бы одно подзадание');
          toast.error('Тест должен содержать хотя бы одно подзадание');
          return;
        }
        for (const subtask of subtasks) {
          if (!subtask.question) {
            setError('Все вопросы должны быть заполнены');
            toast.error('Все вопросы должны быть заполнены');
            return;
          }
          if (subtask.options.filter(opt => opt.trim()).length < 2) {
            setError('Каждое подзадание должно иметь минимум 2 непустых варианта ответа');
            toast.error('Каждое подзадание должно иметь минимум 2 непустых варианта ответа');
            return;
          }
          if (!subtask.answer) {
            setError('Все подзадания должны иметь правильный ответ');
            toast.error('Все подзадания должны иметь правильный ответ');
            return;
          }
        }

        const normalizedSubtasks = subtasks.map((subtask, index) => ({
          Question: subtask.question,
          Options: subtask.options,
          Answer: subtask.answer,
          SortOrder: index + 1,
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
      const errorMessage = axiosError.response?.data?.error || 'Ошибка создания задания';
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
              onChange={(e) => setAssignmentType(e.target.value)}
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
                    onChange={(e) => handleSubtaskChange(idx, 'question', e.target.value)}
                    className="mb-2"
                  />
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
                    />
                  ))}
                  <label className="block mb-2">Правильный ответ</label>
                  <Input
                    value={subtask.answer}
                    onChange={(e) => handleSubtaskChange(idx, 'answer', e.target.value)}
                  />
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
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Уведомления</h1>
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card className="p-6">
            <p className="text-center">Нет уведомлений</p>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id} className="p-6 flex justify-between items-center">
              <div>
                <p className={notification.is_read ? 'text-gray-500' : 'font-semibold'}>
                  {notification.message}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
              {!notification.is_read && (
                <Button
                  onClick={() => markAsRead(notification.id)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Пометить как прочитанное
                </Button>
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
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Мои решения</h1>
      <Card className="p-6">
        {submissions.length === 0 ? (
          <p className="text-center">Решения отсутствуют</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Задание</th>
                <th className="text-left p-2">Курс</th>
                <th className="text-left p-2">Оценка</th>
                <th className="text-left p-2">Дата отправки</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission: Submission) => (
                <tr key={submission.id} className="border-b">
                  <td className="p-2">
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
                  <td className="p-2">{submission.course_title}</td>
                  <td className="p-2">
                    {submission.score > 0 ? submission.score.toFixed(2) : 'Не оценено'}
                  </td>
                  <td className="p-2">
                    {submission.submitted_at
                      ? format(parseISO(submission.submitted_at), 'dd.MM.yyyy HH:mm')
                      : 'Не указано'}
                  </td>
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
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Регистрация</h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
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
            <Input
              id="classNumber"
              type="number"
              value={classNumber}
              onChange={(e) => setClassNumber(e.target.value)}
              required
            />
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
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Вход</h1>
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
      await refetch(); // ✅ без reload
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
    <div className="max-w-2xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Профиль</h1>
      <Card className="p-6">
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit">Сохранить</Button>
              <Button
                onClick={() => setIsEditing(false)}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Отмена
              </Button>
            </div>
          </form>
        ) : (
          <>
            <p className="mb-2">
              <strong>Имя:</strong> {user.username}
            </p>
            <p className="mb-2">
              <strong>Email:</strong> {user.email}
            </p>
            <p className="mb-2">
              <strong>Роль:</strong> {user.role}
            </p>
            {user.role === 'student' && (
              <p className="mb-2">
                <strong>Класс:</strong> {user.class_number}
              </p>
            )}
            <p className="mb-4">
              <strong>Баллы:</strong> {user.points}
            </p>
            <Button onClick={() => setIsEditing(true)}>Редактировать профиль</Button>
          </>
        )}
      </Card>
		<div className="mt-6">
  <Link href="/achievements">
    <Button>Мои достижения 🏆</Button>
  </Link>
</div>

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
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Мои достижения</h1>
      {achievements.length === 0 ? (
        <p className="text-gray-500">Вы ещё не получили ни одного достижения.</p>
      ) : (
        <div className="space-y-4">
          {achievements.map((ach, index) => (
            <Card key={index} className="p-4">
              <h2 className="text-xl font-semibold">{ach.title}</h2>
              <p className="text-gray-700">{ach.description}</p>
              <p className="text-sm text-gray-400">Получено: {new Date(ach.awarded_at).toLocaleString()}</p>
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
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Админ-панель</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Управление пользователями</h2>
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium mb-1">
              ID пользователя
            </label>
            <Input
              id="userId"
              type="number"
              value={userId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserId(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1">
              Роль
            </label>
            <Input
              id="role"
              value={role}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRole(e.target.value)}
              placeholder="student, teacher, admin"
              required
            />
          </div>
          <Button type="submit">Изменить роль</Button>
        </form>
        <h3 className="text-lg font-semibold mt-6 mb-2">Список пользователей</h3>
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id}>
              {u.username} (ID: {u.id}, Роль: {u.role})
            </li>
          ))}
        </ul>
      </Card>
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Управление курсами</h2>
        <h3 className="text-lg font-semibold mb-2">Список курсов</h3>
        <ul className="space-y-2">
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

// src/shared/ui/Input.tsx
import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Input({ className = '', ...props }: InputProps) {
  return <input className={`border p-2 rounded w-full ${className}`} {...props} />;
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/shared/ui/Button.tsx
════════════════════════════════════════════════════════════════════════════════

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant?: 'default' | 'outline' | 'destructive';
  children?: ReactNode; // ⬅ Явно добавлено
}

export function Button({ children, className = '', variant = 'default', ...props }: ButtonProps) {
  const variantStyles = {
    default: 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700',
    outline: 'border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-100',
    destructive: 'bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700',
  };
  return (
    <button
      className={`${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children ?? 'Default Button'} {/* ⬅ Защита от undefined */}
    </button>
  );
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/shared/ui/Card.tsx
════════════════════════════════════════════════════════════════════════════════

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string; // Добавляем пропс title
}

export function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`bg-white p-4 rounded shadow ${className}`}>
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
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
  answers: { SubtaskID: number; Answer: string; IsCorrect: boolean }[];
}

interface QuizFormProps {
  assignmentId: number;
  subtasks: Subtask[];
  onSubmit: (result: QuizResult) => void;
}

export function QuizForm({ assignmentId, subtasks, onSubmit }: QuizFormProps) {
  const [answers, setAnswers] = useState<Record<number, { answer: string; attempts: number }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('QuizForm props:', { assignmentId, subtasks });

  // Инициализация попыток из localStorage
  useEffect(() => {
    const initialAnswers: Record<number, { answer: string; attempts: number }> = {};
    subtasks.forEach((subtask) => {
      const subtaskId = subtask.id ?? subtask.ID ?? 0;
      const stored = localStorage.getItem(`quiz_${assignmentId}_${subtaskId}`);
      const attempts = stored ? JSON.parse(stored).attempts || 1 : 1;
      initialAnswers[subtaskId] = { answer: '', attempts };
    });
    setAnswers(initialAnswers);
  }, [assignmentId, subtasks]);

  if (!Array.isArray(subtasks) || subtasks.length === 0) {
    console.warn('QuizForm: subtasks is empty or not an array');
    return <div>Нет вопросов для квиза</div>;
  }

  const handleChange = (subtaskId: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [subtaskId]: {
        answer,
        attempts: prev[subtaskId].attempts,
      },
    }));
    // Увеличиваем попытки при новом ответе
    localStorage.setItem(
      `quiz_${assignmentId}_${subtaskId}`,
      JSON.stringify({ attempts: (answers[subtaskId]?.attempts || 1) + 1 })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = subtasks.map((subtask) => {
      const subtaskId = subtask.id ?? subtask.ID ?? 0;
      return {
        SubtaskID: subtaskId,
        Answer: answers[subtaskId]?.answer || '',
        Attempts: answers[subtaskId]?.attempts || 1,
      };
    });

    if (payload.some((ans) => ans.Answer === '')) {
      toast.error('Пожалуйста, ответьте на все вопросы');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post(`/assignments/${assignmentId}/submit-quiz`, { answers: payload });
      toast.success('Ответы отправлены!');
      onSubmit(response.data);
      // Очищаем localStorage после успешной отправки
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {subtasks.map((subtask, idx) => {
        const options = Array.isArray(subtask.options)
          ? subtask.options
          : Array.isArray(subtask.Options)
          ? subtask.Options
          : [];
        const question = subtask.question ?? subtask.Question ?? 'Вопрос отсутствует';
        const subtaskId = subtask.id ?? subtask.ID ?? 0;

        if (!options.length) {
  console.error(`Subtask ${subtaskId} has invalid options:`, subtask);
  return (
    <div key={subtaskId} className="text-red-500">
      Ошибка: некорректные варианты ответа для вопроса &apos;{question}&apos;
    </div>
  );
}

        return (
          <div key={subtaskId}>
            <p className="font-medium mb-2">{idx + 1}. {question}</p>
            <div className="space-y-1">
              {options.map((option, i) => (
                <label key={i} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`subtask-${subtaskId}`}
                    value={option}
                    checked={answers[subtaskId]?.answer === option}
                    onChange={() => handleChange(subtaskId, option)}
                    className="accent-blue-600"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
      >
        {isSubmitting ? 'Отправка...' : 'Отправить тест'}
      </button>
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