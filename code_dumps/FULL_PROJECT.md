🚀 ПОЛНАЯ СТРУКТУРА ПРОЕКТА 🚀

================================================================================
🎨 FRONTEND ЧАСТЬ
================================================================================

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
│   ├── avatars
│   │   ├── 1f803cd5-763c-484c-8db9-8a9e80e22f53.jpg
│   │   ├── 2467d09c-b0a6-46c9-9c01-eb2cbc29dd85.jpg
│   │   ├── 27258a85-1e4c-4ab9-b51e-ca6d8ad2e101.jpg
│   │   ├── 2aa12d4d-321f-4c58-a46b-bfa0f79022b4.jpg
│   │   ├── 2b1fa314-f37e-439e-be23-681b9cf2bd3e.jpg
│   │   ├── 3-Постановление-Минтруда-№-13.docx
│   │   ├── 4eda9fdf-8d86-473f-8364-34a7c1caefea.jpg
│   │   ├── b9341e90-4e5c-4591-8a32-deff4d30c2af.jpg
│   │   ├── c9d8ddeb-1b87-4451-9408-ad9672cdf889.jpg
│   │   └── d127a649-3bf3-45d0-b110-c1666c38b470.jpg
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
│   │   │   ├── components
│   │   │   │   ├── AchievementManagement.tsx
│   │   │   │   ├── ActionLogs.tsx
│   │   │   │   ├── CreateUserForm.tsx
│   │   │   │   └── UserRoleForm.tsx
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
│   │   │   │   ├── page.tsx
│   │   │   │   └── submissions
│   │   │   │       └── page.tsx
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
║ frontend/src/entities/course/model.ts
════════════════════════════════════════════════════════════════════════════════

export interface Course {
  id: number;
  title: string;
  description: string;
  subject: string;
  class_number: number;
  teacher: {
    id: number;
    username: string;
  };
  created_at: string;
  updated_at: string;
  assignments?: {
    id: number;
    title: string;
    description: string;
    max_score: number;
    due_date: string;
  }[];
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

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string; // Добавляем ФИО
  role: 'student' | 'teacher' | 'admin';
  class_number?: number;
  points: number;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
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
import { useState, useEffect } from 'react';
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
  subject: string;
  class_number: number;
  teacher: { username: string };
}

interface ErrorResponse {
  error?: string;
}

export default function CoursesPage() {
  const { user } = useUser();
  const [selectedClassNumber, setSelectedClassNumber] = useState<number | undefined>(undefined);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const { courses, loading: isLoading, refetch, error, total } = useCourses(6, 0, selectedClassNumber);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [classNumber, setClassNumber] = useState('');
  const [formError, setFormError] = useState('');
  const [page, setPage] = useState(1);
  const limit = 6;

  // Устанавливаем начальный класс для студентов
  useEffect(() => {
    if (user?.role === 'student' && user?.class_number && selectedClassNumber === undefined) {
      setSelectedClassNumber(user.class_number);
    }
  }, [user?.class_number, user?.role]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/courses', {
        title,
        description,
        subject,
        class_number: parseInt(classNumber),
      });
      await refetch(limit, (page - 1) * limit, selectedClassNumber);
      setShowCreateForm(false);
      setTitle('');
      setDescription('');
      setSubject('');
      setClassNumber('');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setFormError(axiosError.response?.data?.error || 'Ошибка создания курса');
    }
  };

  const handleUnenroll = async (courseId: number) => {
    try {
      await api.delete(`/courses/${courseId}/enroll`);
      await refetch(limit, (page - 1) * limit, selectedClassNumber);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      alert(axiosError.response?.data?.error || 'Ошибка отмены записи');
    }
  };

  const handlePageChange = (newPage: number) => {
    const newOffset = (newPage - 1) * limit;
    if (newOffset < 0 || (total && newOffset >= total)) return;
    setPage(newPage);
    refetch(limit, newOffset, selectedClassNumber);
  };

  const subjects = [
    'Математика',
    'Русский язык',
    'Физика',
    'Химия',
    'Литература',
    'Биология',
    'История',
  ];

  // Фильтруем курсы по предмету
  const filteredCourses = courses.filter((course) => !selectedSubject || course.subject === selectedSubject);

  // Формируем сообщение, если курсов нет
  let noCoursesMessage = '';
  if (!isLoading && filteredCourses.length === 0) {
    if (selectedClassNumber && selectedSubject) {
      noCoursesMessage = `Нет курсов для ${selectedClassNumber}-го класса по предмету "${selectedSubject}".`;
    } else if (selectedClassNumber) {
      noCoursesMessage = `Нет курсов для ${selectedClassNumber}-го класса.`;
    } else if (selectedSubject) {
      noCoursesMessage = `Нет курсов по предмету "${selectedSubject}".`;
    } else {
      noCoursesMessage = 'Курсы отсутствуют.';
    }
  }

  if (isLoading) return <div className="text-center mt-8">Загрузка...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Ошибка: {error}</div>;

  const totalPages = total ? Math.ceil(total / limit) : 1;

  return (
    <div className="max-w-5xl mx-auto mt-12 px-4">
      <h1 className="text-4xl font-extrabold text-blue-600 text-center mb-8">📚 Курсы</h1>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div>
          <label htmlFor="classNumberFilter" className="block text-sm font-medium mb-1">Фильтр по классу</label>
          <select
            id="classNumberFilter"
            value={selectedClassNumber ?? ''}
            onChange={(e) => setSelectedClassNumber(e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full max-w-xs rounded border p-2 focus:outline-none focus:ring-blue-600"
          >
            <option value="">Все классы</option>
            {[...Array(11)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="subjectFilter" className="block text-sm font-medium mb-1">Фильтр по предмету</label>
          <select
            id="subjectFilter"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full max-w-xs rounded border p-2 focus:outline-none focus:ring-blue-600"
          >
            <option value="">Все предметы</option>
            {subjects.map((subj) => (
              <option key={subj} value={subj}>{subj}</option>
            ))}
          </select>
        </div>
      </div>

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
              <label htmlFor="subject" className="block text-sm font-medium mb-1">Предмет</label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full rounded border p-2 focus:outline-none focus:ring-blue-600"
              >
                <option value="">Выберите предмет</option>
                {subjects.map((subj) => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="classNumber" className="block text-sm font-medium mb-1">Класс</label>
              <Input
                id="classNumber"
                type="number"
                min="1"
                max="11"
                value={classNumber}
                onChange={(e) => setClassNumber(e.target.value)}
                required
                placeholder="Введите номер класса (1-11)"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">Описание</label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Введите описание" />
            </div>
            <Button type="submit" className="w-full">Создать курс</Button>
          </form>
        </Card>
      )}

      {noCoursesMessage ? (
        <p className="text-center text-gray-500 mt-8">{noCoursesMessage}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredCourses.map((course: Course) => (
            <Card key={course.id} className="p-6 flex flex-col justify-between">
              <div>
                <Link href={`/courses/${course.id}`}>
                  <h2 className="text-xl font-bold text-blue-700 hover:underline mb-2">{course.title}</h2>
                </Link>
                <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                <p className="text-sm text-gray-400 mb-2">
                  <strong>Предмет:</strong> {course.subject}
                </p>
                <p className="text-sm text-gray-400 mb-2">
                  <strong>Класс:</strong> {course.class_number}
                </p>
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


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/courses/[id]/submissions/page.tsx
════════════════════════════════════════════════════════════════════════════════

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
  if (isNaN(grade) || grade < 0 || grade > 5) {
    toast.error('Оценка должна быть от 0 до 5');
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
    return <div className="text-center mt-8 text-red-500">Доступ запрещён</div>;
  }

  if (isLoading) return <div className="text-center mt-8">Загрузка...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Ошибка: {error}</div>;

  return (
    <div className="max-w-5xl mx-auto mt-12 px-4">
      <h1 className="text-4xl font-extrabold text-blue-600 text-center mb-8">📝 Решения студентов</h1>
      <Card>
        {submissions.length === 0 ? (
          <p className="text-center text-gray-500">Решений нет</p>
        ) : (
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-gray-600 text-gray-500 uppercase">
                <th className="py-2 px-3">Студент</th>
                <th className="py-2 px-3">Задание</th>
                <th className="py-2 px-3">Решение</th>
                <th className="py-2 px-3">Оценка</th>
                <th className="py-2 px-3">Дата</th>
                <th className="py-2 px-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
  <tr key={submission.id} className="...">
    <td className="py-2 px-3">{submission.username}</td>
    <td className="py-2 px-3">{submission.assignment_title}</td>
    <td className="py-2 px-3 truncate max-w-xs">{submission.content}</td>
    <td className="py-2 px-3">
      <Input
        type="number"
        step="0.1"
        min="0"
        max="5"
        value={gradeInputs[submission.id] ?? submission.score.toString()}
        onChange={(e) => handleGradeChange(submission.id, e.target.value)}
        className="w-16"
      />
    </td>
    <td className="py-2 px-3">{new Date(submission.submitted_at).toLocaleString()}</td>
    <td className="py-2 px-3">
      <Button onClick={() => handleSetGrade(submission.id)}>Сохранить</Button>
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
    newSubtasks[index].options = value.map(opt => opt.trimEnd()); // Убираем пробелы с конца
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
        newSubtasks[index].question = value.trimEnd(); // Убираем пробелы с конца
        break;
      case 'answer':
        if (newSubtasks[index].inputType === 'multiple_choice') {
          const normalizedOptions = newSubtasks[index].options.map(opt => opt.trimEnd());
          if (value && !normalizedOptions.includes(value.trimEnd())) {
            toast.error('Правильный ответ должен быть одним из вариантов');
            return;
          }
        }
        newSubtasks[index].answer = value.trimEnd(); // Убираем пробелы с конца
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
    formData.append('title', data.title.trimEnd()); // Убираем пробелы с конца
    if (data.description) formData.append('description', data.description.trimEnd()); // Убираем пробелы с конца
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
          toast.error(`Подзадание ${index + 1} должен иметь правильный ответ`);
          return;
        }
        if (subtask.image) {
          formData.append(`subtask_image_${index}`, subtask.image);
        }
      }

      const normalizedSubtasks = subtasks.map((subtask, index) => ({
        Question: subtask.question.trimEnd(), // Убираем пробелы с конца
        Options: subtask.inputType === 'multiple_choice' ? subtask.options.map(opt => opt.trimEnd()) : [], // Убираем пробелы
        Answer: subtask.answer.trimEnd(), // Убираем пробелы с конца
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
  const [fullName, setFullName] = useState(''); // Добавляем ФИО
  const [password, setPassword] = useState('');
  const [classNumber, setClassNumber] = useState('');
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
    if (!fullName.trim()) {
      setError('ФИО обязательно для заполнения');
      return;
    }

    try {
      const res = await api.post('/register', {
        email,
        username,
        full_name: fullName, // Добавляем ФИО
        password,
        role: 'student',
        class_number: classNumInt,
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
            <label htmlFor="fullName" className="block text-sm font-medium mb-1">ФИО</label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
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
  const [fullName, setFullName] = useState(''); // Добавляем ФИО
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setFullName(user.full_name || ''); // Устанавливаем ФИО
    }
  }, [user]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    try {
      await api.put('/users/me', { username, email, full_name: fullName }); // Добавляем ФИО
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
              <label htmlFor="fullName" className="block text-sm font-medium mb-1">
                ФИО
              </label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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
            {user.full_name && <p><strong>ФИО:</strong> {user.full_name}</p>} {/* Отображаем ФИО */}
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

// frontend/src/app/admin/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@/entities/user/hook';
import { UserRoleForm } from './components/UserRoleForm';
import { CreateUserForm } from './components/CreateUserForm';
import { AchievementManagement } from './components/AchievementManagement';
import { ActionLogs } from './components/ActionLogs';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface ApiAchievement {
  ID: number;
  Title: string;
  Description: string;
  Condition: string;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  condition: string;
}

interface LogEntry {
  id: number;
  user_id: number;
  action: string;
  details: string;
  created_at: string;
}

interface ErrorResponse {
  error?: string;
}

export default function AdminPage() {
  const { user, isLoading } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    try {
      const [usersRes, achRes, logRes] = await Promise.all([
        api.get<User[]>('/users'),
        api.get<ApiAchievement[]>('/achievements'),
        api.get<{ logs: LogEntry[]; total: number }>('/admin/logs'),
      ]);
      const transformedAchievements = achRes.data.map((ach) => ({
        id: ach.ID,
        title: ach.Title,
        description: ach.Description,
        condition: ach.Condition,
      }));
      setUsers(usersRes.data || []);
      setAchievements(transformedAchievements || []);
      setLogs(logRes.data.logs || []);
      setFormError('');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setFormError(axiosError.response?.data?.error || 'Ошибка загрузки данных');
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
      {formError && <p className="text-red-500 text-sm mb-4 text-center">{formError}</p>}

      <UserRoleForm onSuccess={fetchData} setFormError={setFormError} />
      <CreateUserForm onSuccess={fetchData} setFormError={setFormError} />
      <AchievementManagement
        achievements={achievements}
        onSuccess={fetchData}
        setFormError={setFormError}
      />
      <ActionLogs logs={logs} />
    </div>
  );
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/admin/components/UserRoleForm.tsx
════════════════════════════════════════════════════════════════════════════════

// frontend/src/app/admin/components/UserRoleForm.tsx
'use client';
import { useState, FormEvent } from 'react';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';

interface ErrorResponse {
  error?: string;
}

interface UserRoleFormProps {
  onSuccess: () => void;
  setFormError: (error: string) => void;
}

export function UserRoleForm({ onSuccess, setFormError }: UserRoleFormProps) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('');

  const handleUpdateRole = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/users/${userId}/role`, { role });
      onSuccess();
      setUserId('');
      setRole('');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setFormError(axiosError.response?.data?.error || 'Ошибка изменения роли');
    }
  };

  return (
    <Card className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Изменить роль пользователя</h2>
      <form onSubmit={handleUpdateRole} className="grid gap-4 sm:grid-cols-2">
        <Input
          type="number"
          placeholder="ID пользователя"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        />
        <Input
          placeholder="student / teacher / admin"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        />
        <Button type="submit" className="sm:col-span-2">
          Изменить
        </Button>
      </form>
    </Card>
  );
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/admin/components/ActionLogs.tsx
════════════════════════════════════════════════════════════════════════════════

// frontend/src/app/admin/components/ActionLogs.tsx
'use client';
import { Card } from '@/shared/ui/Card';

interface LogEntry {
  id: number;
  user_id: number;
  action: string;
  details: string;
  created_at: string;
}

interface ActionLogsProps {
  logs: LogEntry[];
}

export function ActionLogs({ logs }: ActionLogsProps) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">Действия пользователей</h2>
      {logs.length === 0 ? (
        <p className="text-sm text-gray-500">Нет логов</p>
      ) : (
        <ul className="text-sm space-y-2 max-h-80 overflow-y-auto">
          {logs.map((log) => (
            <li key={log.id}>
              <span className="font-medium">Пользователь {log.user_id}:</span>{' '}
              {log.action} ({log.details}){' '}
              <span className="text-gray-500 text-xs">
                ({new Date(log.created_at).toLocaleString()})
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/admin/components/AchievementManagement.tsx
════════════════════════════════════════════════════════════════════════════════

// frontend/src/app/admin/components/AchievementManagement.tsx
'use client';
import { useState, FormEvent } from 'react';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

interface Achievement {
  id: number;
  title: string;
  description: string;
  condition: string;
}

interface ErrorResponse {
  error?: string;
}

interface AchievementManagementProps {
  achievements: Achievement[];
  onSuccess: () => void;
  setFormError: (error: string) => void;
}

export function AchievementManagement({
  achievements,
  onSuccess,
  setFormError,
}: AchievementManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [editAchievement, setEditAchievement] = useState<Achievement | null>(null);
  const [achTitle, setAchTitle] = useState('');
  const [achDesc, setAchDesc] = useState('');
  const [achCondition, setAchCondition] = useState('');

  const conditionOptions = [
    { value: 'points_50', label: 'Набрать 50 очков' },
    { value: 'points_100', label: 'Набрать 100 очков' },
    { value: 'points_500', label: 'Набрать 500 очков' },
    { value: 'courses_1', label: 'Завершить 1 курс' },
    { value: 'courses_3', label: 'Записаться на 3 курса' },
    { value: 'submissions_5', label: 'Сдать 5 заданий' },
    { value: 'custom', label: 'Произвольное' },
  ];

  const handleCreateOrUpdateAchievement = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: achTitle,
        description: achDesc,
        condition: achCondition || 'custom',
      };
      if (editAchievement) {
        await api.put(`/achievements/${editAchievement.id}`, payload);
        toast.success('Достижение обновлено');
      } else {
        await api.post('/achievements', payload);
        toast.success('Достижение создано');
      }
      onSuccess();
      resetForm();
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Ошибка при сохранении достижения';
      setFormError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleEdit = (achievement: Achievement) => {
    setEditAchievement(achievement);
    setAchTitle(achievement.title);
    setAchDesc(achievement.description);
    setAchCondition(achievement.condition);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить достижение?')) return;
    try {
      await api.delete(`/achievements/${id}`);
      toast.success('Достижение удалено');
      onSuccess();
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Ошибка при удалении достижения';
      setFormError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditAchievement(null);
    setAchTitle('');
    setAchDesc('');
    setAchCondition('');
  };

  return (
    <Card className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Управление достижениями</h2>
      <Button onClick={() => setShowForm(!showForm)} className="mb-4">
        {showForm ? 'Отменить' : 'Добавить достижение'}
      </Button>
      {showForm && (
        <form onSubmit={handleCreateOrUpdateAchievement} className="grid gap-4 mb-6">
          <Input
            placeholder="Название"
            value={achTitle}
            onChange={(e) => setAchTitle(e.target.value)}
            required
          />
          <Input
            placeholder="Описание"
            value={achDesc}
            onChange={(e) => setAchDesc(e.target.value)}
            required
          />
          <select
            value={achCondition}
            onChange={(e) => setAchCondition(e.target.value)}
            className="p-2 border rounded-md text-sm"
            required
          >
            <option value="">Выберите условие</option>
            {conditionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Button type="submit">{editAchievement ? 'Обновить' : 'Добавить'}</Button>
        </form>
      )}
      <div>
        <h3 className="font-semibold mb-2">Существующие достижения:</h3>
        {achievements.length === 0 ? (
          <p className="text-sm text-gray-500">Нет достижений</p>
        ) : (
          <ul className="text-sm space-y-2">
            {achievements.map((ach) => (
              <li key={ach.id} className="flex justify-between items-center">
                <span>
                  {ach.title} — {ach.description} ({ach.condition})
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(ach)}
                    className="bg-blue-600 text-white text-xs px-2 py-1"
                  >
                    Редактировать
                  </Button>
                  <Button
                    onClick={() => handleDelete(ach.id)}
                    className="bg-red-600 text-white text-xs px-2 py-1"
                  >
                    Удалить
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/admin/components/CreateUserForm.tsx
════════════════════════════════════════════════════════════════════════════════

// frontend/src/app/admin/components/CreateUserForm.tsx
'use client';
import { useState, FormEvent } from 'react';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';

interface ErrorResponse {
  error?: string;
}

interface CreateUserFormProps {
  onSuccess: () => void;
  setFormError: (error: string) => void;
}

export function CreateUserForm({ onSuccess, setFormError }: CreateUserFormProps) {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('teacher');

  const handleRegisterUser = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/create-user', {
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });
      onSuccess();
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('teacher');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setFormError(axiosError.response?.data?.error || 'Ошибка регистрации');
    }
  };

  return (
    <Card className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Создать нового пользователя</h2>
      <form onSubmit={handleRegisterUser} className="grid gap-4 sm:grid-cols-2">
        <Input
          type="email"
          placeholder="Email"
          value={newUserEmail}
          onChange={(e) => setNewUserEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Пароль"
          value={newUserPassword}
          onChange={(e) => setNewUserPassword(e.target.value)}
          required
        />
        <select
          value={newUserRole}
          onChange={(e) => setNewUserRole(e.target.value)}
          className="p-2 border rounded sm:col-span-2"
        >
          <option value="teacher">Преподаватель</option>
          <option value="admin">Администратор</option>
        </select>
        <Button type="submit" className="sm:col-span-2">
          Создать
        </Button>
      </form>
    </Card>
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
import { useUser } from '@/entities/user/hook';

interface Course {
  id: number;
  title: string;
  description: string;
  subject: string;
  class_number: number;
  teacher: { username: string };
}

interface UseCoursesResult {
  courses: Course[];
  loading: boolean;
  error: string | null;
  refetch: (limit?: number, offset?: number, classNumber?: number) => Promise<void>;
  total: number;
}

export function useCourses(limit: number = 6, offset: number = 0, classNumber?: number): UseCoursesResult {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const { user } = useUser();

  const fetchCourses = async (newLimit?: number, newOffset?: number, newClassNumber?: number) => {
    setLoading(true);
    try {
      const params: any = {
        limit: newLimit || limit,
        offset: newOffset || offset,
      };
      // Отправляем class_number, если он указан (включая undefined для "Все классы")
      if (newClassNumber !== undefined) {
        params.class_number = newClassNumber;
      }
      console.log('Fetching courses with params:', params); // Для отладки
      const response = await api.get('/courses', { params });
      setCourses(response.data.courses);
      setTotal(response.data.total);
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
    // Используем classNumber из пропса, если он есть, иначе user.class_number для студентов
    const initialClassNumber = classNumber !== undefined ? classNumber : (user?.role === 'student' && user?.class_number ? user.class_number : undefined);
    fetchCourses(limit, offset, initialClassNumber);
  }, [limit, offset, classNumber, user?.id]);

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
  const [currentSubtaskIndex, setCurrentSubtaskIndex] = useState(0);
  const [tempAnswer, setTempAnswer] = useState<Record<number, string>>({}); // Временный ответ для текстовых подзаданий
  const [skipped, setSkipped] = useState<Record<number, boolean>>({}); // Флаг пропуска подзадания

  console.log('QuizForm props:', { assignmentId, subtasks });
  console.log('Normalized subtasks in QuizForm:', subtasks);

  // Инициализация состояния
  useEffect(() => {
    // Временная очистка localStorage
    subtasks.forEach((subtask) => {
      const subtaskId = subtask.id ?? subtask.ID ?? 0;
      localStorage.removeItem(`quiz_${assignmentId}_${subtaskId}`);
    });

    const initialAnswers: Record<number, { answer: string; attempts: number; isCorrect?: boolean }> = {};
    const initialIncorrectOptions: Record<number, string[]> = {};
    const initialTempAnswers: Record<number, string> = {};
    subtasks.forEach((subtask) => {
      const subtaskId = subtask.id ?? subtask.ID ?? 0;
      const stored = localStorage.getItem(`quiz_${assignmentId}_${subtaskId}`);
      const data = stored ? JSON.parse(stored) : { attempts: 0, incorrectOptions: [] };
      initialAnswers[subtaskId] = { answer: '', attempts: data.attempts || 0, isCorrect: undefined };
      initialIncorrectOptions[subtaskId] = data.incorrectOptions || [];
      initialTempAnswers[subtaskId] = '';
    });
    setAnswers(initialAnswers);
    setIncorrectOptions(initialIncorrectOptions);
    setTempAnswer(initialTempAnswers);

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
    const normalizedAnswer = answer.trimEnd(); // Убираем пробелы с конца

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

  const handleConfirmTextAnswer = async (subtaskId: number) => {
    const normalizedAnswer = tempAnswer[subtaskId]?.trimEnd() || '';
    if (!normalizedAnswer) {
      toast.error('Введите ответ перед подтверждением');
      return;
    }

    if (answers[subtaskId].attempts >= 3) {
      toast.error('Достигнуто максимальное количество попыток (3)');
      return;
    }

    await handleChange(subtaskId, normalizedAnswer);
  };

  const handleSkip = (subtaskId: number) => {
    setSkipped((prev) => ({ ...prev, [subtaskId]: true }));
    setAnswers((prev) => ({
      ...prev,
      [subtaskId]: {
        ...prev[subtaskId],
        answer: '',
        attempts: prev[subtaskId].attempts,
        isCorrect: false,
      },
    }));
    toast.info('Подзадание пропущено');
    handleNext();
  };

  const handleNext = () => {
    const subtaskId = subtasks[currentSubtaskIndex].id ?? subtasks[currentSubtaskIndex].ID ?? 0;
    const inputType = subtasks[currentSubtaskIndex].input_type ?? subtasks[currentSubtaskIndex].InputType ?? 'multiple_choice';
    
    if (inputType === 'multiple_choice' && !answers[subtaskId]?.answer && !skipped[subtaskId]) {
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
    const inputType = subtasks[currentSubtaskIndex].input_type ?? subtasks[currentSubtaskIndex].InputType ?? 'multiple_choice';

    if (inputType === 'multiple_choice' && !answers[subtaskId]?.answer && !skipped[subtaskId]) {
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

  if (!currentSubtask || !subtaskId) {
    console.error('Invalid subtask data:', currentSubtask);
    return (
      <div className="text-red-500">
        Ошибка: некорректные данные вопроса. Обратитесь к преподавателю.
      </div>
    );
  }

  if (inputType === 'multiple_choice' && !options.length) {
    console.error(`Subtask ${subtaskId} has invalid options:`, currentSubtask);
    return (
      <div className="text-red-500">
        Ошибка: отсутствуют варианты ответа для вопроса (ID: {subtaskId}). Обратитесь к преподавателю.
      </div>
    );
  }

  const isCorrect = answers[subtaskId]?.isCorrect;
  const incorrectOptionsForSubtask = incorrectOptions[subtaskId] || [];
  const attempts = answers[subtaskId]?.attempts || 0;

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
            <>
              <input
                type="text"
                value={tempAnswer[subtaskId] || ''}
                onChange={(e) => setTempAnswer((prev) => ({ ...prev, [subtaskId]: e.target.value }))}
                disabled={isCorrect === true || attempts >= 3 || skipped[subtaskId]}
                className="w-full border rounded px-3 py-2"
                placeholder="Введите ответ"
              />
              {!isCorrect && attempts < 3 && !skipped[subtaskId] && (
                <div className="flex space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleConfirmTextAnswer(subtaskId)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-400"
                  >
                    Подтвердить ответ
                  </button>
                  {attempts > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSkip(subtaskId)}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg"
                    >
                      Пропустить
                    </button>
                  )}
                </div>
              )}
            </>
          )}
          <p className="text-sm text-gray-500 mt-1">Попытки: {attempts}{inputType === 'text_input' ? ' / 3' : ''}</p>
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

================================================================================
⚙️ BACKEND ЧАСТЬ
================================================================================

================================================================================
ФАЙЛОВАЯ СТРУКТУРА
================================================================================
backend/
├── check_password.go
├── cmd
│   └── main.go
├── config
│   └── config.go
├── go.mod
├── go.sum
├── internal
│   ├── db
│   │   └── postgres.go
│   ├── error
│   │   └── error.go
│   ├── handler
│   │   ├── achievement.go
│   │   ├── action_log.go
│   │   ├── assignment.go
│   │   ├── auth.go
│   │   ├── course.go
│   │   ├── leaderboard.go
│   │   ├── middleware.go
│   │   ├── notification.go
│   │   ├── submission.go
│   │   ├── testutil.go
│   │   └── user.go
│   ├── jwt
│   │   └── jwt.go
│   ├── logger
│   │   └── logger.go
│   ├── middleware
│   │   └── ratelimit.go
│   ├── model
│   │   ├── action_log.go
│   │   ├── assignment.go
│   │   ├── course.go
│   │   ├── enrollment.go
│   │   ├── global_achievement.go
│   │   ├── notification.go
│   │   ├── submission.go
│   │   ├── subtask.go
│   │   ├── subtask_submission.go
│   │   ├── user.go
│   │   └── user_achievement.go
│   ├── repository
│   │   ├── action_log.go
│   │   ├── assignment.go
│   │   ├── course.go
│   │   ├── notification.go
│   │   ├── submission.go
│   │   └── user.go
│   └── service
│       ├── achievement.go
│       ├── action_log.go
│       ├── assignment.go
│       ├── auth.go
│       ├── course.go
│       ├── notification.go
│       ├── submission.go
│       ├── subtask.go
│       └── user.go

================================================================================
СОДЕРЖИМОЕ ФАЙЛОВ
================================================================================


════════════════════════════════════════════════════════════════════════════════
║ backend/internal/middleware/ratelimit.go
════════════════════════════════════════════════════════════════════════════════

package middleware

import (
	"net/http"
	//"time"

	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/gin-gonic/gin"
	"github.com/ulule/limiter/v3"
	"github.com/ulule/limiter/v3/drivers/store/memory"
)

// RateLimit ограничивает количество запросов с одного IP
func RateLimit() gin.HandlerFunc {
	store := memory.NewStore()
	rate, _ := limiter.NewRateFromFormatted("5-M") // 5 запросов в минуту
	limiter := limiter.New(store, rate)

	return func(c *gin.Context) {
		context, err := limiter.Get(c, c.ClientIP())
		if err != nil {
			logger.Log.Errorf("Rate limit error: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка сервера"})
			c.Abort()
			return
		}

		if context.Reached {
			logger.Log.Warnf("Rate limit exceeded for IP %s", c.ClientIP())
			error.HandleError(c, error.APIError{Status: http.StatusTooManyRequests, Message: "Слишком много запросов"})
			c.Abort()
			return
		}

		c.Next()
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/error/error.go
════════════════════════════════════════════════════════════════════════════════

package error

import (
	"github.com/gin-gonic/gin"
)

// APIError представляет ошибку API с кодом статуса и сообщением
type APIError struct {
	Status  int
	Message string
}

func (e APIError) Error() string {
	return e.Message
}

// HandleError отправляет стандартизированный JSON-ответ с ошибкой
func HandleError(c *gin.Context, err error) {
	if apiErr, ok := err.(APIError); ok {
		c.JSON(apiErr.Status, gin.H{"error": apiErr.Message})
	} else {
		c.JSON(500, gin.H{"error": "Внутренняя ошибка сервера"})
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/middleware.go
════════════════════════════════════════════════════════════════════════════════

package handler

import (
	"net/http"
	"strings"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/jwt"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware проверяет JWT-токен и устанавливает userID в контекст
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			logger.Log.Error("Authorization header is missing")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Не авторизован"})
			c.Abort()
			return
		}
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			logger.Log.Error("Invalid Authorization header format")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный формат токена"})
			c.Abort()
			return
		}
		tokenString := parts[1]
		userID, err := jwt.ValidateToken(tokenString)
		if err != nil {
			logger.Log.Errorf("Failed to validate token: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Недействительный токен"})
			c.Abort()
			return
		}
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found in database: %v", userID, err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не найден"})
			c.Abort()
			return
		}
		logger.Log.Infof("Authenticated user %d (%s)", user.ID, user.Role)
		c.Set("user", user)
		c.Set("userID", user.ID)
		c.Next()
	}
}

// RoleMiddleware проверяет, имеет ли пользователь одну из указанных ролей
func RoleMiddleware(roles ...model.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не аутентифицирован"})
			c.Abort()
			return
		}

		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("Failed to find user %d: %v", userID, err)
			c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
			c.Abort()
			return
		}

		for _, role := range roles {
			if user.Role == role {
				c.Next()
				return
			}
		}

		logger.Log.Warnf("User %d with role %s does not have required permissions", userID, user.Role)
		c.JSON(http.StatusForbidden, gin.H{"error": "Недостаточно прав"})
		c.Abort()
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/auth.go
════════════════════════════════════════════════════════════════════════════════

package handler

import (
	"net/http"
	"strings"

	"github.com/MORFEUSik/projectschool/backend/internal/jwt"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// AuthService определяет методы для аутентификации
type AuthService interface {
	Register(user *model.User) error
	Login(email, password string) (*model.User, error)
}

// Register обрабатывает регистрацию пользователя
// @Summary Регистрация пользователя
// @Description Регистрирует нового пользователя и возвращает JWT-токен. Доступно без авторизации.
// @Tags auth
// @Accept json
// @Produce json
// @Param user body object true "Данные пользователя" example={"username":"testuser","email":"test@example.com","password":"password123","role":"student","class_number":5,"full_name":"Иванов Иван Иванович"}
// @Success 200 {object} map[string]interface{} "message, token"
// @Failure 400 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /register [post]
func Register(service AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input struct {
			Username    string     `json:"username" binding:"required,min=3,max=50"`
			Email       string     `json:"email" binding:"required,email"`
			Password    string     `json:"password" binding:"required,min=6"`
			Role        model.Role `json:"role" binding:"required,oneof=student"`
			ClassNumber uint       `json:"class_number" binding:"required,gte=1,lte=11"`
			FullName    string     `json:"full_name" binding:"omitempty,min=5,max=255"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}

		user := model.User{
			Username:    input.Username,
			Email:       input.Email,
			Password:    input.Password,
			Role:        input.Role,
			ClassNumber: input.ClassNumber,
			FullName:    input.FullName,
			Points:      0,
		}

		logger.Log.Infof("Received registration request: username=%s, email=%s, role=%s, class_number=%d, full_name=%s",
			user.Username, user.Email, user.Role, user.ClassNumber, user.FullName)

		// Валидация структуры User
		validate := validator.New()
		if err := validate.Struct(&user); err != nil {
			logger.Log.Errorf("User validation failed: %v", err)
			var errors []string
			for _, err := range err.(validator.ValidationErrors) {
				errors = append(errors, err.Error())
			}
			c.JSON(http.StatusBadRequest, gin.H{"error": "Валидация не пройдена: " + strings.Join(errors, ", ")})
			return
		}

		// Дополнительная валидация через метод Validate
		if err := user.Validate(); err != nil {
			logger.Log.Errorf("User validation failed: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		logger.Log.Infof("Registering user: %s", user.Email)
		if err := service.Register(&user); err != nil {
			logger.Log.Errorf("Failed to register user: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		logger.Log.Infof("User %s registered successfully", user.Email)
		token, err := jwt.GenerateToken(user.ID)
		if err != nil {
			logger.Log.Errorf("Failed to generate token: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось сгенерировать токен"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Пользователь успешно зарегистрирован",
			"token":   token,
		})
	}
}

// Login обрабатывает вход пользователя
// @Summary Вход пользователя
// @Description Аутентифицирует пользователя и возвращает JWT-токен. Доступно без авторизации.
// @Tags auth
// @Accept json
// @Produce json
// @Param credentials body object true "Учетные данные" example={"email":"user@example.com","password":"password123"}
// @Success 200 {object} map[string]interface{} "message, token"
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /login [post]
func Login(service AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var credentials struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required"`
		}

		if err := c.ShouldBindJSON(&credentials); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}

		logger.Log.Infof("Login attempt for email: %s", credentials.Email)
		user, err := service.Login(credentials.Email, credentials.Password)
		if err != nil {
			logger.Log.Errorf("Login failed for %s: %v", credentials.Email, err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный email или пароль"})
			return
		}

		logger.Log.Infof("User %s logged in successfully", credentials.Email)
		token, err := jwt.GenerateToken(user.ID)
		if err != nil {
			logger.Log.Errorf("Failed to generate token: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось сгенерировать токен"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Успешный вход",
			"token":   token,
		})
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/submission.go
════════════════════════════════════════════════════════════════════════════════

package handler

import (
	"net/http"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// SubmitAssignment позволяет студенту отправить решение
func SubmitAssignment(submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		logger.Log.Info("Processing SubmitAssignment request")

		var submissionInput struct {
			Content string `json:"content" binding:"required"`
		}
		if err := c.ShouldBindJSON(&submissionInput); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("User not authenticated")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		id, err := strconv.ParseUint(c.Param("id"), 10, 32)
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID задания"})
			return
		}

		submission := model.Submission{
			UserID:       userID.(uint),
			AssignmentID: uint(id),
			Content:      submissionInput.Content,
		}
		logger.Log.Infof("Received submission: content=%s, userID=%d, assignmentID=%d", submission.Content, submission.UserID, submission.AssignmentID)

		logger.Log.Info("Calling submissionService.Create")
		if err := submissionService.Create(&submission); err != nil {
			logger.Log.Errorf("Failed to create submission: %v", err)
			if err.Error() == "решение уже отправлено" {
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Решение уже отправлено"})
				return
			}
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: err.Error()})
			return
		}

		logger.Log.Info("Submission created successfully")
		c.JSON(http.StatusOK, gin.H{
			"message":    "Решение отправлено",
			"submission": submission,
		})
	}
}

// SetGrade позволяет преподавателю установить оценку
func SetGrade(submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		logger.Log.Info("Processing SetGrade request")

		var gradeInput struct {
			Grade float64 `json:"grade" binding:"required,gte=0,lte=5"`
		}
		if err := c.ShouldBindJSON(&gradeInput); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		id, err := strconv.ParseUint(c.Param("id"), 10, 32)
		if err != nil {
			logger.Log.Errorf("Invalid submission ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID решения"})
			return
		}

		userID := c.GetUint("userID")
		logger.Log.Infof("Setting grade %f for submission %d by user %d", gradeInput.Grade, id, userID)

		if err := submissionService.SetGrade(uint(id), userID, gradeInput.Grade); err != nil {
			logger.Log.Errorf("Failed to set grade: %v", err)
			if err.Error() == "решение не найдено" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Решение не найдено"})
				return
			}
			if err.Error() == "нет прав для оценки" {
				error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Нет прав для оценки"})
				return
			}
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: err.Error()})
			return
		}

		logger.Log.Info("Grade set successfully")
		c.JSON(http.StatusOK, gin.H{"message": "Оценка установлена"})
	}
}

// ListSubmissions возвращает список решений по assignment_id или user_id
func ListSubmissions(submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		logger.Log.Info("Processing ListSubmissions request")

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("User not authenticated")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не найден"})
			return
		}

		if user.Role != model.Teacher && user.Role != model.Admin {
			logger.Log.Warnf("User %d does not have permission to list submissions", userID)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Нет прав для просмотра решений"})
			return
		}

		assignmentIDStr := c.Query("assignment_id")
		userIDStr := c.Query("user_id")
		courseIDStr := c.Query("course_id")

		var response []map[string]interface{}

		if assignmentIDStr != "" {
			assignmentID, err := strconv.Atoi(assignmentIDStr)
			if err != nil {
				logger.Log.Errorf("Invalid assignment_id: %v", err)
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный assignment_id"})
				return
			}
			submissions, err := submissionService.GetByAssignment(uint(assignmentID))
			if err != nil {
				logger.Log.Errorf("Failed to get submissions for assignment %d: %v", assignmentID, err)
				if err.Error() == "задание не найдено" {
					error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Задание не найдено"})
					return
				}
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Внутренняя ошибка сервера"})
				return
			}
			response = makeSubmissionResponse(submissions)
		} else if userIDStr != "" {
			userIDQuery, err := strconv.Atoi(userIDStr)
			if err != nil {
				logger.Log.Errorf("Invalid user_id: %v", err)
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный user_id"})
				return
			}
			submissions, err := submissionService.GetByUserID(uint(userIDQuery))
			if err != nil {
				logger.Log.Errorf("Failed to get submissions for user %d: %v", userIDQuery, err)
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Внутренняя ошибка сервера"})
				return
			}
			response = makeSubmissionResponse(submissions)
		} else if courseIDStr != "" {
			courseID, err := strconv.Atoi(courseIDStr)
			if err != nil {
				logger.Log.Errorf("Invalid course_id: %v", err)
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный course_id"})
				return
			}
			submissions, err := submissionService.GetByCourse(uint(courseID))
			if err != nil {
				logger.Log.Errorf("Failed to get submissions for course %d: %v", courseID, err)
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения решений по курсу"})
				return
			}
			response = makeSubmissionResponse(submissions)
		} else {
			logger.Log.Error("Missing assignment_id, user_id, or course_id")
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Требуется assignment_id, user_id или course_id"})
			return
		}

		logger.Log.Infof("Returning %d submissions", len(response))
		c.JSON(http.StatusOK, response)
	}
}

// Вспомогательная функция для форматирования ответов
func makeSubmissionResponse(submissions []model.Submission) []map[string]interface{} {
	response := make([]map[string]interface{}, len(submissions))
	for i, sub := range submissions {
		response[i] = map[string]interface{}{
			"id":               sub.ID,
			"user_id":          sub.UserID,
			"username":         sub.User.Username,
			"content":          sub.Content,
			"score":            sub.Grade,
			"submitted_at":     sub.CreatedAt.Format("2006-01-02T15:04:05Z"),
			"assignment_id":    sub.AssignmentID,
			"assignment_title": sub.Assignment.Title,
			"course_id":        sub.Assignment.CourseID,
			"course_title":     sub.Assignment.Course.Title,
		}
	}
	return response
}

// GetUserSubmissions возвращает список решений текущего пользователя
// @Summary Получить решения текущего пользователя
// @Description Возвращает список всех решений аутентифицированного пользователя с информацией о заданиях и курсах.
// @Tags submissions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} map[string]interface{}
// @Failure 401 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /users/me/submissions [get]
func GetUserSubmissions(submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("User not authenticated")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		logger.Log.Infof("Fetching submissions for user %v", userID)
		submissions, err := submissionService.GetUserSubmissions(c, userID.(uint))
		if err != nil {
			logger.Log.Errorf("Failed to fetch submissions for user %d: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Не удалось получить решения"})
			return
		}

		// Формируем ответ с вложенной структурой, соответствующей фронтенду
		response := make([]map[string]interface{}, len(submissions))
		for i, sub := range submissions {
			response[i] = map[string]interface{}{
				"ID":           sub.ID,
				"UserID":       sub.UserID,
				"AssignmentID": sub.AssignmentID,
				"Content":      sub.Content,
				"Grade":        sub.Grade,
				"CreatedAt":    sub.CreatedAt.Format("2006-01-02T15:04:05Z"),
				"Assignment": map[string]interface{}{
					"ID":       sub.Assignment.ID,
					"Title":    sub.Assignment.Title,
					"CourseID": sub.Assignment.CourseID,
					"Course": map[string]interface{}{
						"ID":    sub.Assignment.Course.ID,
						"Title": sub.Assignment.Course.Title,
					},
				},
			}
		}

		logger.Log.Infof("Retrieved %d submissions for user %v", len(submissions), userID)
		c.JSON(http.StatusOK, response)
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/testutil.go
════════════════════════════════════════════════════════════════════════════════

package handler

import (
	"testing"

	"github.com/MORFEUSik/projectschool/backend/internal/jwt"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// SetupTestEnv инициализирует окружение для тестов
func SetupTestEnv(t *testing.T) {
	t.Helper()

	// Инициализация логгера
	logger.Init()

	// Инициализация JWT
	if err := jwt.Init("test-secret-key"); err != nil {
		t.Fatalf("Failed to init JWT: %v", err)
	}
}

// SetupTestDB создаёт тестовую базу данных в памяти
func SetupTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to create test DB: %v", err)
	}
	// Автомиграция моделей Course и User для тестов
	err = db.AutoMigrate(&model.User{}, &model.Course{})
	if err != nil {
		t.Fatalf("Failed to migrate test DB: %v", err)
	}
	return db
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/user.go
════════════════════════════════════════════════════════════════════════════════

package handler

import (
	"net/http"
	"strconv"
	"strings"

	errorpkg "github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// GetProfile возвращает профиль пользователя
// @Summary Получить профиль пользователя
// @Description Возвращает данные текущего аутентифицированного пользователя. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} model.User
// @Failure 401 {object} map[string]string "error"
// @Failure 404 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /users/me [get]
func GetProfile(userService service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		user, err := userService.GetProfile(userID.(uint))
		if err != nil {
			logger.Log.Errorf("Failed to get profile for user %d: %v", userID, err)
			if err.Error() == "пользователь не найден" {
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusNotFound, Message: "Пользователь не найден"})
			} else {
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusInternalServerError, Message: "Ошибка сервера"})
			}
			return
		}

		logger.Log.Infof("Profile retrieved for user %d", userID)
		c.JSON(http.StatusOK, user)
	}
}

// UpdateRole обновляет роль пользователя
// @Summary Обновить роль пользователя
// @Description Обновляет роль указанного пользователя. Требуется JWT-токен. Доступно только для роли: admin.
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID пользователя"
// @Param role body map[string]string true "Новая роль" example={"role":"teacher"}
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} errorpkg.APIError
// @Failure 401 {object} errorpkg.APIError
// @Failure 403 {object} errorpkg.APIError
// @Failure 404 {object} errorpkg.APIError
// @Failure 500 {object} errorpkg.APIError
// @Router /users/{id}/role [put]
func UpdateRole(userService service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid user ID: %v", err)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusBadRequest, Message: "Неверный ID пользователя"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		var input struct {
			Role model.Role `json:"role" binding:"required,oneof=student teacher admin"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		logger.Log.Infof("Admin %d attempting to update role for user %d to %s", userID, id, input.Role)
		if err := userService.UpdateRole(uint(id), userID.(uint), input.Role); err != nil {
			logger.Log.Errorf("Failed to update role for user %d: %v", id, err)
			if err.Error() == "пользователь не найден" {
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusNotFound, Message: "Пользователь не найден"})
			} else if err.Error() == "недостаточно прав" || err.Error() == "недопустимая роль" {
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusForbidden, Message: err.Error()})
			} else {
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusInternalServerError, Message: "Ошибка обновления роли"})
			}
			return
		}

		logger.Log.Infof("Role for user %d updated to %s by admin %d", id, input.Role, userID)
		c.JSON(http.StatusOK, gin.H{"message": "Роль пользователя обновлена"})
	}
}

// UpdateProfile обновляет профиль пользователя
// @Summary Обновить профиль пользователя
// @Description Обновляет имя, email и ФИО текущего пользователя. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body object true "Данные профиля" example={"username":"newname","email":"newemail@example.com","full_name":"Иванов Иван Иванович"}
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} errorpkg.APIError
// @Failure 401 {object} errorpkg.APIError
// @Failure 500 {object} errorpkg.APIError
// @Router /users/me [put]
func UpdateProfile(userService service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		var input struct {
			Username string `json:"username" binding:"required,min=3,max=50"`
			Email    string `json:"email" binding:"required,email"`
			FullName string `json:"full_name" binding:"omitempty,min=5,max=255"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		if err := userService.UpdateProfile(userID.(uint), input.Username, input.Email, input.FullName); err != nil {
			logger.Log.Errorf("Failed to update profile: %v", err)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusInternalServerError, Message: err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Профиль обновлён"})
	}
}

// ListUsers возвращает список всех пользователей
// @Summary Получить список пользователей
// @Description Возвращает список всех пользователей. Требуется JWT-токен. Доступно для ролей: admin.
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} model.User
// @Failure 401 {object} errorpkg.APIError
// @Failure 500 {object} errorpkg.APIError
// @Router /users [get]
func ListUsers(userService service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		users, err := userService.ListAll()
		if err != nil {
			logger.Log.Errorf("Failed to list users: %v", err)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения пользователей"})
			return
		}
		c.JSON(http.StatusOK, users)
	}
}

// AdminRegister регистрирует нового пользователя от имени администратора
// @Summary Зарегистрировать пользователя (админ)
// @Description Позволяет администратору создать нового пользователя (teacher или admin). Требуется JWT-токен. Доступно только для роли: admin.
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body object true "Данные пользователя" example={"email":"newuser@example.com","password":"password123","role":"teacher","full_name":"Иванов Иван Иванович"}
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} errorpkg.APIError
// @Failure 401 {object} errorpkg.APIError
// @Failure 403 {object} errorpkg.APIError
// @Failure 500 {object} errorpkg.APIError
// @Router /admin/create-user [post]
func AdminRegister(authService service.AuthService, userService service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		var input struct {
			Email    string     `json:"email" binding:"required,email"`
			Password string     `json:"password" binding:"required,min=6"`
			Role     model.Role `json:"role" binding:"required,oneof=teacher admin"`
			FullName string     `json:"full_name" binding:"required,min=5,max=255"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		user := &model.User{
			Email:    input.Email,
			Password: input.Password,
			Role:     input.Role,
			Username: input.Email[:strings.Index(input.Email, "@")],
			FullName: input.FullName,
		}

		logger.Log.Infof("Admin %d attempting to register user %s", userID, input.Email)
		if err := userService.AdminRegister(user, userID.(uint)); err != nil {
			logger.Log.Errorf("Failed to register user %s: %v", input.Email, err)
			if err.Error() == "пользователь с таким email уже существует" {
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusBadRequest, Message: "Пользователь с таким email уже существует"})
			} else if err.Error() == "админ не найден" || err.Error() == "недостаточно прав" {
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusForbidden, Message: err.Error()})
			} else {
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusInternalServerError, Message: "Ошибка регистрации"})
			}
			return
		}

		logger.Log.Infof("User %s registered by admin %d", input.Email, userID)
		c.JSON(http.StatusOK, gin.H{"message": "Пользователь зарегистрирован"})
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/notification.go
════════════════════════════════════════════════════════════════════════════════

package handler

import (
	"net/http"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// GetNotifications возвращает уведомления пользователя
// @Summary Получить уведомления
// @Description Возвращает список уведомлений пользователя. Если указан courseId, возвращает уведомления, связанные с курсом. Требуется JWT-токен.
// @Tags notifications
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param courseId query int false "ID курса (опционально)"
// @Success 200 {array} model.Notification
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /notifications [get]
func GetNotifications(notificationService service.NotificationService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		courseIDStr := c.Query("courseId")
		var courseID uint
		if courseIDStr != "" {
			id, err := strconv.Atoi(courseIDStr)
			if err != nil {
				logger.Log.Warnf("Invalid course ID: %v", err)
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
				return
			}
			courseID = uint(id)
		}

		notifications, err := notificationService.GetByUserID(userID.(uint))
		if err != nil {
			logger.Log.Errorf("Failed to get notifications for user %d: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения уведомлений"})
			return
		}

		// Фильтрация уведомлений по courseId
		if courseID != 0 {
			var filteredNotifications []model.Notification
			for _, notification := range notifications {
				// Проверяем, связано ли уведомление с курсом через Assignment
				var assignment model.Assignment
				if err := db.DB.Joins("JOIN submissions ON submissions.assignment_id = assignments.id").
					Where("submissions.user_id = ? AND assignments.course_id = ?", userID, courseID).
					First(&assignment).Error; err == nil {
					// Если уведомление связано с заданием курса, добавляем его
					if notification.Message != "" { // Можно уточнить фильтрацию по тексту уведомления
						filteredNotifications = append(filteredNotifications, notification)
					}
				}
			}
			notifications = filteredNotifications
		}

		c.JSON(http.StatusOK, notifications)
	}
}

// MarkNotificationAsRead помечает уведомление как прочитанное
// @Summary Пометить уведомление как прочитанное
// @Description Помечает указанное уведомление как прочитанное. Требуется JWT-токен.
// @Tags notifications
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID уведомления"
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /notifications/{id}/read [put]
func MarkNotificationAsRead(notificationService service.NotificationService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}
		id, err := strconv.ParseUint(c.Param("id"), 10, 32)
		if err != nil {
			logger.Log.Errorf("Invalid notification ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID уведомления"})
			return
		}
		if err := notificationService.MarkAsRead(uint(id), userID.(uint)); err != nil {
			logger.Log.Errorf("Failed to mark notification as read: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Уведомление помечено как прочитанное"})
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/assignment.go
════════════════════════════════════════════════════════════════════════════════

package handler

import (
	"encoding/json"
	"errors"
	"fmt"

	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	errorpkg "github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ListAssignments возвращает список заданий для курса
// @Summary Получить список заданий
// @Description Возвращает список заданий для указанного курса. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags assignments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
// @Success 200 {array} model.Assignment
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /courses/{id}/assignments [get]
func ListAssignments(assignmentService service.AssignmentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		courseID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID курса"})
			return
		}
		assignments, err := assignmentService.ListByCourse(uint(courseID))
		if err != nil {
			logger.Log.Errorf("Failed to list assignments: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения заданий"})
			return
		}
		c.JSON(http.StatusOK, assignments)
	}
}

// CreateAssignment создает новое задание
// @Summary Создать задание
// @Description Создает новое задание для курса с возможностью загрузки файла. Требуется JWT-токен. Доступно только для ролей: teacher, admin.
// @Tags assignments
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param title formData string true "Название задания"
// @Param description formData string false "Описание задания (поддерживает HTML, например, <img src='/uploads/...'>)"
// @Param max_score formData integer true "Максимальный балл"
// @Param due_date formData string true "Срок сдачи (ISO 8601)"
// @Param course_id formData integer true "ID курса"
// @Param type formData string true "Тип задания (text | multiple_choice)"
// @Param subtasks_json formData string false "JSON подзаданий для multiple_choice"
// @Param file formData file false "Файл (jpg, png, pdf)"
// @Param subtask_image_0 formData file false "Файл для подзадания 0 (jpg, png, pdf)"
// @Param subtask_image_1 formData file false "Файл для подзадания 1 (jpg, png, pdf)"
// @Success 200 {object} map[string]interface{} "message, assignment_id"
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 403 {object} map[string]string "error"
// @Failure 415 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /assignments [post]
func CreateAssignment(assignmentService service.AssignmentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Проверка Content-Type
		if !strings.Contains(c.ContentType(), "multipart/form-data") {
			logger.Log.Errorf("Invalid Content-Type: %s", c.ContentType())
			c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": "Требуется Content-Type: multipart/form-data"})
			return
		}

		// Структура для входных данных
		type AssignmentInput struct {
			Title        string    `form:"title" validate:"required,min=3,max=100"`
			Description  string    `form:"description"`
			MaxScore     uint      `form:"max_score" validate:"required,gte=0"`
			DueDate      time.Time `form:"due_date" validate:"required"`
			CourseID     uint      `form:"course_id" validate:"required"`
			Type         string    `form:"type" validate:"required,oneof=text multiple_choice"`
			SubtasksJSON string    `form:"subtasks_json"` // Синхронизировано с фронтендом
		}

		var input AssignmentInput
		if err := c.ShouldBind(&input); err != nil {
			logger.Log.Errorf("Failed to bind form data: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}

		// Десериализация подзаданий
		var subtasks []model.Subtask
		if input.Type == "multiple_choice" {
			if input.SubtasksJSON == "" {
				logger.Log.Errorf("Subtasks required for multiple_choice assignment")
				c.JSON(http.StatusBadRequest, gin.H{"error": "Тест должен содержать подзадания"})
				return
			}
			if err := json.Unmarshal([]byte(input.SubtasksJSON), &subtasks); err != nil {
				logger.Log.Errorf("Failed to parse subtasks JSON: %v", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка обработки подзаданий"})
				return
			}
			logger.Log.Infof("Successfully deserialized %d subtasks", len(subtasks))
		}

		// Получаем userID из контекста
		userIDRaw, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не аутентифицирован"})
			return
		}

		// Безопасное приведение userID к uint
		var userID uint
		switch v := userIDRaw.(type) {
		case uint:
			userID = v
		case int:
			if v < 0 {
				logger.Log.Errorf("Invalid userID: negative value %d", v)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Некорректный ID пользователя"})
				return
			}
			userID = uint(v)
		case float64:
			if v < 0 || v != float64(uint(v)) {
				logger.Log.Errorf("Invalid userID: non-integer float %f", v)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Некорректный ID пользователя"})
				return
			}
			userID = uint(v)
		default:
			logger.Log.Errorf("Invalid userID type: %T, value: %v", userIDRaw, userIDRaw)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка обработки ID пользователя"})
			return
		}

		// Проверка существования пользователя и его роли
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка проверки пользователя"})
			return
		}
		if user.Role != model.Teacher && user.Role != model.Admin {
			logger.Log.Errorf("User %d (%s) attempted to create assignment without permission", userID, user.Role)
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещён"})
			return
		}

		// Проверка существования курса
		var course model.Course
		if err := db.DB.First(&course, input.CourseID).Error; err != nil {
			logger.Log.Errorf("Course %d not found: %v", input.CourseID, err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Курс не найден"})
			return
		}

		// Проверка: принадлежит ли курс учителю (только для роли teacher)
		if user.Role == model.Teacher && course.TeacherID != userID {
			logger.Log.Errorf("Teacher %d does not own course %d", userID, course.TeacherID)
			c.JSON(http.StatusForbidden, gin.H{"error": "Вы не можете создавать задания для этого курса"})
			return
		}

		// Обработка файлов
		files := make(map[string]string)
		uploadDir := "./uploads"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			logger.Log.Errorf("Failed to create upload directory %s: %v", uploadDir, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания директории для файлов"})
			return
		}

		// Файл для задания
		var fileURL string
		file, err := c.FormFile("file")
		if err == nil { // Файл загружен
			// Валидация типа файла
			allowedTypes := map[string]bool{
				"image/jpeg":      true,
				"image/png":       true,
				"application/pdf": true,
			}
			fileHeader := file.Header.Get("Content-Type")
			if !allowedTypes[fileHeader] {
				logger.Log.Errorf("Unsupported file type: %s", fileHeader)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Неподдерживаемый тип файла (разрешены jpg, png, pdf)"})
				return
			}

			// Валидация размера (10 MB)
			if file.Size > 10*1024*1024 {
				logger.Log.Errorf("File too large: %d bytes", file.Size)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Файл слишком большой (макс. 10 МБ)"})
				return
			}

			// Сохранение файла
			ext := filepath.Ext(file.Filename)
			filename := fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), uuid.New().String(), ext)
			filePath := filepath.Join(uploadDir, filename)
			logger.Log.Infof("Saving file to %s", filePath)
			if err := c.SaveUploadedFile(file, filePath); err != nil {
				logger.Log.Errorf("Failed to save file to %s: %v", filePath, err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения файла"})
				return
			}
			if _, err := os.Stat(filePath); os.IsNotExist(err) {
				logger.Log.Errorf("File %s does not exist after saving", filePath)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Файл не был сохранён"})
				return
			}
			fileURL = "http://localhost:8080/uploads/" + filename
			logger.Log.Infof("File saved successfully: %s", fileURL)
		} else if !errors.Is(err, http.ErrMissingFile) {
			logger.Log.Errorf("Failed to get file: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка обработки файла"})
			return
		}

		// Файлы для подзаданий
		for i := range subtasks {
			fileKey := fmt.Sprintf("subtask_image_%d", i)
			file, err := c.FormFile(fileKey)
			if err == nil { // Файл загружен
				// Валидация типа файла
				allowedTypes := map[string]bool{
					"image/jpeg":      true,
					"image/png":       true,
					"application/pdf": true,
				}
				fileHeader := file.Header.Get("Content-Type")
				if !allowedTypes[fileHeader] {
					logger.Log.Errorf("Unsupported file type for %s: %s", fileKey, fileHeader)
					c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Неподдерживаемый тип файла для подзадания %d (разрешены jpg, png, pdf)", i)})
					return
				}

				// Валидация размера (10 MB)
				if file.Size > 10*1024*1024 {
					logger.Log.Errorf("File too large for %s: %d bytes", fileKey, file.Size)
					c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Файл подзадания %d слишком большой (макс. 10 МБ)", i)})
					return
				}

				// Сохранение файла
				ext := filepath.Ext(file.Filename)
				filename := fmt.Sprintf("subtask_%d-%s%s", time.Now().UnixNano(), uuid.New().String(), ext)
				filePath := filepath.Join(uploadDir, filename)
				logger.Log.Infof("Saving subtask file to %s", filePath)
				if err := c.SaveUploadedFile(file, filePath); err != nil {
					logger.Log.Errorf("Failed to save subtask file to %s: %v", filePath, err)
					c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Ошибка сохранения файла подзадания %d", i)})
					return
				}
				if _, err := os.Stat(filePath); os.IsNotExist(err) {
					logger.Log.Errorf("Subtask file %s does not exist after saving", filePath)
					c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Файл подзадания %d не был сохранён", i)})
					return
				}
				fileURL := "http://localhost:8080/uploads/" + filename
				files[fileKey] = fileURL
				logger.Log.Infof("Subtask file saved successfully: %s", fileURL)
			} else if !errors.Is(err, http.ErrMissingFile) {
				logger.Log.Errorf("Failed to get subtask file %s: %v", fileKey, err)
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Ошибка обработки файла подзадания %d", i)})
				return
			}
		}

		// Создание модели Assignment
		assignment := model.Assignment{
			Title:       input.Title,
			Description: input.Description,
			Type:        input.Type,
			MaxScore:    input.MaxScore,
			DueDate:     input.DueDate,
			CourseID:    input.CourseID,
			TeacherID:   userID,
			FileURL:     fileURL,
		}

		// Валидация
		if err := assignment.Validate(); err != nil {
			logger.Log.Errorf("Assignment validation failed: %v", err)
			validationErrors := make([]string, 0)
			if errs, ok := err.(validator.ValidationErrors); ok {
				for _, e := range errs {
					validationErrors = append(validationErrors, fmt.Sprintf("Поле %s: %s", e.Field(), e.Tag()))
				}
			} else {
				validationErrors = append(validationErrors, err.Error())
			}
			c.JSON(http.StatusBadRequest, gin.H{"error": strings.Join(validationErrors, "; ")})
			return
		}

		// Сохранение через сервис
		if err := assignmentService.Create(&assignment, subtasks, files); err != nil {
			logger.Log.Errorf("Failed to create assignment: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		logger.Log.Infof("Assignment %s (ID: %d) created by user %d with file: %s", assignment.Title, assignment.ID, userID, fileURL)
		c.JSON(http.StatusOK, gin.H{"message": "Задание создано", "assignment_id": assignment.ID})
	}
}

// GetAssignment возвращает задание по ID в контексте курса
func GetAssignment(assignmentService service.AssignmentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		courseID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
			return
		}

		assignmentID, err := strconv.Atoi(c.Param("assignmentId"))
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusBadRequest, Message: "Неверный ID задания"})
			return
		}

		assignment, err := assignmentService.Get(uint(assignmentID))
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusNotFound, Message: "Задание не найдено"})
			} else {
				logger.Log.Errorf("Failed to get assignment %d: %v", assignmentID, err)
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusInternalServerError, Message: "Ошибка сервера"})
			}
			return
		}

		// Проверка, что задание принадлежит курсу
		if assignment.CourseID != uint(courseID) {
			logger.Log.Errorf("Assignment %d does not belong to course %d", assignmentID, courseID)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusNotFound, Message: "Задание не принадлежит этому курсу"})
			return
		}

		c.JSON(http.StatusOK, assignment)
	}
}

// DeleteAssignment удаляет задание
func DeleteAssignment(assignmentService service.AssignmentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Получаем ID задания
		idStr := c.Param("id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID"})
			return
		}

		// Получаем пользователя из контекста
		userRaw, exists := c.Get("user")
		if !exists {
			logger.Log.Error("User not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Не авторизован"})
			return
		}
		user, ok := userRaw.(model.User)
		if !ok {
			logger.Log.Error("Invalid user type in context")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Внутренняя ошибка сервера"})
			return
		}

		// Проверяем права
		if user.Role != model.Teacher && user.Role != model.Admin {
			logger.Log.Errorf("User %d (%s) attempted to delete assignment %d without permission", user.ID, user.Role, id)
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещён"})
			return
		}

		// Проверяем существование задания
		assignment, err := assignmentService.Get(uint(id))
		if err != nil {
			logger.Log.Errorf("Failed to get assignment %d: %v", id, err)
			if err.Error() == "record not found" {
				c.JSON(http.StatusNotFound, gin.H{"error": "Задание не найдено"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Внутренняя ошибка сервера"})
			}
			return
		}

		// Если учитель, проверяем, что он создатель задания
		if user.Role == model.Teacher && assignment.TeacherID != user.ID {
			logger.Log.Errorf("Teacher %d attempted to delete assignment %d not owned by them", user.ID, id)
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещён"})
			return
		}

		// Удаляем задание
		if err := assignmentService.Delete(uint(id)); err != nil {
			logger.Log.Errorf("Failed to delete assignment %d: %v", id, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось удалить задание"})
			return
		}

		logger.Log.Infof("Assignment %d deleted by user %d (%s)", id, user.ID, user.Role)
		c.JSON(http.StatusOK, gin.H{"message": "Задание удалено"})
	}
}

// UploadFile загружает файл для задания
func UploadFile() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Проверка Content-Type
		if !strings.Contains(c.ContentType(), "multipart/form-data") {
			logger.Log.Errorf("Invalid Content-Type: %s", c.ContentType())
			c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": "Требуется Content-Type: multipart/form-data"})
			return
		}

		// Получаем userID из контекста
		userIDRaw, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не аутентифицирован"})
			return
		}

		var userID uint
		switch v := userIDRaw.(type) {
		case uint:
			userID = v
		case int:
			if v < 0 {
				logger.Log.Errorf("Invalid userID: negative value %d", v)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Некорректный ID пользователя"})
				return
			}
			userID = uint(v)
		case float64:
			if v < 0 || v != float64(uint(v)) {
				logger.Log.Errorf("Invalid userID: non-integer float %f", v)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Некорректный ID пользователя"})
				return
			}
			userID = uint(v)
		default:
			logger.Log.Errorf("Invalid userID type: %T, value: %v", userIDRaw, userIDRaw)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка обработки ID пользователя"})
			return
		}

		// Проверка роли
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка проверки пользователя"})
			return
		}
		if user.Role != model.Teacher && user.Role != model.Admin {
			logger.Log.Errorf("User %d (%s) attempted to upload file without permission", userID, user.Role)
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещён"})
			return
		}

		// Обработка файла
		file, err := c.FormFile("file")
		if err != nil {
			logger.Log.Errorf("Failed to get file: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка обработки файла"})
			return
		}

		// Валидация типа файла
		allowedTypes := map[string]bool{
			"image/jpeg":      true,
			"image/png":       true,
			"application/pdf": true,
		}
		fileHeader := file.Header.Get("Content-Type")
		if !allowedTypes[fileHeader] {
			logger.Log.Errorf("Unsupported file type: %s", fileHeader)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неподдерживаемый тип файла (разрешены jpg, png, pdf)"})
			return
		}

		// Валидация размера (10 MB)
		if file.Size > 10*1024*1024 {
			logger.Log.Errorf("File too large: %d bytes", file.Size)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Файл слишком большой (макс. 10 МБ)"})
			return
		}

		// Сохранение файла
		ext := filepath.Ext(file.Filename)
		filename := fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), uuid.New().String(), ext)
		uploadDir := "./uploads"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			logger.Log.Errorf("Failed to create upload directory %s: %v", uploadDir, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания директории для файлов"})
			return
		}
		filePath := filepath.Join(uploadDir, filename)
		logger.Log.Infof("Saving file to %s", filePath)
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			logger.Log.Errorf("Failed to save file to %s: %v", filePath, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения файла"})
			return
		}
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			logger.Log.Errorf("File %s does not exist after saving", filePath)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Файл не был сохранён"})
			return
		}
		fileURL := "http://localhost:8080/uploads/" + filename
		logger.Log.Infof("File saved successfully: %s", fileURL)

		c.JSON(http.StatusOK, gin.H{"file_url": fileURL})
	}
}

// SubmitQuizAssignment отправляет ответы на тест
// @Summary Отправить ответы на тест
// @Description Отправляет ответы на тест (multiple_choice). Требуется JWT-токен. Доступно для роли: student.
// @Tags assignments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID задания"
// @Param answers body object true "Ответы на подзадания"
// @Success 200 {object} map[string]interface{} "message, grade, totalScore, answers"
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /assignments/{id}/submit-quiz [post]
func SubmitQuizAssignment(submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		assignmentID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID задания"})
			return
		}

		userID := c.GetUint("userID")
		if userID == 0 {
			logger.Log.Error("UserID not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не аутентифицирован"})
			return
		}

		var input struct {
			Answers []model.SubtaskSubmission `json:"answers" binding:"required"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON data: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}

		result, err := submissionService.ProcessQuizSubmission(uint(assignmentID), userID, input.Answers)
		if err != nil {
			logger.Log.Errorf("Failed to process quiz submission: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":    "Решение отправлено",
			"grade":      result["grade"],
			"totalScore": result["totalScore"],
			"answers":    result["answers"],
		})
	}
}

// GetSubtasks возвращает подзадания для задания
func GetSubtasks(subtaskService service.SubtaskService) gin.HandlerFunc {
	return func(c *gin.Context) {
		assignmentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID задания"})
			return
		}
		subtasks, err := subtaskService.GetByAssignmentID(uint(assignmentID))
		if err != nil {
			logger.Log.Errorf("Failed to get subtasks: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения подзаданий"})
			return
		}
		c.JSON(http.StatusOK, subtasks)
	}
}

// CheckSubtaskAnswer проверяет ответ на подзадание
// @Summary Проверить ответ на подзадание
// @Description Проверяет, является ли ответ на подзадание правильным. Требуется JWT-токен. Доступно для роли: student.
// @Tags assignments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID задания"
// @Param subtask_id body int true "ID подзадания"
// @Param answer body string true "Ответ"
// @Success 200 {object} map[string]interface{} "isCorrect, attempts"
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 403 {object} map[string]string "error"
// @Failure 404 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /assignments/{id}/check-subtask [post]
func CheckSubtaskAnswer(subtaskService service.SubtaskService, submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		assignmentID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID задания"})
			return
		}

		userID := c.GetUint("userID")
		if userID == 0 {
			logger.Log.Error("UserID not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не аутентифицирован"})
			return
		}

		var input struct {
			SubtaskID uint   `json:"subtask_id" binding:"required"`
			Answer    string `json:"answer" binding:"required"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON data: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}

		// Проверка роли
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка проверки пользователя"})
			return
		}
		if user.Role != model.Student {
			logger.Log.Errorf("User %d (%s) attempted to check subtask without permission", userID, user.Role)
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещён"})
			return
		}

		// Проверка существования подзадания
		var subtask model.Subtask
		if err := db.DB.Where("id = ? AND assignment_id = ?", input.SubtaskID, assignmentID).First(&subtask).Error; err != nil {
			logger.Log.Errorf("Subtask %d not found for assignment %d: %v", input.SubtaskID, assignmentID, err)
			c.JSON(http.StatusNotFound, gin.H{"error": "Подзадание не найдено"})
			return
		}

		// Проверка, не отправлено ли уже решение для задания
		var existingSubmission model.Submission
		if err := db.DB.Where("user_id = ? AND assignment_id = ?", userID, assignmentID).First(&existingSubmission).Error; err == nil {
			logger.Log.Warnf("Submission already exists for user %d, assignment %d", userID, assignmentID)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Решение уже отправлено"})
			return
		}

		// Проверка ответа
		isCorrect := strings.TrimSpace(strings.ToLower(input.Answer)) == strings.TrimSpace(strings.ToLower(subtask.Answer))

		// Сохраняем попытку
		var subtaskSubmission model.SubtaskSubmission
		err = db.DB.Where("user_id = ? AND subtask_id = ?", userID, input.SubtaskID).First(&subtaskSubmission).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			logger.Log.Errorf("Error checking subtask submission: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка обработки попытки"})
			return
		}

		attempts := 1
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Создаём новую запись
			subtaskSubmission = model.SubtaskSubmission{
				SubtaskID: input.SubtaskID,
				UserID:    userID,
				Answer:    input.Answer,
				IsCorrect: isCorrect,
				Attempts:  1,
			}
			if err := db.DB.Create(&subtaskSubmission).Error; err != nil {
				logger.Log.Errorf("Failed to create subtask submission: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения попытки"})
				return
			}
		} else {
			// Обновляем существующую запись
			attempts = subtaskSubmission.Attempts + 1
			if err := db.DB.Model(&subtaskSubmission).Updates(map[string]interface{}{
				"answer":     input.Answer,
				"is_correct": isCorrect,
				"attempts":   attempts,
			}).Error; err != nil {
				logger.Log.Errorf("Failed to update subtask submission: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка обновления попытки"})
				return
			}
		}

		logger.Log.Infof("Subtask %d checked for user %d: answer=%s, isCorrect=%v, attempts=%d", input.SubtaskID, userID, input.Answer, isCorrect, attempts)
		c.JSON(http.StatusOK, gin.H{"isCorrect": isCorrect, "attempts": attempts})
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/leaderboard.go
════════════════════════════════════════════════════════════════════════════════

package handler

import (
	"net/http"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// GetLeaderboard возвращает таблицу лидеров
// @Summary Получить таблицу лидеров
// @Description Возвращает топ-10 пользователей по баллам, опционально для конкретного курса. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags leaderboard
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param course_id query int false "ID курса для фильтрации"
// @Success 200 {array} model.User
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /leaderboard [get]
func GetLeaderboard(userService service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		logger.Log.Info("Processing GetLeaderboard request")

		var courseID uint
		if courseIDStr := c.Query("course_id"); courseIDStr != "" {
			id, err := strconv.Atoi(courseIDStr)
			if err != nil || id < 1 {
				logger.Log.Errorf("Invalid course_id: %s", courseIDStr)
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
				return
			}
			courseID = uint(id)
		}

		users, err := userService.GetLeaderboard(courseID)
		if err != nil {
			logger.Log.Errorf("Failed to fetch leaderboard: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения таблицы лидеров"})
			return
		}

		logger.Log.Info("Leaderboard fetched successfully")
		c.JSON(http.StatusOK, users)
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/course.go
════════════════════════════════════════════════════════════════════════════════

package handler

import (
	"context"
	"errors"
	"net/http"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreateCourseInput defines the input structure for creating a course
type CreateCourseInput struct {
	Title       string `json:"title" binding:"required,min=3,max=100" swaggertype:"string" example:"Math 101" description:"Название курса (обязательное, 3-100 символов)"`
	Description string `json:"description" swaggertype:"string" example:"Introduction to Mathematics" description:"Описание курса (опциональное)"`
	Subject     string `json:"subject" binding:"required" swaggertype:"string" example:"Математика" description:"Предмет курса (обязательное)"`
	ClassNumber int    `json:"class_number" binding:"required,gte=1,lte=11" swaggertype:"integer" example:"6" description:"Номер класса (1-11)"`
}

// ListCourses возвращает список курсов
// @Summary Получить список курсов
// @Description Возвращает список всех курсов с пагинацией. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Лимит записей" default(6)
// @Param offset query int false "Смещение" default(0)
// @Success 200 {object} map[string]interface{} "courses, total"
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /courses [get]
func ListCourses(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "6"))
		offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
		if limit < 1 || offset < 0 {
			logger.Log.Errorf("Invalid pagination params: limit=%d, offset=%d", limit, offset)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверные параметры пагинации"})
			return
		}

		userID, exists := c.Get("userID")
		var uid uint
		if exists {
			uid = userID.(uint)
		}

		// Извлекаем class_number из query-параметров
		classNumber := c.Query("class_number")
		if classNumber != "" {
			// Добавляем class_number в контекст для сервиса
			ctx := context.WithValue(c.Request.Context(), "class_number", classNumber)
			c.Request = c.Request.WithContext(ctx)
		}

		courses, total, err := courseService.List(limit, offset, uid)
		if err != nil {
			logger.Log.Errorf("Failed to list courses: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения курсов"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"courses": courses, "total": total})
	}
}

// CreateCourse создает новый курс
// @Summary Создать курс
// @Description Создает новый курс. TeacherID устанавливается автоматически из токена авторизации. Требуется JWT-токен. Доступно только для ролей: teacher, admin.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param course body CreateCourseInput true "Данные курса"
// @Success 200 {object} map[string]interface{} "message, course" example={"message":"Курс создан","course":{"id":1,"title":"Math 101","description":"Introduction to Mathematics","teacher":{"id":1,"username":"teacher1","email":"teacher1@example.com","role":"teacher","points":0,"created_at":"2025-04-18T12:00:00Z","updated_at":"2025-04-18T12:00:00Z"},"created_at":"2025-04-18T12:00:00Z","updated_at":"2025-04-18T12:00:00Z"}}
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /courses [post]
func CreateCourse(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.ContentType() != "application/json" {
			logger.Log.Errorf("Invalid Content-Type: %s", c.ContentType())
			c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": "Требуется Content-Type: application/json"})
			return
		}

		var input CreateCourseInput
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		course := model.Course{
			Title:       input.Title,
			Description: input.Description,
			Subject:     input.Subject,
			ClassNumber: input.ClassNumber,
			TeacherID:   userID.(uint),
		}

		logger.Log.Infof("Creating course: %+v", course)

		if err := courseService.Create(&course); err != nil {
			logger.Log.Errorf("Failed to create course: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: err.Error()})
			return
		}

		if err := courseService.PreloadTeacher(&course); err != nil {
			logger.Log.Errorf("Failed to preload teacher for course %d: %v", course.ID, err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка загрузки данных преподавателя"})
			return
		}

		logger.Log.Infof("Course %s (ID: %d) created by user %d", course.Title, course.ID, userID)
		c.JSON(http.StatusOK, gin.H{"message": "Курс создан", "course": course})
	}
}

// GetCourse возвращает курс по ID
// @Summary Получить курс
// @Description Возвращает данные курса по его ID. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
// @Success 200 {object} model.Course
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 404 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /courses/{id} [get]
func GetCourse(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID"})
			return
		}
		course, err := courseService.Get(uint(id))
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Курс не найден"})
			} else {
				logger.Log.Errorf("Failed to get course %d: %v", id, err)
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка сервера"})
			}
			return
		}
		c.JSON(http.StatusOK, course)
	}
}

// Enroll записывает пользователя на курс
// @Summary Записаться на курс
// @Description Записывает аутентифицированного студента на курс. Требуется JWT-токен. Доступно только для роли: student.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /courses/{id}/enroll [post]
func Enroll(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		logger.Log.Infof("User %d attempting to enroll in course %d", userID, id)
		if err := courseService.Enroll(userID.(uint), uint(id)); err != nil {
			logger.Log.Errorf("Failed to enroll user %d in course %d: %v", userID, id, err)
			if err.Error() == "курс не найден" || err.Error() == "пользователь не найден" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: err.Error()})
			} else if err.Error() == "пользователь уже записан на курс" || err.Error() == "только студенты могут записываться на курсы" {
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка записи на курс"})
			}
			return
		}

		logger.Log.Infof("User %d enrolled in course %d", userID, id)
		c.JSON(http.StatusOK, gin.H{"message": "Вы записались на курс"})
	}
}

// Unenroll отменяет запись пользователя на курс
// @Summary Отменить запись на курс
// @Description Отменяет запись аутентифицированного студента на курс. Требуется JWT-токен. Доступно только для роли: student.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 404 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /courses/{id}/enroll [delete]
func Unenroll(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		logger.Log.Infof("User %d attempting to unenroll from course %d", userID, id)
		if err := courseService.Unenroll(userID.(uint), uint(id)); err != nil {
			logger.Log.Errorf("Failed to unenroll user %d from course %d: %v", userID, id, err)
			if err.Error() == "курс не найден" || err.Error() == "пользователь не найден" || err.Error() == "пользователь не записан на курс" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: err.Error()})
			} else if err.Error() == "только студенты могут отменять запись на курсы" {
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка отмены записи"})
			}
			return
		}

		logger.Log.Infof("User %d unenrolled from course %d", userID, id)
		c.JSON(http.StatusOK, gin.H{"message": "Запись на курс отменена"})
	}
}

// DeleteCourse удаляет курс
// @Summary Удалить курс
// @Description Удаляет курс. Требуется JWT-токен. Доступно только для преподавателя курса или админа.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 404 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /courses/{id} [delete]
func DeleteCourse(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		logger.Log.Infof("User %d attempting to delete course %d", userID, id)
		if err := courseService.Delete(userID.(uint), uint(id)); err != nil {
			logger.Log.Errorf("Failed to delete course %d by user %d: %v", id, userID, err)
			if err.Error() == "курс не найден" || err.Error() == "пользователь не найден" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: err.Error()})
			} else if err.Error() == "нет прав для удаления курса" || err.Error() == "недостаточно прав" {
				error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка удаления курса"})
			}
			return
		}

		logger.Log.Infof("Course %d deleted by user %d", id, userID)
		c.JSON(http.StatusOK, gin.H{"message": "Курс удален"})
	}
}

// GetCourseStats возвращает статистику курса
// @Summary Получить статистику курса
// @Description Возвращает статистику курса (количество студентов, средняя оценка, процент завершения). Требуется JWT-токен. Доступно для ролей: teacher, admin.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
// @Success 200 {object} map[string]interface{} "students_count, average_grade, completion_rate"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 404 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /courses/{id}/stats [get]
func GetCourseStats(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		logger.Log.Infof("User %d fetching stats for course %d", userID, id)
		stats, err := courseService.GetStats(uint(id))
		if err != nil {
			logger.Log.Errorf("Failed to fetch stats for course %d: %v", id, err)
			if err.Error() == "курс не найден" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Курс не найден"})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения статистики"})
			}
			return
		}

		// Проверка прав: учитель курса или админ
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Пользователь не найден"})
			return
		}
		var course model.Course
		if err := db.DB.First(&course, id).Error; err != nil {
			logger.Log.Errorf("Course %d not found: %v", id, err)
			error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Курс не найден"})
			return
		}
		if user.Role == model.Teacher && course.TeacherID != userID.(uint) {
			logger.Log.Warnf("Teacher %d does not own course %d", userID, id)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Нет прав для просмотра статистики"})
			return
		}
		if user.Role != model.Teacher && user.Role != model.Admin {
			logger.Log.Warnf("User %d does not have permission", userID)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Недостаточно прав"})
			return
		}

		logger.Log.Infof("Stats fetched for course %d by user %d", id, userID)
		c.JSON(http.StatusOK, stats)
	}
}

// GetCourseProgress возвращает прогресс пользователя по курсу
// @Summary Получить прогресс по курсу
// @Description Возвращает прогресс текущего пользователя по курсу (количество заданий, завершённых заданий, процент завершения, набранные баллы). Требуется JWT-токен. Доступно только для студентов, записанных на курс.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
// @Success 200 {object} map[string]interface{} "total_assignments, completed_assignments, completion_rate, total_points"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 404 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /courses/{id}/progress [get]
func GetCourseProgress(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Warn("Unauthorized access to course progress")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Warnf("Invalid course ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
			return
		}

		// Проверка: записан ли пользователь на курс
		var enrollment model.Enrollment
		if err := db.DB.Where("user_id = ? AND course_id = ?", userID, id).First(&enrollment).Error; err != nil {
			logger.Log.Warnf("User %d is not enrolled in course %d: %v", userID, id, err)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Вы не записаны на этот курс"})
			return
		}

		// Проверка: является ли пользователь студентом
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Пользователь не найден"})
			return
		}
		if user.Role != model.Student {
			logger.Log.Warnf("User %d is not a student", userID)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Только студенты могут просматривать прогресс"})
			return
		}

		progress, err := courseService.GetProgress(uint(userID.(uint)), uint(id))
		if err != nil {
			logger.Log.Errorf("Failed to get progress for user %d in course %d: %v", userID, id, err)
			if err.Error() == "курс не найден" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения прогресса"})
			}
			return
		}

		logger.Log.Infof("Progress fetched for user %d in course %d", userID, id)
		c.JSON(http.StatusOK, progress)
	}
}

// CheckDeadlines запускает проверку дедлайнов вручную
// @Summary Ручная проверка дедлайнов
// @Description Запускает проверку дедлайнов и отправляет уведомления. Доступно только для администратора. Требуется JWT-токен.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]string "message"
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /check-deadlines [post]
func CheckDeadlines(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Warn("Unauthorized access to check deadlines")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Пользователь не найден"})
			return
		}

		if user.Role != model.Admin {
			logger.Log.Warnf("User %d does not have permission to check deadlines", userID)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Доступно только для администратора"})
			return
		}

		if err := courseService.CheckDeadlines(); err != nil {
			logger.Log.Errorf("Failed to check deadlines: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка проверки дедлайнов"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Дедлайны проверены"})
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/action_log.go
════════════════════════════════════════════════════════════════════════════════

package handler

import (
	"net/http"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// GetActionLogs возвращает список логов действий
func GetActionLogs(s service.ActionLogService) gin.HandlerFunc {
	return func(c *gin.Context) {
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
		offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

		logs, total, err := s.GetAll(limit, offset)
		if err != nil {
			logger.Log.Errorf("Failed to get action logs: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения логов"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"logs":  logs,
			"total": total,
		})
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/achievement.go
════════════════════════════════════════════════════════════════════════════════

package handler

import (
	"net/http"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/internal/error" // Исправлен импорт
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// GetMyAchievements возвращает достижения пользователя
// @Summary Получить достижения пользователя
// @Description Возвращает список достижений текущего пользователя. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags achievements
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} model.UserAchievement
// @Failure 401 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /users/me/achievements [get]
func GetMyAchievements(userService service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		achievements, err := userService.GetAchievements(userID.(uint))
		if err != nil {
			logger.Log.Errorf("Ошибка при получении достижений: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Не удалось получить достижения"})
			return
		}

		c.JSON(http.StatusOK, achievements)
	}
}

// ListAchievements возвращает список всех глобальных достижений
// @Summary Получить все достижения
// @Description Возвращает список всех доступных достижений. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags achievements
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} model.GlobalAchievement
// @Failure 401 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /achievements [get]
func ListAchievements(achievementService service.AchievementService) gin.HandlerFunc {
	return func(c *gin.Context) {
		achievements, err := achievementService.ListAll()
		if err != nil {
			logger.Log.Errorf("Failed to list achievements: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения достижений"})
			return
		}

		c.JSON(http.StatusOK, achievements)
	}
}

// CreateAchievement создаёт новое достижение
// @Summary Создать достижение
// @Description Создаёт новое глобальное достижение. Требуется JWT-токен. Доступно только для роли: admin.
// @Tags achievements
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body object true "Данные достижения" example={"title":"Новое достижение","description":"Описание достижения","condition":"points_100"}
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /achievements [post]
func CreateAchievement(achievementService service.AchievementService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		var input struct {
			Title       string `json:"title" binding:"required,min=3,max=100"`
			Description string `json:"description" binding:"required,min=3,max=255"`
			Condition   string `json:"condition" binding:"required"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		achievement := &model.GlobalAchievement{
			Title:       input.Title,
			Description: input.Description,
			Condition:   input.Condition,
		}

		logger.Log.Infof("Admin %d attempting to create achievement %s", userID, input.Title)
		if err := achievementService.Create(achievement, userID.(uint)); err != nil {
			logger.Log.Errorf("Failed to create achievement: %v", err)
			if err.Error() == "название или условие достижения не может быть пустым" {
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: err.Error()})
			} else if err.Error() == "админ не найден" || err.Error() == "недостаточно прав" {
				error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка создания достижения"})
			}
			return
		}

		logger.Log.Infof("Achievement %s created by admin %d", input.Title, userID)
		c.JSON(http.StatusOK, gin.H{"message": "Достижение создано"})
	}
}

// UpdateAchievement обновляет существующее достижение
// @Summary Обновить достижение
// @Description Обновляет данные достижения по ID. Требуется JWT-токен. Доступно только для роли: admin.
// @Tags achievements
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID достижения"
// @Param body body object true "Данные достижения" example={"title":"Обновленное достижение","description":"Новое описание","condition":"points_500"}
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 404 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /achievements/{id} [put]
func UpdateAchievement(achievementService service.AchievementService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid achievement ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID достижения"})
			return
		}

		var input struct {
			Title       string `json:"title" binding:"required,min=3,max=100"`
			Description string `json:"description" binding:"required,min=3,max=255"`
			Condition   string `json:"condition" binding:"required"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		achievement := &model.GlobalAchievement{
			Title:       input.Title,
			Description: input.Description,
			Condition:   input.Condition,
		}

		logger.Log.Infof("Admin %d attempting to update achievement %d", userID, id)
		if err := achievementService.Update(uint(id), achievement, userID.(uint)); err != nil {
			logger.Log.Errorf("Failed to update achievement: %v", err)
			if err.Error() == "название или условие достижения не может быть пустым" {
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: err.Error()})
			} else if err.Error() == "достижение не найдено" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: err.Error()})
			} else if err.Error() == "админ не найден" || err.Error() == "недостаточно прав" {
				error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка обновления достижения"})
			}
			return
		}

		logger.Log.Infof("Achievement %d updated by admin %d", id, userID)
		c.JSON(http.StatusOK, gin.H{"message": "Достижение обновлено"})
	}
}

// DeleteAchievement удаляет достижение
// @Summary Удалить достижение
// @Description Удаляет достижение по ID. Требуется JWT-токен. Доступно только для роли: admin.
// @Tags achievements
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID достижения"
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 404 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /achievements/{id} [delete]
func DeleteAchievement(achievementService service.AchievementService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid achievement ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID достижения"})
			return
		}

		logger.Log.Infof("Admin %d attempting to delete achievement %d", userID, id)
		if err := achievementService.Delete(uint(id), userID.(uint)); err != nil {
			logger.Log.Errorf("Failed to delete achievement: %v", err)
			if err.Error() == "достижение не найдено" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: err.Error()})
			} else if err.Error() == "админ не найден" || err.Error() == "недостаточно прав" {
				error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка удаления достижения"})
			}
			return
		}

		logger.Log.Infof("Achievement %d deleted by admin %d", id, userID)
		c.JSON(http.StatusOK, gin.H{"message": "Достижение удалено"})
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/jwt/jwt.go
════════════════════════════════════════════════════════════════════════════════

package jwt

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

var secretKey []byte

// Init инициализирует JWT с секретным ключом
func Init(secret string) error {
	if secret == "" {
		return fmt.Errorf("JWT_SECRET is not set")
	}
	secretKey = []byte(secret)
	return nil
}

const (
	accessTokenDuration  = 24 * time.Hour
	refreshTokenDuration = 7 * 24 * time.Hour
)

// GenerateToken генерирует access-токен для пользователя
func GenerateToken(userID uint) (string, error) {
	claims := jwt.MapClaims{
		"sub":  userID,
		"iss":  "projectschool",
		"aud":  "api",
		"iat":  time.Now().Unix(),
		"exp":  time.Now().Add(accessTokenDuration).Unix(),
		"type": "access",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(secretKey)
	if err != nil {
		return "", fmt.Errorf("не удалось создать токен: %v", err)
	}

	return tokenString, nil
}

// GenerateRefreshToken генерирует refresh-токен
func GenerateRefreshToken(userID uint) (string, error) {
	claims := jwt.MapClaims{
		"sub":  userID,
		"iss":  "projectschool",
		"aud":  "api",
		"iat":  time.Now().Unix(),
		"exp":  time.Now().Add(refreshTokenDuration).Unix(),
		"type": "refresh",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(secretKey)
	if err != nil {
		return "", fmt.Errorf("не удалось создать refresh-токен: %v", err)
	}

	return tokenString, nil
}

// ValidateToken проверяет валидность токена и возвращает userID
func ValidateToken(tokenString string) (uint, error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("не поддерживаемый метод подписи")
		}
		return secretKey, nil
	})
	if err != nil {
		return 0, fmt.Errorf("неверный токен: %v", err)
	}

	if !token.Valid {
		return 0, fmt.Errorf("токен недействителен")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, fmt.Errorf("неверные претензии")
	}

	// Проверка типа токена
	if tokenType, exists := claims["type"]; exists && tokenType == "refresh" {
		return 0, fmt.Errorf("refresh-токен нельзя использовать для авторизации")
	}

	userID, ok := claims["sub"].(float64)
	if !ok {
		return 0, fmt.Errorf("неверный userID в токене")
	}

	return uint(userID), nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/subtask_submission.go
════════════════════════════════════════════════════════════════════════════════

// model/subtask_submission.go
package model

type SubtaskSubmission struct {
	ID        uint   `gorm:"primaryKey"`
	UserID    uint   `gorm:"not null;index"`
	SubtaskID uint   `gorm:"not null;index"`
	Answer    string `gorm:"not null"` // ответ пользователя
	IsCorrect bool   `gorm:"not null"` // правильно ли
	Attempts  int    `gorm:"not null"` // сколько попыток потребовалось
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/submission.go
════════════════════════════════════════════════════════════════════════════════

package model

import (
	"time"

	"github.com/go-playground/validator/v10"
)

type Submission struct {
	ID           uint       `gorm:"primaryKey"`
	AssignmentID uint       `gorm:"not null" validate:"required"`
	Assignment   Assignment `gorm:"foreignKey:AssignmentID"`
	UserID       uint       `gorm:"not null" validate:"required"`
	User         User       `gorm:"foreignKey:UserID"`
	Content      string     `gorm:"type:text"`
	Grade        float64    `gorm:"type:numeric(5,2);default:0"`
	CreatedAt    time.Time  `gorm:"default:current_timestamp"`
	UpdatedAt    time.Time  `gorm:"autoUpdateTime"`
}

func (s *Submission) Validate() error {
	validate := validator.New()
	return validate.Struct(s)
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/subtask.go
════════════════════════════════════════════════════════════════════════════════

package model

type Subtask struct {
	ID           uint     `gorm:"primaryKey"`
	AssignmentID uint     `gorm:"not null;index"`             // привязка к заданию
	Question     string   `gorm:"type:text;not null"`         // текст вопроса
	Options      []string `gorm:"type:jsonb;serializer:json"` // список вариантов ответа
	Answer       string   `gorm:"not null"`                   // правильный ответ
	SortOrder    int      `gorm:"column:sort_order"`
	File_url     string   `json:"file_url,omitempty"`
	InputType    string   `gorm:"type:varchar(20);default:'multiple_choice'" json:"Type"` // ← исправлено
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/user.go
════════════════════════════════════════════════════════════════════════════════

package model

import (
	"fmt"
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/go-playground/validator/v10"
)

type Role string

const (
	Student Role = "student"
	Teacher Role = "teacher"
	Admin   Role = "admin"
)

type User struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Username    string    `gorm:"unique;not null" validate:"required,min=3,max=50" json:"username"`
	FullName    string    `gorm:"type:varchar(255)" validate:"omitempty,min=5,max=255" json:"full_name"` // Убираем required
	Email       string    `gorm:"unique;not null" validate:"required,email" json:"email"`
	Password    string    `gorm:"type:varchar(255);" validate:"omitempty,min=8,max=255" json:"password,omitempty"`
	Role        Role      `gorm:"type:varchar(50);not null;default:student" validate:"required,oneof=student teacher admin" json:"role"`
	ClassNumber uint      `gorm:"default:0" validate:"omitempty,gte=1,lte=11" json:"class_number"`
	Points      uint      `gorm:"default:0" json:"points"`
	CreatedAt   time.Time `gorm:"default:current_timestamp" json:"created_at"`
	UpdatedAt   time.Time `gorm:"default:current_timestamp" json:"updated_at"`
}

func (u *User) Validate() error {
	logger.Log.Infof("Validating user: email=%s, username=%s, role=%s", u.Email, u.Username, u.Role)
	validate := validator.New()
	if err := validate.Struct(u); err != nil {
		logger.Log.Errorf("Validation failed for user: email=%s, errors=%v", u.Email, err)
		return fmt.Errorf("ошибка валидации: %w", err)
	}
	if u.Role == Student && u.ClassNumber == 0 {
		return fmt.Errorf("для студентов необходимо указать номер класса (1-11)")
	}
	if u.Role != Student && u.ClassNumber != 0 {
		return fmt.Errorf("номер класса указывается только для студентов")
	}
	if (u.Role == Teacher || u.Role == Admin) && u.FullName == "" {
		return fmt.Errorf("для учителей и админов необходимо указать ФИО")
	}
	return nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/notification.go
════════════════════════════════════════════════════════════════════════════════

package model

import (
	"github.com/go-playground/validator/v10"
	"time"
)

type Notification struct {
	ID        uint      `gorm:"primaryKey" json:"id" swaggertype:"integer" example:"1" description:"Уникальный идентификатор уведомления"`
	UserID    uint      `gorm:"not null;index" validate:"required" json:"-" description:"ID пользователя"`
	User      User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-" description:"Пользователь"`
	Message   string    `gorm:"type:text;not null" validate:"required" json:"message" swaggertype:"string" example:"Новое задание в курсе Math 101" description:"Текст уведомления"`
	IsRead    bool      `gorm:"default:false" json:"is_read" swaggertype:"boolean" example:"false" description:"Прочитано ли уведомление"`
	CreatedAt time.Time `gorm:"default:current_timestamp" json:"created_at" swaggertype:"string" example:"2025-04-18T12:00:00Z" description:"Дата создания уведомления"`
}

func (n *Notification) Validate() error {
	validate := validator.New()
	return validate.Struct(n)
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/enrollment.go
════════════════════════════════════════════════════════════════════════════════

package model

import (
	"time"

	"github.com/go-playground/validator/v10"
)

type Enrollment struct {
	ID         uint      `gorm:"primaryKey"`
	UserID     uint      `gorm:"not null;index" validate:"required"`
	CourseID   uint      `gorm:"not null;index;foreignKey:CourseID;constraint:OnDelete:CASCADE" validate:"required"`
	User       User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Course     Course    `gorm:"foreignKey:CourseID;constraint:OnDelete:CASCADE"`
	EnrolledAt time.Time `gorm:"default:current_timestamp"`
}

func (e *Enrollment) Validate() error {
	validate := validator.New()
	return validate.Struct(e)
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/assignment.go
════════════════════════════════════════════════════════════════════════════════

package model

import (
	"fmt"
	"time"

	"github.com/go-playground/validator/v10"
)

type Assignment struct {
	ID          uint         `gorm:"primaryKey" json:"id" swaggertype:"integer" example:"1" description:"Уникальный идентификатор задания"`
	CourseID    uint         `gorm:"not null" validate:"required" json:"course_id" swaggertype:"integer" example:"1" description:"ID курса, к которому относится задание"`
	Course      Course       `gorm:"foreignKey:CourseID;constraint:OnDelete:CASCADE" json:"course" validate:"-" description:"Информация о курсе"` // Добавлен validate:"-"
	Title       string       `gorm:"not null" validate:"required,min=3,max=100" json:"title" swaggertype:"string" example:"Test Assignment" description:"Название задания (обязательное, 3-100 символов)"`
	Description string       `gorm:"type:text" json:"description" swaggertype:"string" example:"Test Description" description:"Описание задания (опциональное)"`
	Type        string       `gorm:"type:varchar(32);not null;default:'text'" json:"type"`
	MaxScore    uint         `gorm:"not null" validate:"required,gte=0" json:"max_score" swaggertype:"integer" example:"100" description:"Максимальный балл за задание"`
	DueDate     time.Time    `validate:"required" json:"due_date" swaggertype:"string" example:"2025-04-19T12:00:00Z" description:"Срок сдачи задания"`
	TeacherID   uint         `gorm:"not null" validate:"required,gt=0" json:"-" description:"ID преподавателя, создавшего задание"`
	Teacher     User         `gorm:"foreignKey:TeacherID" validate:"-" json:"teacher" description:"Информация о преподавателе"`
	FileURL     string       `gorm:"type:text" json:"file_url" swaggertype:"string" example:"/uploads/assignment1.jpg" description:"URL загруженного файла (опционально)"`
	Submissions []Submission `gorm:"foreignKey:AssignmentID;constraint:OnDelete:CASCADE" json:"submissions" description:"Список отправленных работ по заданию"`
	CreatedAt   time.Time    `gorm:"default:current_timestamp" json:"created_at" swaggertype:"string" example:"2025-04-18T12:00:00Z" description:"Дата создания задания"`
	UpdatedAt   time.Time    `gorm:"autoUpdateTime" json:"updated_at" swaggertype:"string" example:"2025-04-18T12:00:00Z" description:"Дата последнего обновления задания"`
}

func (a *Assignment) Validate() error {
	validate := validator.New()
	if err := validate.Struct(a); err != nil {
		return err
	}
	if a.DueDate.Before(time.Now()) {
		return fmt.Errorf("DueDate must be in the future")
	}
	return nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/user_achievement.go
════════════════════════════════════════════════════════════════════════════════

package model

import "time"

type UserAchievement struct {
	UserID        uint              `gorm:"primaryKey"`
	AchievementID uint              `gorm:"primaryKey"`
	AwardedAt     time.Time         `gorm:"default:current_timestamp"`
	User          User              `gorm:"foreignKey:UserID"`
	Achievement   GlobalAchievement `gorm:"foreignKey:AchievementID"`
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/course.go
════════════════════════════════════════════════════════════════════════════════

package model

import (
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/go-playground/validator/v10"
)

type Course struct {
	ID          uint         `gorm:"primaryKey" json:"id" swaggertype:"integer" example:"1" description:"Уникальный идентификатор курса"`
	Title       string       `gorm:"not null;unique" validate:"required,min=3,max=100" json:"title" swaggertype:"string" example:"Math 101" description:"Название курса (обязательное, 3-100 символов)"`
	Description string       `gorm:"type:text" json:"description" swaggertype:"string" example:"Introduction to Mathematics" description:"Описание курса (опциональное)"`
	Subject     string       `gorm:"not null" validate:"required" json:"subject" swaggertype:"string" example:"Математика" description:"Предмет курса (обязательное)"`
	ClassNumber int          `gorm:"not null" validate:"required,gte=1,lte=11" json:"class_number" swaggertype:"integer" example:"6" description:"Номер класса (обязательное, 1-11)"`
	TeacherID   uint         `gorm:"not null" validate:"required,gt=0" json:"-" description:"ID преподавателя (устанавливается автоматически из токена)"`
	Teacher     User         `gorm:"foreignKey:TeacherID" validate:"-" json:"teacher" description:"Информация о преподавателе"`
	Assignments []Assignment `gorm:"foreignKey:CourseID" json:"assignments" description:"Список заданий курса"`
	CreatedAt   time.Time    `gorm:"default:current_timestamp" json:"created_at" swaggertype:"string" example:"2025-04-18T12:00:00Z" description:"Дата создания курса"`
	UpdatedAt   time.Time    `gorm:"autoUpdateTime" json:"updated_at" swaggertype:"string" example:"2025-04-18T12:00:00Z" description:"Дата последнего обновления курса"`
}

func (c *Course) Validate() error {
	logger.Log.Infof("Validating course: %+v", c)
	validate := validator.New()
	return validate.Struct(c)
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/global_achievement.go
════════════════════════════════════════════════════════════════════════════════

package model

type GlobalAchievement struct {
	ID          uint   `gorm:"primaryKey"`
	Title       string `gorm:"type:varchar(255);not null" validate:"required"`
	Description string `gorm:"type:text"`
	Condition   string `gorm:"type:varchar(255)"` // Тип условия, например, "points_50", "courses_1"
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/action_log.go
════════════════════════════════════════════════════════════════════════════════

package model

import (
	"time"
)

type UserActionLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index" json:"user_id"`
	Action    string    `gorm:"type:varchar(255)" json:"action"`
	Details   string    `gorm:"type:text" json:"details"`
	CreatedAt time.Time `json:"created_at"`
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/logger/logger.go
════════════════════════════════════════════════════════════════════════════════

package logger

import (
	"github.com/sirupsen/logrus"
)

var Log *logrus.Logger

func Init() {
	if Log == nil {
		Log = logrus.New()
		Log.SetFormatter(&logrus.JSONFormatter{})
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/repository/submission.go
════════════════════════════════════════════════════════════════════════════════

package repository

import (
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type SubmissionRepository interface {
	Create(submission *model.Submission) error
	FindByAssignmentID(assignmentID uint) ([]model.Submission, error)
	FindByAssignmentAndUser(assignmentID, userID uint) (*model.Submission, error)
	FindByUserID(userID uint) ([]model.Submission, error)
}

type submissionRepository struct {
	db *gorm.DB
}

func NewSubmissionRepository() SubmissionRepository {
	return &submissionRepository{db: db.DB}
}

func (r *submissionRepository) Create(submission *model.Submission) error {
	return r.db.Create(submission).Error
}

func (r *submissionRepository) FindByAssignmentID(assignmentID uint) ([]model.Submission, error) {
	var submissions []model.Submission
	err := r.db.Where("assignment_id = ?", assignmentID).Find(&submissions).Error
	return submissions, err
}

func (r *submissionRepository) FindByAssignmentAndUser(assignmentID, userID uint) (*model.Submission, error) {
	var submission model.Submission
	err := r.db.Where("assignment_id = ? AND user_id = ?", assignmentID, userID).First(&submission).Error
	return &submission, err
}

func (r *submissionRepository) FindByUserID(userID uint) ([]model.Submission, error) {
	var submissions []model.Submission
	err := r.db.Where("user_id = ?", userID).Find(&submissions).Error
	return submissions, err
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/repository/user.go
════════════════════════════════════════════════════════════════════════════════

package repository

import (
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type UserRepository interface {
	Create(user *model.User) error
	FindByID(id uint) (*model.User, error)
	FindByEmail(email string) (*model.User, error)
	FindTopByPoints(limit int) ([]model.User, error)
	FindTopByPointsInCourse(courseID uint, limit int) ([]model.User, error)
	UpdateRole(id uint, role model.Role) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository() UserRepository {
	return &userRepository{db: db.DB}
}

func (r *userRepository) Create(user *model.User) error {
	logger.Log.Infof("Saving user: email=%s, username=%s, role=%s, password_hash_length=%d",
		user.Email, user.Username, user.Role, len(user.Password))
	err := r.db.Create(user).Error
	if err != nil {
		logger.Log.Errorf("Failed to save user: email=%s, error=%v", user.Email, err)
	}
	return err
}

func (r *userRepository) FindByID(id uint) (*model.User, error) {
	var user model.User
	err := r.db.First(&user, id).Error
	return &user, err
}

func (r *userRepository) FindByEmail(email string) (*model.User, error) {
	var user model.User
	err := r.db.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *userRepository) FindTopByPoints(limit int) ([]model.User, error) {
	var users []model.User
	err := r.db.Order("points DESC").Limit(limit).Find(&users).Error
	return users, err
}

func (r *userRepository) FindTopByPointsInCourse(courseID uint, limit int) ([]model.User, error) {
	var users []model.User
	err := r.db.Joins("JOIN enrollments ON enrollments.user_id = users.id").
		Where("enrollments.course_id = ?", courseID).
		Order("users.points DESC").
		Limit(limit).
		Find(&users).Error
	return users, err
}

func (r *userRepository) UpdateRole(id uint, role model.Role) error {
	logger.Log.Infof("Updating role for user %d to %s", id, role)
	return r.db.Model(&model.User{}).Where("id = ?", id).Update("role", role).Error
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/repository/notification.go
════════════════════════════════════════════════════════════════════════════════

package repository

import (
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type NotificationRepository interface {
	Create(notification *model.Notification) error
	FindByUserID(userID uint) ([]model.Notification, error)
	MarkAsRead(id uint) error
}

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) Create(notification *model.Notification) error {
	err := r.db.Create(notification).Error
	if err != nil {
		logger.Log.Errorf("Failed to create notification for user %d: %v", notification.UserID, err)
		return err
	}
	logger.Log.Infof("Created notification for user %d: %s", notification.UserID, notification.Message)
	return nil
}

func (r *notificationRepository) FindByUserID(userID uint) ([]model.Notification, error) {
	var notifications []model.Notification
	err := r.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&notifications).Error
	if err != nil {
		logger.Log.Errorf("Failed to fetch notifications for user %d: %v", userID, err)
		return nil, err
	}
	return notifications, nil
}

func (r *notificationRepository) MarkAsRead(id uint) error {
	err := r.db.Model(&model.Notification{}).Where("id = ?", id).Update("is_read", true).Error
	if err != nil {
		logger.Log.Errorf("Failed to mark notification %d as read: %v", id, err)
		return err
	}
	logger.Log.Infof("Marked notification %d as read", id)
	return nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/repository/assignment.go
════════════════════════════════════════════════════════════════════════════════

package repository

import (
	"fmt"
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type AssignmentRepository interface {
	Create(assignment *model.Assignment) error
	CreateWithTx(tx *gorm.DB, assignment *model.Assignment) error
	FindByCourseID(courseID uint) ([]model.Assignment, error)
	FindByID(id uint) (*model.Assignment, error)
	FindByUserID(userID uint) ([]model.Assignment, error)
	Delete(id uint) error // Новый метод
}

type assignmentRepository struct {
	db *gorm.DB
}

func NewAssignmentRepository() AssignmentRepository {
	return &assignmentRepository{db: db.DB}
}

func (r *assignmentRepository) Create(assignment *model.Assignment) error {
	return r.db.Create(assignment).Error
}

func (r *assignmentRepository) FindByCourseID(courseID uint) ([]model.Assignment, error) {
	var assignments []model.Assignment
	err := r.db.Where("course_id = ?", courseID).Find(&assignments).Error
	return assignments, err
}

func (r *assignmentRepository) FindByID(id uint) (*model.Assignment, error) {
	var assignment model.Assignment
	err := r.db.First(&assignment, id).Error
	return &assignment, err
}

func (r *assignmentRepository) FindByUserID(userID uint) ([]model.Assignment, error) {
	var assignments []model.Assignment
	err := r.db.Joins("JOIN enrollments ON enrollments.course_id = assignments.course_id").
		Where("enrollments.user_id = ?", userID).
		Find(&assignments).Error
	return assignments, err
}

func (r *assignmentRepository) Delete(id uint) error {
	result := r.db.Delete(&model.Assignment{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("assignment not found")
	}
	return nil
}

func (r *assignmentRepository) CreateWithTx(tx *gorm.DB, assignment *model.Assignment) error {
	return tx.Create(assignment).Error
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/repository/course.go
════════════════════════════════════════════════════════════════════════════════

package repository

import (
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type CourseRepository interface {
	Create(course *model.Course) error
	FindAllWithPagination(limit, offset int) ([]model.Course, error)
	FindByID(id uint) (*model.Course, error)
	Delete(id uint) error
	GetStats(id uint) (map[string]interface{}, error)
}

type courseRepository struct {
	db *gorm.DB
}

func NewCourseRepository() CourseRepository {
	return &courseRepository{db: db.DB}
}

func (r *courseRepository) Create(course *model.Course) error {
	return r.db.Create(course).Error
}

func (r *courseRepository) FindAllWithPagination(limit, offset int) ([]model.Course, error) {
	var courses []model.Course
	err := r.db.Limit(limit).Offset(offset).Find(&courses).Error
	return courses, err
}

func (r *courseRepository) FindByID(id uint) (*model.Course, error) {
	var course model.Course
	err := r.db.First(&course, id).Error
	return &course, err
}

func (r *courseRepository) Delete(id uint) error {
	return r.db.Delete(&model.Course{}, id).Error
}

func (r *courseRepository) GetStats(courseID uint) (map[string]interface{}, error) {
	var (
		studentsCount    int64
		assignmentsCount int64
		submissionsCount int64
		averageGrade     float64
	)

	// Сколько студентов записано
	if err := r.db.Model(&model.Enrollment{}).
		Where("course_id = ?", courseID).
		Count(&studentsCount).Error; err != nil {
		return nil, err
	}

	// Сколько заданий у курса
	if err := r.db.Model(&model.Assignment{}).
		Where("course_id = ?", courseID).
		Count(&assignmentsCount).Error; err != nil {
		return nil, err
	}

	// Сколько всего решений у этих заданий
	if err := r.db.Model(&model.Submission{}).
		Joins("JOIN assignments ON submissions.assignment_id = assignments.id").
		Where("assignments.course_id = ?", courseID).
		Count(&submissionsCount).Error; err != nil {
		return nil, err
	}

	// Средняя оценка (по только тем, у кого grade > 0)
	if err := r.db.Model(&model.Submission{}).
		Select("AVG(grade)").
		Where("grade > 0").
		Joins("JOIN assignments ON submissions.assignment_id = assignments.id").
		Where("assignments.course_id = ?", courseID).
		Scan(&averageGrade).Error; err != nil {
		return nil, err
	}

	// Общий процент завершения курса
	var completionRate float64 = 0
	if studentsCount > 0 && assignmentsCount > 0 {
		totalPossible := float64(studentsCount * assignmentsCount)
		completionRate = float64(submissionsCount) / totalPossible * 100
	}

	return map[string]interface{}{
		"students_count":  studentsCount,
		"average_grade":   averageGrade,
		"completion_rate": completionRate,
	}, nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/repository/action_log.go
════════════════════════════════════════════════════════════════════════════════

package repository

import (
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type ActionLogRepository interface {
	Create(log *model.UserActionLog) error
	FindAll(limit, offset int) ([]model.UserActionLog, int64, error)
}

type actionLogRepository struct {
	db *gorm.DB
}

func NewActionLogRepository(db *gorm.DB) ActionLogRepository {
	return &actionLogRepository{db: db}
}

func (r *actionLogRepository) Create(log *model.UserActionLog) error {
	return r.db.Create(log).Error
}

func (r *actionLogRepository) FindAll(limit, offset int) ([]model.UserActionLog, int64, error) {
	var logs []model.UserActionLog
	var total int64
	if err := r.db.Model(&model.UserActionLog{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := r.db.Limit(limit).Offset(offset).Order("created_at desc").Find(&logs).Error // Убрали Preload
	return logs, total, err
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/db/postgres.go
════════════════════════════════════════════════════════════════════════════════

package db

import (
	"fmt"
	"log"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/config"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init(cfg *config.Config) error {
	port, err := strconv.Atoi(cfg.DBPort)
	if err != nil {
		log.Fatalf("Не удалось преобразовать порт %s в число: %v", cfg.DBPort, err)
	}
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, port)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Не удалось подключиться к БД: %v", err)
	}

	// Проверка и добавление столбца subject в таблице courses
	log.Println("Checking subject column in courses")
	var subjectColumnExists int
	if err := db.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'subject'").Scan(&subjectColumnExists).Error; err != nil {
		log.Printf("Ошибка: не удалось проверить столбец subject: %v", err)
		return err
	}
	if subjectColumnExists == 0 {
		log.Println("Adding subject column to courses")
		if err := db.Exec("ALTER TABLE courses ADD COLUMN subject TEXT").Error; err != nil {
			log.Printf("Ошибка добавления столбца subject: %v", err)
			return err
		}
		log.Println("Updating NULL subject values to default")
		if err := db.Exec("UPDATE courses SET subject = 'Не указан' WHERE subject IS NULL").Error; err != nil {
			log.Printf("Ошибка обновления NULL значений для subject: %v", err)
			return err
		}
		log.Println("Adding NOT NULL constraint to subject")
		if err := db.Exec("ALTER TABLE courses ALTER COLUMN subject SET NOT NULL").Error; err != nil {
			log.Printf("Ошибка установки NOT NULL для subject: %v", err)
			return err
		}
	}

	// Проверка и добавление столбца class_number в таблице courses
	log.Println("Checking class_number column in courses")
	var classNumberColumnExists int
	if err := db.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'class_number'").Scan(&classNumberColumnExists).Error; err != nil {
		log.Printf("Ошибка: не удалось проверить столбец class_number: %v", err)
		return err
	}
	if classNumberColumnExists == 0 {
		log.Println("Adding class_number column to courses")
		if err := db.Exec("ALTER TABLE courses ADD COLUMN class_number INTEGER").Error; err != nil {
			log.Printf("Ошибка добавления столбца class_number: %v", err)
			return err
		}
		log.Println("Updating NULL class_number values to default")
		if err := db.Exec("UPDATE courses SET class_number = 0 WHERE class_number IS NULL").Error; err != nil {
			log.Printf("Ошибка обновления NULL значений для class_number: %v", err)
			return err
		}
		log.Println("Adding NOT NULL constraint to class_number")
		if err := db.Exec("ALTER TABLE courses ALTER COLUMN class_number SET NOT NULL").Error; err != nil {
			log.Printf("Ошибка установки NOT NULL для class_number: %v", err)
			return err
		}
	}

	// Автомиграция моделей
	log.Println("Running AutoMigrate")
	err = db.AutoMigrate(
		&model.User{},
		&model.Course{},
		&model.Enrollment{},
		&model.Assignment{},
		&model.Submission{},
		&model.Notification{},
		&model.GlobalAchievement{},
		&model.UserAchievement{},
	)
	if err != nil {
		log.Printf("Ошибка миграции: %v", err)
		return err
	}

	// Проверка и добавление столбца teacher_id в таблице courses
	log.Println("Checking teacher_id column in courses")
	var columnExists int
	err = db.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'teacher_id'").Scan(&columnExists).Error
	if err != nil {
		log.Printf("Ошибка: не удалось проверить столбец teacher_id: %v", err)
		return err
	}
	if columnExists == 0 {
		log.Println("Adding teacher_id column to courses")
		if err = db.Exec("ALTER TABLE courses ADD COLUMN teacher_id BIGINT NOT NULL DEFAULT 0").Error; err != nil {
			log.Printf("Ошибка: не удалось добавить teacher_id: %v", err)
			return err
		}
	}

	// Проверка и добавление столбца teacher_id в таблицу assignments
	log.Println("Checking teacher_id column in assignments")
	var assignmentColumnExists int
	err = db.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'teacher_id'").Scan(&assignmentColumnExists).Error
	if err != nil {
		log.Printf("Ошибка: не удалось проверить столбец teacher_id в assignments: %v", err)
		return err
	}
	if assignmentColumnExists == 0 {
		log.Println("Adding teacher_id column to assignments")
		if err := db.Exec("ALTER TABLE assignments ADD COLUMN teacher_id BIGINT NOT NULL DEFAULT 0").Error; err != nil {
			log.Printf("Ошибка: не удалось добавить teacher_id: %v", err)
			return err
		}
	}

	// Проверка и обновление столбца password
	log.Println("Checking password column type")
	var columnType string
	err = db.Raw("SELECT data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password'").Scan(&columnType).Error
	if err != nil {
		log.Printf("Ошибка: не удалось проверить тип столбца password: %v", err)
		return err
	}
	if columnType != "character varying" {
		log.Println("Updating password column to varchar(255)")
		if err := db.Exec(`ALTER TABLE users ALTER COLUMN password TYPE VARCHAR(255)`).Error; err != nil {
			log.Printf("Ошибка: не удалось обновить колонку password: %v", err)
			return err
		}
	}

	// Проверка и добавление столбца class_number в таблице users
	log.Println("Checking class_number column in users")
	var classNumberColumnExistsUsers int
	err = db.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'class_number'").Scan(&classNumberColumnExistsUsers).Error
	if err != nil {
		log.Printf("Ошибка: не удалось проверить столбец class_number: %v", err)
		return err
	}
	if classNumberColumnExistsUsers == 0 {
		log.Println("Adding class_number column to users")
		if err := db.Exec("ALTER TABLE users ADD COLUMN class_number INTEGER DEFAULT 0").Error; err != nil {
			log.Printf("Ошибка: не удалось добавить class_number: %v", err)
			return err
		}
	}

	// Проверка уникальных индексов
	log.Println("Ensuring unique constraints")
	err = db.Exec(`
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1
				FROM pg_constraint
				WHERE conname = 'users_email_key'
			) THEN
				ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
			END IF;
			IF NOT EXISTS (
				SELECT 1
				FROM pg_constraint
				WHERE conname = 'users_username_key'
			) THEN
				ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
			END IF;
		END $$;
	`).Error
	if err != nil {
		log.Printf("Ошибка: не удалось добавить уникальные индексы: %v", err)
		return err
	}

	// Добавление индексов для оптимизации
	log.Println("Ensuring indexes")
	err = db.Exec(`
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1
				FROM pg_indexes
				WHERE indexname = 'idx_submissions_user_id'
			) THEN
				CREATE INDEX idx_submissions_user_id ON submissions(user_id);
			END IF;
			IF NOT EXISTS (
				SELECT 1
				FROM pg_indexes
				WHERE indexname = 'idx_assignments_course_id'
			) THEN
				CREATE INDEX idx_assignments_course_id ON assignments(course_id);
			END IF;
			IF NOT EXISTS (
				SELECT 1
				FROM pg_indexes
				WHERE indexname = 'idx_notifications_user_id'
			) THEN
				CREATE INDEX idx_notifications_user_id ON notifications(user_id);
			END IF;
			IF NOT EXISTS (
				SELECT 1
				FROM pg_indexes
				WHERE indexname = 'idx_user_achievements_user_id'
			) THEN
				CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
			END IF;
		END $$;
	`).Error
	if err != nil {
		log.Printf("Ошибка: не удалось добавить индексы: %v", err)
		return err
	}

	// Проверка и добавление столбца is_read в таблице notifications
	log.Println("Checking is_read column in notifications")
	var isReadColumnExists int
	if err := db.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'is_read'").Scan(&isReadColumnExists).Error; err != nil {
		log.Printf("Ошибка: не удалось проверить столбец is_read: %v", err)
		return err
	}
	if isReadColumnExists == 0 {
		log.Println("Adding is_read column to notifications")
		if err := db.Exec("ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE").Error; err != nil {
			log.Printf("Ошибка: не удалось добавить is_read: %v", err)
			return err
		}
	}

	// Логирование схем таблиц
	type ColumnSchema struct {
		ColumnName string `gorm:"column:column_name"`
		DataType   string `gorm:"column:data_type"`
	}

	// Схема таблицы users
	var schemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'").Scan(&schemas).Error
	if err != nil {
		log.Printf("Ошибка: не удалось получить схему таблицы users: %v", err)
		return err
	}
	log.Println("Table users schema:")
	for _, schema := range schemas {
		log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
	}

	// Схема таблицы courses
	var courseSchemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'courses'").Scan(&courseSchemas).Error
	if err != nil {
		log.Printf("Ошибка: не удалось получить схему таблицы courses: %v", err)
		return err
	}
	log.Println("Table courses schema:")
	for _, schema := range courseSchemas {
		log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
	}

	// Схема таблицы assignments
	var assignmentSchemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'assignments'").Scan(&assignmentSchemas).Error
	if err != nil {
		log.Printf("Ошибка: не удалось получить схему таблицы assignments: %v", err)
		return err
	}
	log.Println("Table assignments schema:")
	for _, schema := range assignmentSchemas {
		log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
	}

	// Схема таблицы notifications
	var notificationSchemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications'").Scan(&notificationSchemas).Error
	if err != nil {
		log.Printf("Ошибка: не удалось получить схему таблицы notifications: %v", err)
		return err
	}
	log.Println("Table notifications schema:")
	for _, schema := range notificationSchemas {
		log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
	}

	// Схема таблицы global_achievements
	var globalAchievementSchemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'global_achievements'").Scan(&globalAchievementSchemas).Error
	if err != nil {
		log.Printf("Ошибка: не удалось получить схему таблицы global_achievements: %v", err)
		return err
	}
	log.Println("Table global_achievements schema:")
	for _, schema := range globalAchievementSchemas {
		log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
	}

	// Схема таблицы user_achievements
	var userAchievementSchemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_achievements'").Scan(&userAchievementSchemas).Error
	if err != nil {
		log.Printf("Ошибка: не удалось получить схему таблицы user_achievements: %v", err)
		return err
	}
	log.Println("Table user_achievements schema:")
	for _, schema := range userAchievementSchemas {
		log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
	}

	DB = db
	return nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/service/auth.go
════════════════════════════════════════════════════════════════════════════════

package service

import (
	"errors"
	"fmt"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService interface {
	Register(user *model.User) error
	Login(email, password string) (*model.User, error)
}

type authService struct {
	repo repository.UserRepository
}

func NewAuthService(repo repository.UserRepository) AuthService {
	return &authService{repo: repo}
}

func (s *authService) Register(user *model.User) error {
	logger.Log.Infof("Registering user: email=%s, username=%s, role=%s, password_length=%d",
		user.Email, user.Username, user.Role, len(user.Password))

	// Проверка входных данных
	logger.Log.Info("Checking input data")
	if user.Email == "" || user.Username == "" || user.Password == "" || user.Role == "" {
		logger.Log.Errorf("Invalid input: email=%s, username=%s, role=%s, password_length=%d",
			user.Email, user.Username, user.Role, len(user.Password))
		return fmt.Errorf("все поля обязательны")
	}

	// Проверка: существует ли пользователь
	logger.Log.Info("Checking if user exists")
	existingUser, err := s.repo.FindByEmail(user.Email)
	if err == nil && existingUser != nil {
		logger.Log.Warnf("User with email %s already exists", user.Email)
		return errors.New("пользователь с таким email уже существует")
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Error checking user existence: %v", err)
		return fmt.Errorf("ошибка проверки существования пользователя: %w", err)
	}
	logger.Log.Info("No existing user found")

	// Валидация пользователя
	logger.Log.Info("Validating user")
	if err := user.Validate(); err != nil {
		logger.Log.Errorf("User validation failed: %v", err)
		return fmt.Errorf("ошибка валидации пользователя: %w", err)
	}

	// Хеширование пароля
	logger.Log.Info("Hashing password")
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.Log.Errorf("Failed to hash password: %v", err)
		return fmt.Errorf("ошибка хеширования пароля: %w", err)
	}
	hashStr := string(hashedPassword)
	logger.Log.Infof("Generated hash: length=%d, starts_with=%s", len(hashStr), hashStr[:7])
	user.Password = hashStr
	logger.Log.Infof("User password set to hash: length=%d", len(user.Password))

	// Создание пользователя
	logger.Log.Info("Creating user")
	if err := s.repo.Create(user); err != nil {
		logger.Log.Errorf("Failed to create user: email=%s, error=%v", user.Email, err)
		return fmt.Errorf("ошибка создания пользователя: %w", err)
	}

	logger.Log.Infof("User %s registered successfully", user.Email)
	return nil
}

func (s *authService) Login(email, password string) (*model.User, error) {
	logger.Log.Infof("Attempting login for user: email=%s, password_length=%d", email, len(password))

	// Проверка входных данных
	if email == "" || password == "" {
		logger.Log.Errorf("Invalid login input: email=%s, password_length=%d", email, len(password))
		return nil, errors.New("email и пароль обязательны")
	}

	// Поиск пользователя
	logger.Log.Info("Finding user by email")
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			logger.Log.Warnf("User with email %s not found", email)
			return nil, errors.New("неверный email или пароль")
		}
		logger.Log.Errorf("Error finding user: %v", err)
		return nil, fmt.Errorf("ошибка поиска пользователя: %w", err)
	}
	logger.Log.Infof("User found: id=%d, email=%s, hash_length=%d", user.ID, user.Email, len(user.Password))

	// Проверка пароля
	logger.Log.Info("Verifying password")
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		logger.Log.Warnf("Invalid password for user %s: %v", email, err)
		return nil, errors.New("неверный email или пароль")
	}

	logger.Log.Infof("User %s logged in successfully", email)
	return user, nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/service/submission.go
════════════════════════════════════════════════════════════════════════════════

package service

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
)

type SubmissionService interface {
	Create(submission *model.Submission) error
	SetGrade(submissionID, userID uint, grade float64) error
	ProcessQuizSubmission(assignmentID, userID uint, answers []model.SubtaskSubmission) (map[string]interface{}, error)
	GetByUserID(userID uint) ([]model.Submission, error)
	GetByAssignment(assignmentID uint) ([]model.Submission, error)
	GetUserSubmissions(ctx context.Context, userID uint) ([]model.Submission, error)
	GetByCourse(courseID uint) ([]model.Submission, error)
}

type submissionService struct {
	repo             repository.SubmissionRepository
	userRepo         repository.UserRepository
	assignmentRepo   repository.AssignmentRepository
	notificationRepo repository.NotificationRepository
	logRepo          repository.ActionLogRepository // Добавляем
	db               *gorm.DB
}

func NewSubmissionService(
	repo repository.SubmissionRepository,
	userRepo repository.UserRepository,
	assignmentRepo repository.AssignmentRepository,
	notificationRepo repository.NotificationRepository,
	logRepo repository.ActionLogRepository, // Добавляем
) SubmissionService {
	return &submissionService{
		repo:             repo,
		userRepo:         userRepo,
		assignmentRepo:   assignmentRepo,
		notificationRepo: notificationRepo,
		logRepo:          logRepo, // Добавляем
		db:               db.DB,
	}
}

func (s *submissionService) Create(submission *model.Submission) error {
	logger.Log.Infof("Creating submission for user %d, assignment %d", submission.UserID, submission.AssignmentID)

	_, err := s.userRepo.FindByID(submission.UserID)
	if err != nil {
		logger.Log.Errorf("User %d not found: %v", submission.UserID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не найден")
		}
		return err
	}

	assignment, err := s.assignmentRepo.FindByID(submission.AssignmentID)
	if err != nil {
		logger.Log.Errorf("Assignment %d not found: %v", submission.AssignmentID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("задание не найдено")
		}
		return err
	}

	var enrollment model.Enrollment
	err = s.db.Where("user_id = ? AND course_id = ?", submission.UserID, assignment.CourseID).First(&enrollment).Error
	if err != nil {
		logger.Log.Errorf("User %d not enrolled in course %d: %v", submission.UserID, assignment.CourseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не записан на курс")
		}
		return err
	}

	var existingSubmission model.Submission
	err = s.db.Where("user_id = ? AND assignment_id = ?", submission.UserID, submission.AssignmentID).First(&existingSubmission).Error
	if err == nil {
		logger.Log.Warnf("Submission already exists for user %d, assignment %d", submission.UserID, submission.AssignmentID)
		return errors.New("решение уже отправлено")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Error checking existing submission: %v", err)
		return err
	}

	if err := s.repo.Create(submission); err != nil {
		logger.Log.Errorf("Failed to create submission: %v", err)
		return err
	}

	notification := &model.Notification{
		UserID:    submission.UserID,
		Message:   fmt.Sprintf("Вы отправили решение для задания #%d", submission.AssignmentID),
		IsRead:    false,
		CreatedAt: time.Now(),
	}
	if err := s.notificationRepo.Create(notification); err != nil {
		logger.Log.Errorf("Failed to create submission notification: %v", err)
	} else {
		logger.Log.Infof("Created submission notification for user %d: %s", submission.UserID, notification.Message)
	}

	logger.Log.Infof("Submission created for user %d, assignment %d", submission.UserID, submission.AssignmentID)
	return nil
}

func (s *submissionService) SetGrade(submissionID, userID uint, grade float64) error {
	logger.Log.Infof("Setting grade %f for submission %d by user %d", grade, submissionID, userID)

	var submission model.Submission
	if err := s.db.First(&submission, submissionID).Error; err != nil {
		logger.Log.Errorf("Submission %d not found: %v", submissionID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("решение не найдено")
		}
		return err
	}

	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		logger.Log.Errorf("User %d not found: %v", userID, err)
		return err
	}
	if user.Role != model.Teacher && user.Role != model.Admin {
		logger.Log.Warnf("User %d does not have permission to grade", userID)
		return errors.New("нет прав для оценки")
	}

	var assignment model.Assignment
	if err := s.db.First(&assignment, submission.AssignmentID).Error; err != nil {
		logger.Log.Errorf("Assignment %d not found: %v", submission.AssignmentID, err)
		return err
	}
	var course model.Course
	if err := s.db.First(&course, assignment.CourseID).Error; err != nil {
		logger.Log.Errorf("Course %d not found: %v", assignment.CourseID, err)
		return err
	}
	if user.Role == model.Teacher && course.TeacherID != userID {
		logger.Log.Warnf("Teacher %d does not own course %d", userID, assignment.CourseID)
		return errors.New("нет прав для оценки")
	}

	var submissionUser model.User
	var points uint
	err := s.db.Transaction(func(tx *gorm.DB) error {
		submission.Grade = grade
		if err := tx.Save(&submission).Error; err != nil {
			return err
		}

		if err := tx.First(&submissionUser, submission.UserID).Error; err != nil {
			return err
		}
		points = uint(math.Round(grade * float64(assignment.MaxScore) / 5.0))
		submissionUser.Points += points
		if err := tx.Save(&submissionUser).Error; err != nil {
			return err
		}
		logger.Log.Infof("Grade %f set for submission %d, added %d points to user %d", grade, submissionID, points, submission.UserID)
		return nil
	})
	if err != nil {
		logger.Log.Errorf("Failed to set grade and update points: %v", err)
		return err
	}

	notification := &model.Notification{
		UserID:    submission.UserID,
		Message:   fmt.Sprintf("Ваше решение для задания #%d оценено: %.2f", submission.AssignmentID, grade),
		IsRead:    false,
		CreatedAt: time.Now(),
	}
	if err := s.notificationRepo.Create(notification); err != nil {
		logger.Log.Errorf("Failed to create grade notification: %v", err)
	}

	achievementService := NewAchievementService(s.db, s.userRepo, s.logRepo)
	var submissions []model.Submission
	if err := s.db.Where("user_id = ?", submission.UserID).Find(&submissions).Error; err != nil {
		logger.Log.Errorf("Failed to fetch submissions for user %d: %v", submission.UserID, err)
		return err
	}
	var courseCount int64
	if err := s.db.Model(&model.Enrollment{}).Where("user_id = ?", submission.UserID).Count(&courseCount).Error; err != nil {
		logger.Log.Errorf("Failed to count courses for user %d: %v", submission.UserID, err)
		return err
	}
	newAchievements, err := achievementService.AwardAchievements(submission.UserID, submissionUser.Points, submissions, int(courseCount))
	if err != nil {
		logger.Log.Errorf("Failed to award achievements for user %d: %v", submission.UserID, err)
		return err
	}

	for _, ach := range newAchievements {
		notification := &model.Notification{
			UserID:    submission.UserID,
			Message:   fmt.Sprintf("Вы заработали достижение: %s", ach.Title),
			IsRead:    false,
			CreatedAt: time.Now(),
		}
		if err := s.notificationRepo.Create(notification); err != nil {
			logger.Log.Errorf("Failed to create achievement notification: %v", err)
		}
	}

	return nil
}

func (s *submissionService) GetByUserID(userID uint) ([]model.Submission, error) {
	logger.Log.Infof("Fetching submissions for user %d", userID)

	var submissions []model.Submission
	err := s.db.Preload("User").Preload("Assignment.Course").Where("user_id = ?", userID).Find(&submissions).Error
	if err != nil {
		logger.Log.Errorf("Failed to fetch submissions for user %d: %v", userID, err)
		return nil, err
	}

	logger.Log.Infof("Fetched %d submissions for user %d", len(submissions), userID)
	return submissions, nil
}

func (s *submissionService) GetByAssignment(assignmentID uint) ([]model.Submission, error) {
	logger.Log.Infof("Fetching submissions for assignment %d", assignmentID)

	_, err := s.assignmentRepo.FindByID(assignmentID)
	if err != nil {
		logger.Log.Errorf("Assignment %d not found: %v", assignmentID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("задание не найдено")
		}
		return nil, err
	}

	var submissions []model.Submission
	err = s.db.Preload("User").Preload("Assignment.Course").Where("assignment_id = ?", assignmentID).Find(&submissions).Error
	if err != nil {
		logger.Log.Errorf("Failed to fetch submissions for assignment %d: %v", assignmentID, err)
		return nil, err
	}

	logger.Log.Infof("Fetched %d submissions for assignment %d", len(submissions), assignmentID)
	return submissions, nil
}

func (s *submissionService) GetUserSubmissions(ctx context.Context, userID uint) ([]model.Submission, error) {
	logger.Log.Infof("Fetching submissions for user %d", userID)

	var submissions []model.Submission
	err := s.db.WithContext(ctx).
		Preload("User").
		Preload("Assignment.Course").
		Where("user_id = ?", userID).
		Find(&submissions).Error
	if err != nil {
		logger.Log.Errorf("Failed to fetch submissions for user %d: %v", userID, err)
		return nil, fmt.Errorf("failed to get user submissions: %w", err)
	}

	logger.Log.Infof("Fetched %d submissions for user %d", len(submissions), userID)
	return submissions, nil
}

func (s *submissionService) ProcessQuizSubmission(assignmentID, userID uint, answers []model.SubtaskSubmission) (map[string]interface{}, error) {
	logger.Log.Infof("Processing quiz submission for user %d, assignment %d", userID, assignmentID)

	assignment, err := s.assignmentRepo.FindByID(assignmentID)
	if err != nil {
		logger.Log.Errorf("Assignment %d not found: %v", assignmentID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("задание не найдено")
		}
		return nil, err
	}

	if assignment.DueDate.Before(time.Now()) {
		logger.Log.Warnf("Submission deadline passed for assignment %d", assignmentID)
		return nil, errors.New("дедлайн задания истёк")
	}

	var existingSubmission model.Submission
	err = s.db.Where("user_id = ? AND assignment_id = ?", userID, assignmentID).First(&existingSubmission).Error
	if err == nil {
		logger.Log.Warnf("Submission already exists for user %d, assignment %d", userID, assignmentID)
		return nil, errors.New("решение уже отправлено")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Error checking existing submission: %v", err)
		return nil, err
	}

	var subtasks []model.Subtask
	if err := s.db.Where("assignment_id = ?", assignmentID).Find(&subtasks).Error; err != nil {
		logger.Log.Errorf("Failed to fetch subtasks for assignment %d: %v", assignmentID, err)
		return nil, err
	}
	if len(subtasks) == 0 {
		logger.Log.Errorf("No subtasks found for assignment %d", assignmentID)
		return nil, errors.New("подзадания не найдены")
	}
	subtaskMap := make(map[uint]model.Subtask)
	for _, st := range subtasks {
		subtaskMap[st.ID] = st
	}

	var totalScore float64
	var totalWeight float64
	for _, st := range subtasks {
		if st.InputType == "text_input" {
			totalWeight += 2.0
		} else {
			totalWeight += 1.0
		}
	}
	subtaskScore := float64(assignment.MaxScore) / totalWeight

	responseAnswers := make([]map[string]interface{}, 0, len(answers))
	for i, answer := range answers {
		subtask, ok := subtaskMap[answer.SubtaskID]
		if !ok {
			logger.Log.Warnf("Subtask %d not found for answer index %d", answer.SubtaskID, i)
			continue
		}

		var subtaskSubmission model.SubtaskSubmission
		err = s.db.Where("user_id = ? AND subtask_id = ?", userID, answer.SubtaskID).First(&subtaskSubmission).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			logger.Log.Errorf("Error checking subtask submission for SubtaskID %d: %v", answer.SubtaskID, err)
			return nil, err
		}

		isCorrect := strings.TrimSpace(strings.ToLower(answer.Answer)) == strings.TrimSpace(strings.ToLower(subtask.Answer))
		attempts := answer.Attempts
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			attempts = subtaskSubmission.Attempts
		}

		var weight float64
		if subtask.InputType == "text_input" {
			weight = 2.0
		} else {
			weight = 1.0
			numOptions := len(subtask.Options)
			if numOptions < 2 || numOptions > 6 {
				logger.Log.Errorf("Invalid number of options for SubtaskID %d: %d", answer.SubtaskID, numOptions)
				return nil, errors.New("некорректное количество вариантов ответа")
			}
		}

		var score float64
		if answer.Answer == "" {
			score = 0
		} else if isCorrect {
			if subtask.InputType == "text_input" {
				switch attempts {
				case 1:
					score = subtaskScore * weight
				case 2:
					score = subtaskScore * weight * 0.5
				case 3:
					score = subtaskScore * weight * 0.333
				default:
					score = 0
				}
			} else {
				if attempts == 1 {
					score = subtaskScore * weight
				} else if attempts < len(subtask.Options) {
					score = subtaskScore * weight * float64(len(subtask.Options)-attempts) / float64(len(subtask.Options)-1)
				} else {
					score = 0
				}
			}
		} else {
			score = 0
		}

		totalScore += score

		logger.Log.Infof("Processing answer for SubtaskID %d: UserAnswer='%s', CorrectAnswer='%s', IsCorrect=%v, Attempts=%d, Score=%.2f",
			answer.SubtaskID, answer.Answer, subtask.Answer, isCorrect, attempts, score)

		responseAnswer := map[string]interface{}{
			"SubtaskID": answer.SubtaskID,
			"Answer":    answer.Answer,
			"IsCorrect": isCorrect,
			"Attempts":  attempts,
			"Score":     score,
		}
		if !isCorrect && answer.Answer != "" {
			responseAnswer["CorrectAnswer"] = subtask.Answer
		}
		responseAnswers = append(responseAnswers, responseAnswer)

		if errors.Is(err, gorm.ErrRecordNotFound) {
			answers[i].IsCorrect = isCorrect
			answers[i].UserID = userID
			if err := s.db.Create(&answers[i]).Error; err != nil {
				logger.Log.Errorf("Failed to save subtask submission for SubtaskID %d: %v", answer.SubtaskID, err)
				return nil, err
			}
		} else {
			if err := s.db.Model(&subtaskSubmission).Updates(map[string]interface{}{
				"answer":     answer.Answer,
				"is_correct": isCorrect,
				"attempts":   attempts,
			}).Error; err != nil {
				logger.Log.Errorf("Failed to update subtask submission for SubtaskID %d: %v", answer.SubtaskID, err)
				return nil, err
			}
		}
	}

	percent := totalScore / float64(assignment.MaxScore) * 100
	var grade float64
	switch {
	case percent >= 80:
		grade = 5
	case percent >= 60:
		grade = 4
	case percent >= 40:
		grade = 3
	case percent >= 20:
		grade = 2
	default:
		grade = 1
	}

	submission := model.Submission{
		AssignmentID: assignmentID,
		UserID:       userID,
		Grade:        grade,
	}
	if err := s.db.Create(&submission).Error; err != nil {
		logger.Log.Errorf("Failed to save submission: %v", err)
		return nil, err
	}

	points := uint(math.Round(totalScore))
	s.db.Model(&model.User{}).Where("id = ?", userID).Update("points", gorm.Expr("points + ?", points))

	msg := fmt.Sprintf("Ваше задание #%d оценено: %.1f", assignmentID, grade)
	s.notificationRepo.Create(&model.Notification{
		UserID:    userID,
		Message:   msg,
		IsRead:    false,
		CreatedAt: time.Now(),
	})

	response := map[string]interface{}{
		"grade":      grade,
		"totalScore": totalScore,
		"answers":    responseAnswers,
	}

	logger.Log.Infof("Quiz submission processed for user %d, assignment %d: grade=%.1f, totalScore=%.2f, answers=%+v",
		userID, assignmentID, grade, totalScore, responseAnswers)

	return response, nil
}

func (s *submissionService) GetByCourse(courseID uint) ([]model.Submission, error) {
	logger.Log.Infof("Fetching submissions for course %d", courseID)

	var submissions []model.Submission
	err := s.db.Preload("User").
		Preload("Assignment").
		Preload("Assignment.Course").
		Joins("JOIN assignments ON submissions.assignment_id = assignments.id").
		Where("assignments.course_id = ?", courseID).
		Find(&submissions).Error
	if err != nil {
		logger.Log.Errorf("Failed to fetch submissions for course %d: %v", courseID, err)
		return nil, err
	}

	return submissions, nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/service/subtask.go
════════════════════════════════════════════════════════════════════════════════

package service

import (
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type SubtaskService interface {
	GetByAssignmentID(assignmentID uint) ([]model.Subtask, error)
}

type subtaskService struct {
	db *gorm.DB
}

func NewSubtaskService(db *gorm.DB) SubtaskService {
	return &subtaskService{db: db}
}

func (s *subtaskService) GetByAssignmentID(assignmentID uint) ([]model.Subtask, error) {
	var subtasks []model.Subtask
	if err := s.db.Where("assignment_id = ?", assignmentID).Order("sort_order asc").Find(&subtasks).Error; err != nil {
		return nil, err
	}
	return subtasks, nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/service/user.go
════════════════════════════════════════════════════════════════════════════════

package service

import (
	"errors"
	"fmt"

	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService interface {
	Register(user *model.User) error
	AdminRegister(user *model.User, adminID uint) error
	Login(email, password string) (*model.User, error)
	GetProfile(userID uint) (*model.User, error)
	GetLeaderboard(courseID uint) ([]model.User, error)
	UpdateRole(userID, adminID uint, role model.Role) error
	UpdateProfile(userID uint, username, email, fullName string) error
	ListAll() ([]model.User, error)
	GetAchievements(userID uint) ([]model.UserAchievement, error)
}

type userService struct {
	repo    repository.UserRepository
	db      *gorm.DB
	logRepo repository.ActionLogRepository
}

func NewUserService(repo repository.UserRepository, logRepo repository.ActionLogRepository) UserService {
	return &userService{
		repo:    repo,
		db:      db.DB,
		logRepo: logRepo,
	}
}

func (s *userService) Register(user *model.User) error {
	logger.Log.Infof("Attempting to register user: %s", user.Email)

	_, err := s.repo.FindByEmail(user.Email)
	if err == nil {
		logger.Log.Warnf("User with email %s already exists", user.Email)
		return errors.New("пользователь с таким email уже существует")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Error checking email %s: %v", user.Email, err)
		return err
	}

	if err := user.Validate(); err != nil {
		logger.Log.Errorf("User validation failed: %v", err)
		return err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.Log.Errorf("Failed to hash password: %v", err)
		return err
	}
	user.Password = string(hashedPassword)
	logger.Log.Info("Password hashed successfully")

	if err := s.repo.Create(user); err != nil {
		logger.Log.Errorf("Failed to create user: %v", err)
		return err
	}

	logger.Log.Infof("User %s registered successfully", user.Email)
	log := &model.UserActionLog{
		UserID:    user.ID,
		Action:    "register",
		Details:   "Пользователь зарегистрировался",
		CreatedAt: time.Now(),
	}
	if err := s.logRepo.Create(log); err != nil {
		logger.Log.Errorf("Failed to create action log: %v", err)
	}
	return nil
}

func (s *userService) AdminRegister(user *model.User, adminID uint) error {
	logger.Log.Infof("Admin %d attempting to register user: %s", adminID, user.Email)

	admin, err := s.repo.FindByID(adminID)
	if err != nil {
		logger.Log.Errorf("Admin %d not found: %v", adminID, err)
		return errors.New("админ не найден")
	}
	if admin.Role != model.Admin {
		logger.Log.Warnf("User %d is not an admin", adminID)
		return errors.New("недостаточно прав")
	}

	_, err = s.repo.FindByEmail(user.Email)
	if err == nil {
		logger.Log.Warnf("User with email %s already exists", user.Email)
		return errors.New("пользователь с таким email уже существует")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Error checking email %s: %v", user.Email, err)
		return err
	}

	if user.Role != model.Teacher && user.Role != model.Admin {
		logger.Log.Errorf("Invalid role for admin registration: %s", user.Role)
		return errors.New("можно регистрировать только учителей или админов")
	}

	if err := user.Validate(); err != nil {
		logger.Log.Errorf("User validation failed: %v", err)
		return err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.Log.Errorf("Failed to hash password: %v", err)
		return err
	}
	user.Password = string(hashedPassword)

	if err := s.repo.Create(user); err != nil {
		logger.Log.Errorf("Failed to create user: %v", err)
		return err
	}

	logger.Log.Infof("User %s registered by admin %d", user.Email, adminID)
	log := &model.UserActionLog{
		UserID:    adminID,
		Action:    "admin_register",
		Details:   "Админ зарегистрировал пользователя: " + user.Email,
		CreatedAt: time.Now(),
	}
	if err := s.logRepo.Create(log); err != nil {
		logger.Log.Errorf("Failed to create action log: %v", err)
	}
	return nil
}

func (s *userService) Login(email, password string) (*model.User, error) {
	logger.Log.Infof("Attempting login for user: %s", email)

	user, err := s.repo.FindByEmail(email)
	if err != nil {
		logger.Log.Errorf("User %s not found: %v", email, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("неверный email или пароль")
		}
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		logger.Log.Warnf("Invalid password for user %s", email)
		return nil, errors.New("неверный email или пароль")
	}

	logger.Log.Infof("User %s logged in successfully", email)
	log := &model.UserActionLog{
		UserID:    user.ID,
		Action:    "login",
		Details:   "Пользователь вошёл в систему",
		CreatedAt: time.Now(),
	}
	if err := s.logRepo.Create(log); err != nil {
		logger.Log.Errorf("Failed to create action log: %v", err)
	}
	return user, nil
}

func (s *userService) GetProfile(userID uint) (*model.User, error) {
	logger.Log.Infof("Fetching profile for user %d", userID)

	user, err := s.repo.FindByID(userID)
	if err != nil {
		logger.Log.Errorf("User %d not found: %v", userID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("пользователь не найден")
		}
		return nil, err
	}

	logger.Log.Infof("Profile fetched for user %d", userID)
	return user, nil
}

func (s *userService) GetLeaderboard(courseID uint) ([]model.User, error) {
	logger.Log.Info("Fetching leaderboard")

	var users []model.User
	var err error
	if courseID == 0 {
		users, err = s.repo.FindTopByPoints(10)
	} else {
		users, err = s.repo.FindTopByPointsInCourse(courseID, 10)
	}
	if err != nil {
		logger.Log.Errorf("Failed to fetch leaderboard: %v", err)
		return nil, err
	}

	logger.Log.Infof("Leaderboard fetched with %d users", len(users))
	return users, nil
}

func (s *userService) UpdateRole(userID, adminID uint, role model.Role) error {
	logger.Log.Infof("Admin %d updating role for user %d to %s", adminID, userID, role)

	_, err := s.repo.FindByID(userID)
	if err != nil {
		logger.Log.Errorf("User %d not found: %v", userID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не найден")
		}
		return err
	}

	admin, err := s.repo.FindByID(adminID)
	if err != nil {
		logger.Log.Errorf("Admin %d not found: %v", adminID, err)
		return err
	}
	if admin.Role != model.Admin {
		logger.Log.Warnf("User %d is not an admin", adminID)
		return errors.New("недостаточно прав")
	}

	if role != model.Student && role != model.Teacher && role != model.Admin {
		logger.Log.Errorf("Invalid role: %s", role)
		return errors.New("недопустимая роль")
	}

	if err := s.repo.UpdateRole(userID, role); err != nil {
		logger.Log.Errorf("Failed to update role for user %d: %v", userID, err)
		return err
	}

	logger.Log.Infof("Role for user %d updated to %s", userID, role)
	log := &model.UserActionLog{
		UserID:    adminID,
		Action:    "update_role",
		Details:   "Админ изменил роль пользователя " + fmt.Sprint(userID) + " на " + string(role),
		CreatedAt: time.Now(),
	}
	if err := s.logRepo.Create(log); err != nil {
		logger.Log.Errorf("Failed to create action log: %v", err)
	}
	return nil
}

func (s *userService) UpdateProfile(userID uint, username, email, fullName string) error {
	user, err := s.repo.FindByID(userID)
	if err != nil {
		return err
	}
	user.Username = username
	user.Email = email
	user.FullName = fullName
	if err := user.Validate(); err != nil {
		return err
	}
	if err := s.db.Save(user).Error; err != nil {
		return err
	}
	log := &model.UserActionLog{
		UserID:    userID,
		Action:    "update_profile",
		Details:   "Пользователь обновил профиль",
		CreatedAt: time.Now(),
	}
	if err := s.logRepo.Create(log); err != nil {
		logger.Log.Errorf("Failed to create action log: %v", err)
	}
	return nil
}

func (s *userService) ListAll() ([]model.User, error) {
	var users []model.User
	err := s.db.Find(&users).Error
	if err != nil {
		return nil, err
	}
	log := &model.UserActionLog{
		UserID:    0,
		Action:    "list_users",
		Details:   "Запрошен список всех пользователей",
		CreatedAt: time.Now(),
	}
	if err := s.logRepo.Create(log); err != nil {
		logger.Log.Errorf("Failed to create action log: %v", err)
	}
	return users, nil
}

func (s *userService) GetAchievements(userID uint) ([]model.UserAchievement, error) {
	var achievements []model.UserAchievement
	err := s.db.Preload("Achievement").Where("user_id = ?", userID).Find(&achievements).Error
	if err != nil {
		return nil, err
	}
	log := &model.UserActionLog{
		UserID:    userID,
		Action:    "get_achievements",
		Details:   "Пользователь запросил свои достижения",
		CreatedAt: time.Now(),
	}
	if err := s.logRepo.Create(log); err != nil {
		logger.Log.Errorf("Failed to create action log: %v", err)
	}
	return achievements, nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/service/notification.go
════════════════════════════════════════════════════════════════════════════════

package service

import (
	"errors"

	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
)

type NotificationService interface {
	Create(notification *model.Notification) error
	GetByUserID(userID uint) ([]model.Notification, error)
	MarkAsRead(id uint, userID uint) error
}

type notificationService struct {
	repo repository.NotificationRepository
	db   *gorm.DB
}

func NewNotificationService(repo repository.NotificationRepository, db *gorm.DB) NotificationService {
	return &notificationService{repo: repo, db: db}
}

func (s *notificationService) Create(notification *model.Notification) error {
	return s.repo.Create(notification)
}

func (s *notificationService) GetByUserID(userID uint) ([]model.Notification, error) {
	return s.repo.FindByUserID(userID)
}

func (s *notificationService) MarkAsRead(id uint, userID uint) error {
	var notification model.Notification
	if err := s.db.First(&notification, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("уведомление не найдено")
		}
		return err
	}
	if notification.UserID != userID {
		return errors.New("недостаточно прав")
	}
	return s.repo.MarkAsRead(id)
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/service/assignment.go
════════════════════════════════════════════════════════════════════════════════

package service

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
)

type AssignmentService interface {
	Create(assignment *model.Assignment, subtasks []model.Subtask, files map[string]string) error // Обновляем сигнатуру
	ListByCourse(courseID uint) ([]model.Assignment, error)
	ListByUser(userID uint) ([]model.Assignment, error)
	Get(id uint) (*model.Assignment, error)
	Delete(id uint) error
}

type assignmentService struct {
	repo             repository.AssignmentRepository
	notificationRepo repository.NotificationRepository
	db               *gorm.DB
}

func NewAssignmentService(repo repository.AssignmentRepository, notificationRepo repository.NotificationRepository, db *gorm.DB) AssignmentService {
	return &assignmentService{
		repo:             repo,
		notificationRepo: notificationRepo,
		db:               db,
	}
}

func (s *assignmentService) Create(assignment *model.Assignment, subtasks []model.Subtask, files map[string]string) error {
	logger.Log.Infof("Creating assignment: %s", assignment.Title)
	if assignment.Type == "multiple_choice" && len(subtasks) == 0 {
		logger.Log.Errorf("Multiple choice assignment must have at least one subtask")
		return errors.New("тест должен содержать хотя бы одно подзадание")
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := s.repo.CreateWithTx(tx, assignment); err != nil {
			logger.Log.Errorf("Failed to create assignment: %v", err)
			return err
		}

		for i := range subtasks {
			if subtasks[i].Question == "" {
				logger.Log.Errorf("Subtask question cannot be empty")
				return errors.New("вопрос подзадания не может быть пустым")
			}
			if subtasks[i].InputType == "multiple_choice" {
				if len(subtasks[i].Options) < 2 {
					logger.Log.Errorf("Subtask must have at least 2 options")
					return errors.New("подзадание должно содержать хотя бы 2 варианта ответа")
				}
				if !contains(subtasks[i].Options, subtasks[i].Answer) {
					logger.Log.Errorf("Subtask answer must be one of the options")
					return errors.New("правильный ответ должен быть одним из вариантов")
				}
			} else if subtasks[i].InputType == "text_input" {
				if len(subtasks[i].Options) > 0 {
					logger.Log.Errorf("Text input subtask must not have options")
					return errors.New("подзадание с текстовым вводом не должно содержать варианты ответа")
				}
				if subtasks[i].Answer == "" {
					logger.Log.Errorf("Text input subtask must have an answer")
					return errors.New("подзадание с текстовым вводом должно содержать правильный ответ")
				}
			} else {
				logger.Log.Errorf("Invalid subtask type: %s", subtasks[i].InputType)
				return errors.New("неверный тип подзадания")
			}
			subtasks[i].AssignmentID = assignment.ID
			subtasks[i].SortOrder = i + 1

			// Привязываем URL файла к подзаданию
			if fileURL, ok := files[fmt.Sprintf("subtask_image_%d", i)]; ok {
				subtasks[i].File_url = fileURL
			}

			if err := tx.Create(&subtasks[i]).Error; err != nil {
				logger.Log.Errorf("Failed to create subtask: %v", err)
				return err
			}
		}

		var enrollments []model.Enrollment
		if err := s.db.Where("course_id = ?", assignment.CourseID).Find(&enrollments).Error; err == nil {
			var course model.Course
			if err := s.db.First(&course, assignment.CourseID).Error; err == nil {
				for _, e := range enrollments {
					notification := &model.Notification{
						UserID:    e.UserID,
						Message:   fmt.Sprintf("Новое задание в курсе %s: %s", course.Title, assignment.Title),
						IsRead:    false,
						CreatedAt: time.Now(),
					}
					s.notificationRepo.Create(notification)
				}
			}
		}

		logger.Log.Infof("Assignment %s created successfully with %d subtasks", assignment.Title, len(subtasks))
		return nil
	})
}

func contains(options []string, answer string) bool {
	for _, opt := range options {
		if strings.TrimSpace(strings.ToLower(opt)) == strings.TrimSpace(strings.ToLower(answer)) {
			return true
		}
	}
	return false
}

func (s *assignmentService) ListByCourse(courseID uint) ([]model.Assignment, error) {
	return s.repo.FindByCourseID(courseID)
}

func (s *assignmentService) ListByUser(userID uint) ([]model.Assignment, error) {
	return s.repo.FindByUserID(userID)
}

func (s *assignmentService) Get(id uint) (*model.Assignment, error) {
	return s.repo.FindByID(id)
}

func (s *assignmentService) Delete(id uint) error {
	return s.repo.Delete(id)
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/service/course.go
════════════════════════════════════════════════════════════════════════════════

package service

import (
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
)

type CourseService interface {
	Create(course *model.Course) error
	List(limit, offset int, userID uint) ([]model.Course, int, error)
	Get(id uint) (*model.Course, error)
	PreloadTeacher(course *model.Course) error
	Enroll(userID, courseID uint) error
	Unenroll(userID, courseID uint) error
	Delete(userID, courseID uint) error
	GetStats(courseID uint) (map[string]interface{}, error)
	GetProgress(userID, courseID uint) (map[string]interface{}, error)
	CheckDeadlines() error
}

type courseService struct {
	repo             repository.CourseRepository
	userRepo         repository.UserRepository
	notificationRepo repository.NotificationRepository
	logRepo          repository.ActionLogRepository // Добавляем
	db               *gorm.DB
}

func NewCourseService(
	repo repository.CourseRepository,
	notificationRepo repository.NotificationRepository,
	userRepo repository.UserRepository,
	logRepo repository.ActionLogRepository, // Добавляем
	db *gorm.DB,
) CourseService {
	return &courseService{
		repo:             repo,
		userRepo:         userRepo,
		notificationRepo: notificationRepo,
		logRepo:          logRepo, // Добавляем
		db:               db,
	}
}

func (s *courseService) Create(course *model.Course) error {
	logger.Log.Infof("Creating course: %s", course.Title)
	if err := course.Validate(); err != nil {
		logger.Log.Errorf("Course validation failed: %v", err)
		return fmt.Errorf("ошибка валидации: %v", err)
	}
	err := s.repo.Create(course)
	if err != nil {
		logger.Log.Errorf("Failed to create course: %v", err)
		return err
	}
	logger.Log.Infof("Course %s created successfully", course.Title)
	return nil
}

func (s *courseService) List(limit, offset int, userID uint) ([]model.Course, int, error) {
	logger.Log.Infof("Получение курсов с лимитом %d, смещением %d для пользователя %d", limit, offset, userID)
	var courses []model.Course
	var total int64

	user, err := s.userRepo.FindByID(userID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Не удалось найти пользователя %d: %v", userID, err)
		return nil, 0, err
	}

	query := s.db.Model(&model.Course{}).Preload("Teacher")

	// Фильтрация по class_number
	var requestedClassNumber int
	if classNumberStr := s.db.Statement.Context.Value("class_number"); classNumberStr != nil {
		logger.Log.Infof("Получен class_number из контекста: %v", classNumberStr)
		if num, err := strconv.Atoi(classNumberStr.(string)); err == nil && num >= 1 && num <= 11 {
			requestedClassNumber = num
			query = query.Where("class_number = ?", requestedClassNumber)
			logger.Log.Infof("Применён фильтр: class_number=%d", requestedClassNumber)
		} else {
			logger.Log.Warnf("Некорректный class_number: %v", classNumberStr)
		}
	} else {
		logger.Log.Info("class_number не указан в контексте")
	}

	// Для студентов: если class_number НЕ передан, используем их класс
	if requestedClassNumber == 0 && user != nil && user.Role == model.Student && user.ClassNumber > 0 {
		if user.ClassNumber > uint(11) {
			logger.Log.Warnf("Некорректный номер класса для пользователя %d: %d", userID, user.ClassNumber)
			return nil, 0, errors.New("Некорректный номер класса пользователя")
		}
		requestedClassNumber = int(user.ClassNumber)
		query = query.Where("class_number = ?", requestedClassNumber)
		logger.Log.Infof("Для студента применён фильтр по его классу: class_number=%d", requestedClassNumber)
	}

	// Подсчет общего количества курсов
	if err := query.Count(&total).Error; err != nil {
		logger.Log.Errorf("Не удалось подсчитать курсы: %v", err)
		return nil, 0, err
	}

	// Сортировка по subject, class_number и created_at
	query = query.Order("subject ASC, class_number ASC, created_at DESC")

	// Получение курсов
	err = query.Limit(limit).Offset(offset).Find(&courses).Error
	if err != nil {
		logger.Log.Errorf("Не удалось получить курсы: %v", err)
		return nil, 0, err
	}
	logger.Log.Infof("Получено %d курсов из %d всего", len(courses), total)
	return courses, int(total), nil
}

func (s *courseService) Get(id uint) (*model.Course, error) {
	logger.Log.Infof("Fetching course %d", id)
	var course model.Course
	err := s.db.Preload("Teacher").First(&course, id).Error
	if err != nil {
		logger.Log.Errorf("Failed to fetch course %d: %v", id, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("курс не найден")
		}
		return nil, err
	}
	logger.Log.Infof("Fetched course %d", id)
	return &course, nil
}

func (s *courseService) PreloadTeacher(course *model.Course) error {
	logger.Log.Infof("Preloading teacher for course %d", course.ID)
	err := s.db.Preload("Teacher").First(course, course.ID).Error
	if err != nil {
		logger.Log.Errorf("Failed to preload teacher for course %d: %v", course.ID, err)
		return err
	}
	return nil
}

func (s *courseService) Enroll(userID, courseID uint) error {
	logger.Log.Infof("User %d enrolling in course %d", userID, courseID)

	course, err := s.repo.FindByID(courseID)
	if err != nil {
		logger.Log.Errorf("Course %d not found: %v", courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("курс не найден")
		}
		return err
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		logger.Log.Errorf("User %d not found: %v", userID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не найден")
		}
		return err
	}

	if user.Role != model.Student {
		logger.Log.Warnf("User %d is not a student", userID)
		return errors.New("только студенты могут записываться на курсы")
	}

	var enrollment model.Enrollment
	err = s.db.Where("user_id = ? AND course_id = ?", userID, courseID).First(&enrollment).Error
	if err == nil {
		logger.Log.Warnf("User %d already enrolled in course %d", userID, courseID)
		return errors.New("пользователь уже записан на курс")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Error checking enrollment: %v", err)
		return err
	}

	enrollment = model.Enrollment{
		UserID:     userID,
		CourseID:   courseID,
		EnrolledAt: time.Now(),
	}
	if err := s.db.Create(&enrollment).Error; err != nil {
		logger.Log.Errorf("Failed to create enrollment: %v", err)
		return err
	}

	notification := &model.Notification{
		UserID:    userID,
		Message:   fmt.Sprintf("Вы записались на курс: %s", course.Title),
		IsRead:    false,
		CreatedAt: time.Now(),
	}
	if err := s.notificationRepo.Create(notification); err != nil {
		logger.Log.Errorf("Failed to create enrollment notification for user %d: %v", userID, err)
	}

	achievementService := NewAchievementService(s.db, s.userRepo, s.logRepo)
	var submissions []model.Submission
	if err := s.db.Where("user_id = ?", userID).Find(&submissions).Error; err != nil {
		logger.Log.Errorf("Failed to fetch submissions for user %d: %v", userID, err)
	}
	var courseCount int64
	if err := s.db.Model(&model.Enrollment{}).Where("user_id = ?", userID).Count(&courseCount).Error; err != nil {
		logger.Log.Errorf("Failed to count courses for user %d: %v", userID, err)
	}
	newAchievements, err := achievementService.AwardAchievements(userID, user.Points, submissions, int(courseCount))
	if err != nil {
		logger.Log.Errorf("Failed to award achievements for user %d: %v", userID, err)
	} else if len(newAchievements) > 0 {
		logger.Log.Infof("Awarded %d new achievements to user %d", len(newAchievements), userID)
		for _, ach := range newAchievements {
			notification := &model.Notification{
				UserID:    userID,
				Message:   fmt.Sprintf("Вы заработали достижение: %s", ach.Title),
				IsRead:    false,
				CreatedAt: time.Now(),
			}
			if err := s.notificationRepo.Create(notification); err != nil {
				logger.Log.Errorf("Failed to create achievement notification for user %d: %v", userID, err)
			}
		}
	}

	logger.Log.Infof("User %d enrolled in course %d", userID, courseID)
	return nil
}

func (s *courseService) Unenroll(userID, courseID uint) error {
	logger.Log.Infof("User %d unenrolling from course %d", userID, courseID)

	_, err := s.repo.FindByID(courseID)
	if err != nil {
		logger.Log.Errorf("Course %d not found: %v", courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("курс не найден")
		}
		return err
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		logger.Log.Errorf("User %d not found: %v", userID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не найден")
		}
		return err
	}

	if user.Role != model.Student {
		logger.Log.Warnf("User %d is not a student", userID)
		return errors.New("только студенты могут отменять запись на курсы")
	}

	var enrollment model.Enrollment
	err = s.db.Where("user_id = ? AND course_id = ?", userID, courseID).First(&enrollment).Error
	if err != nil {
		logger.Log.Errorf("Enrollment not found for user %d in course %d: %v", userID, courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не записан на курс")
		}
		return err
	}

	if err := s.db.Delete(&enrollment).Error; err != nil {
		logger.Log.Errorf("Failed to delete enrollment: %v", err)
		return err
	}

	logger.Log.Infof("User %d unenrolled from course %d", userID, courseID)
	return nil
}

func (s *courseService) Delete(userID, courseID uint) error {
	logger.Log.Infof("User %d deleting course %d", userID, courseID)

	course, err := s.repo.FindByID(courseID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("курс не найден")
		}
		return err
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не найден")
		}
		return err
	}

	if user.Role != model.Admin && (user.Role != model.Teacher || course.TeacherID != userID) {
		return errors.New("нет прав для удаления курса")
	}

	if err := s.repo.Delete(courseID); err != nil {
		return fmt.Errorf("ошибка при удалении курса: %w", err)
	}

	logger.Log.Infof("Course %d deleted by user %d", courseID, userID)
	return nil
}

func (s *courseService) GetStats(courseID uint) (map[string]interface{}, error) {
	logger.Log.Infof("Fetching stats for course %d", courseID)

	_, err := s.repo.FindByID(courseID)
	if err != nil {
		logger.Log.Errorf("Course %d not found: %v", courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("курс не найден")
		}
		return nil, err
	}

	stats, err := s.repo.GetStats(courseID)
	if err != nil {
		logger.Log.Errorf("Failed to fetch stats for course %d: %v", courseID, err)
		return nil, err
	}

	logger.Log.Infof("Stats fetched for course %d", courseID)
	return stats, nil
}

func (s *courseService) GetProgress(userID, courseID uint) (map[string]interface{}, error) {
	logger.Log.Infof("Fetching progress for user %d in course %d", userID, courseID)

	var enrollment model.Enrollment
	if err := s.db.Where("user_id = ? AND course_id = ?", userID, courseID).First(&enrollment).Error; err != nil {
		logger.Log.Errorf("User %d not enrolled in course %d: %v", userID, courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("пользователь не записан на курс")
		}
		return nil, err
	}

	var course model.Course
	if err := s.db.Preload("Assignments.Submissions").First(&course, courseID).Error; err != nil {
		logger.Log.Errorf("Course %d not found: %v", courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("курс не найден")
		}
		return nil, err
	}

	totalAssignments := len(course.Assignments)
	var completedAssignments int
	var totalPoints float64

	for _, assignment := range course.Assignments {
		for _, submission := range assignment.Submissions {
			if submission.UserID == userID && submission.Grade != 0 {
				completedAssignments++
				totalPoints += submission.Grade * float64(assignment.MaxScore) / 5.0
			}
		}
	}

	completionRate := 0.0
	if totalAssignments > 0 {
		completionRate = float64(completedAssignments) / float64(totalAssignments) * 100
	}

	logger.Log.Infof("Progress for user %d in course %d: %d/%d assignments, %.2f points, %.2f%% completion",
		userID, courseID, completedAssignments, totalAssignments, totalPoints, completionRate)

	return map[string]interface{}{
		"total_assignments":     totalAssignments,
		"completed_assignments": completedAssignments,
		"completion_rate":       fmt.Sprintf("%.2f", completionRate),
		"total_points":          fmt.Sprintf("%.2f", totalPoints),
	}, nil
}

func (s *courseService) CheckDeadlines() error {
	deadlineThreshold := time.Now().Add(24 * time.Hour)
	var assignments []model.Assignment
	if err := s.db.
		Where("due_date BETWEEN ? AND ?", time.Now(), deadlineThreshold).
		Preload("Course").
		Find(&assignments).Error; err != nil {
		return err
	}
	for _, assignment := range assignments {
		var enrollments []model.Enrollment
		if err := s.db.Where("course_id = ?", assignment.CourseID).Find(&enrollments).Error; err != nil {
			continue
		}
		for _, enrollment := range enrollments {
			msg := fmt.Sprintf("Дедлайн задания '%s' на курсе '%s' приближается (%s)!", assignment.Title, assignment.Course.Title, assignment.DueDate.Format(time.RFC1123))
			_ = s.notificationRepo.Create(&model.Notification{
				UserID:    enrollment.UserID,
				Message:   msg,
				IsRead:    false,
				CreatedAt: time.Now(),
			})
		}
	}
	return nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/service/action_log.go
════════════════════════════════════════════════════════════════════════════════

package service

import (
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
	"time"
)

type ActionLogService interface {
	Create(userID uint, action, details string) error
	GetAll(limit, offset int) ([]model.UserActionLog, int64, error)
}

type actionLogService struct {
	repo repository.ActionLogRepository
	db   *gorm.DB
}

func NewActionLogService(repo repository.ActionLogRepository, db *gorm.DB) ActionLogService {
	return &actionLogService{repo: repo, db: db}
}

func (s *actionLogService) Create(userID uint, action, details string) error {
	log := &model.UserActionLog{
		UserID:    userID,
		Action:    action,
		Details:   details,
		CreatedAt: time.Now(),
	}
	return s.repo.Create(log)
}

func (s *actionLogService) GetAll(limit, offset int) ([]model.UserActionLog, int64, error) {
	return s.repo.FindAll(limit, offset)
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/service/achievement.go
════════════════════════════════════════════════════════════════════════════════

package service

import (
	"errors"
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
)

type AchievementService interface {
	AwardAchievements(userID uint, points uint, submissions []model.Submission, courseCount int) ([]model.GlobalAchievement, error)
	Create(achievement *model.GlobalAchievement, adminID uint) error
	Update(achievementID uint, achievement *model.GlobalAchievement, adminID uint) error
	Delete(achievementID uint, adminID uint) error
	ListAll() ([]model.GlobalAchievement, error)
}

type achievementService struct {
	db       *gorm.DB
	userRepo repository.UserRepository
	logRepo  repository.ActionLogRepository
}

func NewAchievementService(db *gorm.DB, userRepo repository.UserRepository, logRepo repository.ActionLogRepository) AchievementService {
	return &achievementService{
		db:       db,
		userRepo: userRepo,
		logRepo:  logRepo,
	}
}

func (s *achievementService) AwardAchievements(userID uint, points uint, submissions []model.Submission, courseCount int) ([]model.GlobalAchievement, error) {
	logger.Log.Infof("Checking achievements for user %d with %d points, %d submissions, %d courses", userID, points, len(submissions), courseCount)

	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		logger.Log.Errorf("Failed to find user %d: %v", userID, err)
		return nil, err
	}

	var globalAchievements []model.GlobalAchievement
	if err := s.db.Find(&globalAchievements).Error; err != nil {
		logger.Log.Errorf("Failed to load global achievements: %v", err)
		return nil, err
	}

	var newAchievements []model.GlobalAchievement
	for _, ach := range globalAchievements {
		conditionMet := false
		switch ach.Condition {
		case "points_50":
			conditionMet = points >= 50
		case "points_100":
			conditionMet = points >= 100
		case "courses_1":
			conditionMet = courseCount >= 1
		case "courses_3":
			conditionMet = courseCount >= 3
		case "submissions_5":
			if len(submissions) >= 5 {
				count := 0
				for _, sub := range submissions {
					if sub.Grade >= 4.0 {
						count++
						if count >= 5 {
							conditionMet = true
							break
						}
					} else {
						count = 0
					}
				}
			}
		}

		if conditionMet {
			var count int64
			s.db.Model(&model.UserAchievement{}).
				Where("user_id = ? AND achievement_id = ?", userID, ach.ID).
				Count(&count)
			if count == 0 {
				userAch := model.UserAchievement{
					UserID:        userID,
					AchievementID: ach.ID,
					AwardedAt:     time.Now(),
				}
				if err := s.db.Create(&userAch).Error; err != nil {
					logger.Log.Errorf("Failed to assign achievement %s to user %d: %v", ach.Title, userID, err)
					return nil, err
				}
				logger.Log.Infof("Assigned achievement %s to user %d", ach.Title, userID)
				newAchievements = append(newAchievements, ach)
			}
		}
	}

	return newAchievements, nil
}

func (s *achievementService) Create(achievement *model.GlobalAchievement, adminID uint) error {
	logger.Log.Infof("Admin %d creating achievement: %s", adminID, achievement.Title)

	admin, err := s.userRepo.FindByID(adminID)
	if err != nil {
		logger.Log.Errorf("Admin %d not found: %v", adminID, err)
		return errors.New("админ не найден")
	}
	if admin.Role != model.Admin {
		logger.Log.Warnf("User %d is not an admin", adminID)
		return errors.New("недостаточно прав")
	}

	if achievement.Title == "" || achievement.Condition == "" {
		logger.Log.Errorf("Achievement title or condition cannot be empty")
		return errors.New("название или условие достижения не может быть пустым")
	}

	if err := s.db.Create(achievement).Error; err != nil {
		logger.Log.Errorf("Failed to create achievement: %v", err)
		return err
	}

	logger.Log.Infof("Achievement %s created by admin %d", achievement.Title, adminID)
	log := &model.UserActionLog{
		UserID:    adminID,
		Action:    "create_achievement",
		Details:   "Админ создал достижение: " + achievement.Title,
		CreatedAt: time.Now(),
	}
	if s.logRepo != nil {
		if err := s.logRepo.Create(log); err != nil {
			logger.Log.Errorf("Failed to create action log: %v", err)
		}
	} else {
		logger.Log.Warnf("logRepo is nil, skipping action log creation")
	}
	return nil
}

func (s *achievementService) Update(achievementID uint, achievement *model.GlobalAchievement, adminID uint) error {
	logger.Log.Infof("Admin %d updating achievement %d", adminID, achievementID)

	admin, err := s.userRepo.FindByID(adminID)
	if err != nil {
		logger.Log.Errorf("Admin %d not found: %v", adminID, err)
		return errors.New("админ не найден")
	}
	if admin.Role != model.Admin {
		logger.Log.Warnf("User %d is not an admin", adminID)
		return errors.New("недостаточно прав")
	}

	var existing model.GlobalAchievement
	if err := s.db.First(&existing, achievementID).Error; err != nil {
		logger.Log.Errorf("Achievement %d not found: %v", achievementID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("достижение не найдено")
		}
		return err
	}

	if achievement.Title == "" || achievement.Condition == "" {
		logger.Log.Errorf("Achievement title or condition cannot be empty")
		return errors.New("название или условие достижения не может быть пустым")
	}

	existing.Title = achievement.Title
	existing.Description = achievement.Description
	existing.Condition = achievement.Condition
	if err := s.db.Save(&existing).Error; err != nil {
		logger.Log.Errorf("Failed to update achievement %d: %v", achievementID, err)
		return err
	}

	logger.Log.Infof("Achievement %d updated by admin %d", achievementID, adminID)
	log := &model.UserActionLog{
		UserID:    adminID,
		Action:    "update_achievement",
		Details:   "Админ обновил достижение: " + achievement.Title,
		CreatedAt: time.Now(),
	}
	if s.logRepo != nil {
		if err := s.logRepo.Create(log); err != nil {
			logger.Log.Errorf("Failed to create action log: %v", err)
		}
	} else {
		logger.Log.Warnf("logRepo is nil, skipping action log creation")
	}
	return nil
}

func (s *achievementService) ListAll() ([]model.GlobalAchievement, error) {
	var achievements []model.GlobalAchievement
	if err := s.db.Find(&achievements).Error; err != nil {
		logger.Log.Errorf("Failed to list achievements: %v", err)
		return nil, err
	}
	log := &model.UserActionLog{
		UserID:    0,
		Action:    "list_achievements",
		Details:   "Запрошен список всех достижений",
		CreatedAt: time.Now(),
	}
	if s.logRepo != nil {
		if err := s.logRepo.Create(log); err != nil {
			logger.Log.Errorf("Failed to create action log: %v", err)
		}
	} else {
		logger.Log.Warnf("logRepo is nil, skipping action log creation")
	}
	return achievements, nil
}

func (s *achievementService) Delete(achievementID uint, adminID uint) error {
	logger.Log.Infof("Admin %d deleting achievement %d", adminID, achievementID)

	admin, err := s.userRepo.FindByID(adminID)
	if err != nil {
		logger.Log.Errorf("Admin %d not found: %v", adminID, err)
		return errors.New("админ не найден")
	}
	if admin.Role != model.Admin {
		logger.Log.Warnf("User %d is not an admin", adminID)
		return errors.New("недостаточно прав")
	}

	var achievement model.GlobalAchievement
	if err := s.db.First(&achievement, achievementID).Error; err != nil {
		logger.Log.Errorf("Achievement %d not found: %v", achievementID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("достижение не найдено")
		}
		return err
	}

	// Удаление записи из global_achievements (user_achievements удаляются автоматически благодаря ON DELETE CASCADE)
	if err := s.db.Delete(&achievement).Error; err != nil {
		logger.Log.Errorf("Failed to delete achievement %d: %v", achievementID, err)
		return err
	}

	logger.Log.Infof("Achievement %d deleted by admin %d", achievementID, adminID)
	log := &model.UserActionLog{
		UserID:    adminID,
		Action:    "delete_achievement",
		Details:   "Админ удалил достижение: " + achievement.Title,
		CreatedAt: time.Now(),
	}
	if s.logRepo != nil {
		if err := s.logRepo.Create(log); err != nil {
			logger.Log.Errorf("Failed to create action log: %v", err)
		}
	} else {
		logger.Log.Warnf("logRepo is nil, skipping action log creation")
	}
	return nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/config/config.go
════════════════════════════════════════════════════════════════════════════════

package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Ошибка загрузки .env файла")
	}

	return &Config{
		DBHost:     os.Getenv("DB_HOST"),
		DBPort:     os.Getenv("DB_PORT"),
		DBUser:     os.Getenv("DB_USER"),
		DBPassword: os.Getenv("DB_PASSWORD"),
		DBName:     os.Getenv("DB_NAME"),
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/cmd/main.go
════════════════════════════════════════════════════════════════════════════════

package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/MORFEUSik/projectschool/backend/config"
	"github.com/MORFEUSik/projectschool/backend/docs"
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/handler"
	"github.com/MORFEUSik/projectschool/backend/internal/jwt"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/middleware"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/robfig/cron/v3"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	// Загружаем .env
	if err := godotenv.Load(); err != nil {
		log.Printf("Ошибка загрузки .env: %v, использую переменные окружения", err)
	}

	// Инициализация JWT
	if err := jwt.Init(os.Getenv("JWT_SECRET")); err != nil {
		log.Fatalf("Failed to initialize JWT: %v", err)
	}

	logger.Init()
	logger.Log.Info("Starting server...")

	cfg := config.LoadConfig()
	db.Init(cfg)

	// Миграция моделей
	db.DB.AutoMigrate(
		&model.User{},
		&model.Course{},
		&model.Assignment{},
		&model.Subtask{},
		&model.SubtaskSubmission{},
		&model.Submission{},
		&model.GlobalAchievement{},
		&model.UserAchievement{},
		&model.Notification{},
		&model.Enrollment{},
		&model.UserActionLog{},
	)

	// Создание папки uploads с абсолютным путём
	wd, err := os.Getwd()
	if err != nil {
		logger.Log.Fatalf("Failed to get working directory: %v", err)
	}
	uploadDir := filepath.Join(wd, "uploads")
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		logger.Log.Fatalf("Failed to create uploads directory: %v", err)
	}

	r := gin.Default()

	// Настройка статического маршрута для /uploads
	r.Static("/uploads", uploadDir)

	// Настройка CORS
	corsConfig := cors.Config{
		AllowOrigins:     []string{"http://localhost:8080", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	}
	r.Use(cors.New(corsConfig))

	// Инициализация репозиториев
	userRepo := repository.NewUserRepository()
	courseRepo := repository.NewCourseRepository()
	assignmentRepo := repository.NewAssignmentRepository()
	submissionRepo := repository.NewSubmissionRepository()
	notificationRepo := repository.NewNotificationRepository(db.DB)
	logRepo := repository.NewActionLogRepository(db.DB)

	// Инициализация сервисов
	authService := service.NewAuthService(userRepo)
	courseService := service.NewCourseService(courseRepo, notificationRepo, userRepo, logRepo, db.DB)
	assignmentService := service.NewAssignmentService(assignmentRepo, notificationRepo, db.DB)
	submissionService := service.NewSubmissionService(submissionRepo, userRepo, assignmentRepo, notificationRepo, logRepo)
	userService := service.NewUserService(userRepo, logRepo)
	notificationService := service.NewNotificationService(notificationRepo, db.DB)
	subtaskService := service.NewSubtaskService(db.DB)
	actionLogService := service.NewActionLogService(logRepo, db.DB)
	achievementService := service.NewAchievementService(db.DB, userRepo, logRepo)

	// Настройка CRON для проверки дедлайнов
	c := cron.New()
	c.AddFunc("@every 24h", func() {
		if err := courseService.CheckDeadlines(); err != nil {
			logger.Log.Errorf("Ошибка при проверке дедлайнов: %v", err)
		}
	})
	c.Start()

	// Группа API
	api := r.Group("/api")
	{
		// Публичные маршруты
		api.POST("/register", middleware.RateLimit(), handler.Register(authService))
		api.POST("/login", middleware.RateLimit(), handler.Login(authService))
		api.GET("/leaderboard", handler.GetLeaderboard(userService))

		// Защищённые маршруты
		protected := api.Group("", handler.AuthMiddleware())
		{
			protected.GET("/users", handler.ListUsers(userService))
			protected.POST("/assignments/upload", handler.UploadFile())
			protected.GET("/users/me", handler.GetProfile(userService))
			protected.PUT("/users/me", handler.UpdateProfile(userService))
			protected.GET("/notifications", handler.GetNotifications(notificationService))
			protected.PUT("/notifications/:id/read", handler.MarkNotificationAsRead(notificationService))
			protected.GET("/users/me/submissions", handler.GetUserSubmissions(submissionService))
			protected.PUT("/users/:id/role", handler.RoleMiddleware(model.Admin), handler.UpdateRole(userService))
			protected.POST("/check-deadlines", handler.CheckDeadlines(courseService))
			protected.GET("/users/me/achievements", handler.GetMyAchievements(userService))

			// Админ-маршруты
			admin := protected.Group("/admin", handler.RoleMiddleware(model.Admin))
			{
				admin.GET("/logs", handler.GetActionLogs(actionLogService))
				admin.POST("/create-user", handler.AdminRegister(authService, userService))
			}

			// Достижения
			achievements := protected.Group("/achievements")
			{
				achievements.GET("", handler.ListAchievements(achievementService))
				achievements.POST("", handler.RoleMiddleware(model.Admin), handler.CreateAchievement(achievementService))
				achievements.PUT("/:id", handler.RoleMiddleware(model.Admin), handler.UpdateAchievement(achievementService))
				achievements.DELETE("/:id", handler.RoleMiddleware(model.Admin), handler.DeleteAchievement(achievementService))
			}

			courses := protected.Group("/courses")
			{
				courses.GET("", handler.ListCourses(courseService))
				courses.POST("", handler.RoleMiddleware(model.Teacher, model.Admin), handler.CreateCourse(courseService))

				courseGroup := courses.Group("/:id")
				{
					courseGroup.GET("", handler.GetCourse(courseService))
					courseGroup.GET("/assignments", handler.ListAssignments(assignmentService))
					courseGroup.GET("/assignments/:assignmentId", handler.GetAssignment(assignmentService))
					courseGroup.POST("/enroll", handler.RoleMiddleware(model.Student), handler.Enroll(courseService))
					courseGroup.DELETE("/enroll", handler.RoleMiddleware(model.Student), handler.Unenroll(courseService))
					courseGroup.DELETE("", handler.RoleMiddleware(model.Teacher, model.Admin), handler.DeleteCourse(courseService))
					courseGroup.GET("/stats", handler.RoleMiddleware(model.Teacher, model.Admin), handler.GetCourseStats(courseService))
					courseGroup.GET("/progress", handler.RoleMiddleware(model.Student), handler.GetCourseProgress(courseService))
				}
			}

			assignments := protected.Group("/assignments")
			{
				assignments.POST("", handler.RoleMiddleware(model.Teacher, model.Admin), handler.CreateAssignment(assignmentService))
				assignments.POST("/:id/submit", handler.RoleMiddleware(model.Student), handler.SubmitAssignment(submissionService))
				assignments.DELETE("/:id", handler.RoleMiddleware(model.Teacher, model.Admin), handler.DeleteAssignment(assignmentService))
				assignments.POST("/:id/submit-quiz", handler.RoleMiddleware(model.Student), handler.SubmitQuizAssignment(submissionService))
				assignments.GET("/:id/subtasks", handler.GetSubtasks(subtaskService))
				assignments.POST("/:id/check-subtask", handler.RoleMiddleware(model.Student), handler.CheckSubtaskAnswer(subtaskService, submissionService))
			}

			submissions := protected.Group("/submissions")
			{
				submissions.GET("", handler.RoleMiddleware(model.Teacher, model.Admin), handler.ListSubmissions(submissionService))
				submissions.PUT("/:id/grade", handler.RoleMiddleware(model.Teacher, model.Admin), handler.SetGrade(submissionService))
			}
		}
	}

	r.GET("/", func(c *gin.Context) {
		c.String(200, "🎓 Backend для ProjectSchool работает!")
	})

	// Swagger документация
	docs.SwaggerInfo.Title = "ProjectSchool API"
	docs.SwaggerInfo.Description = "API для обучающего приложения ProjectSchool"
	docs.SwaggerInfo.Version = "1.0"
	docs.SwaggerInfo.Host = "localhost:8080"
	docs.SwaggerInfo.BasePath = "/api"
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	fmt.Println("🚀 Сервер запущен на http://localhost:8080")
	fmt.Println("Swagger доступен на http://localhost:8080/swagger/index.html")
	if err := r.Run(":8080"); err != nil {
		logger.Log.Fatalf("Failed to start server: %v", err)
	}
}
