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
│   ├── images
│   │   └── noise.svg
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
│   │   │   │   └── UserManagement.tsx
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
│   ├── shared
│   │   ├── api
│   │   │   └── index.ts
│   │   ├── constants
│   │   │   └── avatars.ts
│   │   ├── hooks
│   │   │   ├── useAssignments.ts
│   │   │   ├── useAuth.tsx
│   │   │   ├── useCourses.ts
│   │   │   └── useSubmissions.ts
│   │   ├── lib
│   │   │   └── utils.ts
│   │   └── ui
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       └── QuizForm.tsx
│   └── widgets
│       ├── AvatarModal.tsx
│       └── ConfirmModal.tsx
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
  if (!localStorage.getItem('token')) {
    setIsLoading(false);
    return;
  }
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
import { useState, useEffect } from 'react';
import './globals.css';
import { Button } from '@/shared/ui/Button';
import { useUser } from '@/entities/user/hook';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="flex flex-col min-h-screen font-sans transition-colors duration-300">
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<string | null>(null);
  const { token, logout } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme = prefersDark ? 'dark' : 'light';
      setTheme(defaultTheme);
      document.body.setAttribute('data-theme', defaultTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <>
      <header className="shadow sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <nav className="flex justify-between items-center container py-3">
          <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition">
            ProjectSchool
          </Link>
          <div className="flex flex-wrap gap-3 text-sm items-center">
            <NavLink href="/courses" label="Уроки" />
            <NavLink href="/leaderboard" label="Лидерборд" />
            {token && user?.role === 'student' && (
              <>
                <NavLink href="/submissions" label="Мои решения" />
                <NavLink href="/notifications" label="🔔" className="hover:scale-105 transition-transform" />
              </>
            )}
            <NavLink href="/profile" label="Профиль" />
            {token && user?.role === 'admin' && <NavLink href="/admin" label="Админка" />}
            {token ? (
              <button onClick={logout} className="text-red-600 hover:text-red-700 transition font-medium">
                Выйти
              </button>
            ) : (
              <>
                <NavLink href="/auth/login" label="Войти" />
                <NavLink href="/auth/register" label="Регистрация" />
              </>
            )}
            <Button
              onClick={toggleTheme}
              className="ml-2 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              variant="outline"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-grow container py-8">{children}</main>

      <footer className="bg-gray-900 text-white text-center py-6 mt-auto text-sm">
        © 2025 ProjectSchool. Все права защищены.
      </footer>
    </>
  );
}

function NavLink({ href, label, className }: { href: string; label: string; className?: string }) {
  return (
    <Link
      href={href}
      className={className || "text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition font-medium"}
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
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-20">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container text-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
        >
          📚 Добро пожаловать в ProjectSchool!
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-8 card-shadow card-hover-gradient rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60 backdrop-blur hover:scale-[1.02] transition-transform duration-300">
            <p className="mb-6 text-lg text-gray-700 dark:text-gray-300 line-clamp-3">
              Обучайтесь новым навыкам, выполняйте практические задания и соревнуйтесь с другими в таблице лидеров!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/courses">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full shadow hover:scale-105 transition duration-200">
                  Перейти к урокам
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button
  variant="outline"
  className="bg-white dark:bg-gray-900 border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:text-white px-6 py-2 rounded-full hover:scale-105 transition duration-200"
>
  Лидерборд
</Button>

              </Link>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </main>
  );
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/leaderboard/page.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/entities/user/hook';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';

import { motion } from 'framer-motion';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface LeaderboardUser {
  id: number;
  username: string;
  points: number;
}

interface ErrorResponse {
  error?: string;
}

export default function LeaderboardPage() {
  const { user } = useUser();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [courseId, setCourseId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get<LeaderboardUser[]>(
        `/leaderboard${courseId ? `?course_id=${courseId}` : ''}`
      );
      setUsers(response.data);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Не удалось загрузить таблицу лидеров';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('API error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [courseId]);

  return (
    <div className="max-w-3xl mx-auto mt-12 px-4">

		<motion.h1
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.1 }}
  className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
>
  🏆 Таблица лидеров
</motion.h1>

      

      <Card
        className="p-6 mb-6 card-shadow card-hover-gradient dark:bg-gray-800 animate-fade-in-up"
        style={{ animationDelay: '200ms' }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchLeaderboard();
          }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <div
            className="relative w-full sm:flex-1 group"
            data-tooltip="Введите ID урока"
          >
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <Input
              type="number"
              placeholder="Введите ID урока"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="pl-10 border-blue-600 dark:bg-gray-700 dark:text-gray-300 focus:ring-blue-600 w-full"
            />
            <span className="absolute hidden group-hover:block bg-gray-800 dark:bg-gray-900 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              Введите ID урока
            </span>
          </div>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full hover:scale-105 transition duration-200"
          >
            Показать
          </Button>
        </form>
      </Card>

      {error && (
        <p
          className="text-center bg-red-500 dark:bg-red-600 text-white p-3 rounded mb-4 animate-pulse"
          style={{ animationDelay: '300ms' }}
        >
          {error}
        </p>
      )}

      <Card
        className="p-6 card-shadow card-hover-gradient dark:bg-gray-800 animate-fade-in-up"
        style={{ animationDelay: '300ms' }}
      >
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse h-12 w-full bg-gray-200 dark:bg-gray-700 rounded"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Нет данных</p>
        ) : (
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 uppercase">
                <th className="py-3 px-4 text-left">#</th>
                <th className="py-3 px-4 text-left">Пользователь</th>
                <th className="py-3 px-4 text-left">Баллы</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userItem, index) => (
                <tr
                  key={userItem.id}
                  className={clsx(
                    'border-b last:border-none border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition animate-fade-in-up',
                    userItem.id === user?.id && 'bg-blue-50 dark:bg-blue-900'
                  )}
                  style={{ animationDelay: `${(index + 1) * 100}ms` }}
                >
                  <td className="py-3 px-4 font-medium">
                    {index + 1}
                    {index === 0 && ' 🥇'}
                    {index === 1 && ' 🥈'}
                    {index === 2 && ' 🥉'}
                  </td>
                  <td className="py-3 px-4 line-clamp-2">{userItem.username}</td>
                  <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">
                    {userItem.points}
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
║ frontend/src/app/courses/page.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';
import { useState, useEffect, useRef } from 'react';
import { useCourses } from '@/shared/hooks/useCourses';
import { useUser } from '@/entities/user/hook';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { api } from '@/shared/api';
import Link from 'next/link';
import { AxiosError } from 'axios';
import clsx from 'clsx';
import { motion } from 'framer-motion';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const classParam = selectedClassNumber ?? 'all';
  const { courses, loading: isLoading, refetch, error, total } = useCourses(6, 0, classParam);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [classNumber, setClassNumber] = useState('');
  const [formError, setFormError] = useState('');
  const [page, setPage] = useState(1);
  const limit = 6;

  // Состояние для анимации и пагинации
  const [hoveredCourseId, setHoveredCourseId] = useState<number | null>(null); // Для масштаба
  const [descriptionCourseId, setDescriptionCourseId] = useState<number | null>(null); // Для описания
  const [clickedCourseId, setClickedCourseId] = useState<number | null>(null); // Для клика
  const [typedDescriptions, setTypedDescriptions] = useState<Record<number, string>>({});
  const [isPageTransition, setIsPageTransition] = useState(false);
  const hoverTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const typingTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());

  // Устанавливаем начальный класс для студентов
  useEffect(() => {
    if (user?.role === 'student' && user?.class_number && selectedClassNumber === undefined) {
      setSelectedClassNumber(user.class_number);
    }
  }, [user?.class_number, user?.role]);

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      hoverTimers.current.forEach((timer) => clearTimeout(timer));
      hoverTimers.current.clear();
      typingTimers.current.forEach((timer) => clearTimeout(timer));
      typingTimers.current.clear();
    };
  }, []);

  // Анимация пагинации
  useEffect(() => {
    if (!isLoading) {
      setIsPageTransition(true);
      const timer = setTimeout(() => setIsPageTransition(false), 50);
      return () => clearTimeout(timer);
    }
  }, [page, isLoading]);

  // Эффект печатания описания
  useEffect(() => {
    if (descriptionCourseId !== null) {
      const course = courses.find((c) => c.id === descriptionCourseId);
      if (course) {
        const text = course.description || 'Описание отсутствует';
        let index = 0;
        setTypedDescriptions((prev) => ({ ...prev, [descriptionCourseId]: '' }));

        const type = () => {
          setTypedDescriptions((prev) => ({
            ...prev,
            [descriptionCourseId]: text.slice(0, index + 1),
          }));
          index++;
          if (index < text.length) {
            typingTimers.current.set(descriptionCourseId, setTimeout(type, 30));
          }
        };
        type();
      }
    } else {
      typingTimers.current.forEach((timer) => clearTimeout(timer));
      typingTimers.current.clear();
      setTypedDescriptions({});
    }
  }, [descriptionCourseId, courses]);

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
      setFormError(axiosError.response?.data?.error || 'Ошибка создания урока');
    }
  };

  const handlePageChange = (newPage: number) => {
    const newOffset = (newPage - 1) * limit;
    if (newOffset < 0 || (total && newOffset >= total)) return;
    setIsPageTransition(true);
    setPage(newPage);
    refetch(limit, newOffset, selectedClassNumber ?? 'all');
  };

  // Обработчики наведения и ухода урокора
  const handleMouseEnter = (courseId: number) => {
    setHoveredCourseId(courseId); // Мгновенный масштаб
    const timer = setTimeout(() => {
      setDescriptionCourseId(courseId); // Описание через 1с
    }, 1000);
    hoverTimers.current.set(courseId, timer);
  };

  const handleMouseLeave = (courseId: number) => {
    const timer = hoverTimers.current.get(courseId);
    if (timer) {
      clearTimeout(timer);
      hoverTimers.current.delete(courseId);
    }
    setHoveredCourseId(null);
    setDescriptionCourseId(null);
  };

  // Обработчики клика
  const handleMouseDown = (courseId: number) => {
    setClickedCourseId(courseId);
  };

  const handleMouseUp = () => {
    setClickedCourseId(null);
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

  // Иконки для предметов
  const subjectIcons: Record<string, string> = {
    Математика: '🧮',
    'Русский язык': '📖',
    Физика: '⚛️',
    Химия: '🧪',
    Литература: '📚',
    Биология: '🌱',
    История: '🏛️',
  };

  // Цвета для бейджей предметов
  const subjectColors: Record<string, string> = {
    Математика: 'bg-blue-100 text-blue-800',
    'Русский язык': 'bg-purple-100 text-purple-800',
    Физика: 'bg-green-100 text-green-800',
    Химия: 'bg-yellow-100 text-yellow-800',
    Литература: 'bg-pink-100 text-pink-800',
    Биология: 'bg-teal-100 text-teal-800',
    История: 'bg-orange-100 text-orange-800',
  };

  // Фильтрация уроков
  const filteredCourses = courses.filter((course: Course) =>
    (!selectedSubject || course.subject === selectedSubject) &&
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Сообщение, если уроков нет
  let noCoursesMessage = '';
  if (!isLoading && filteredCourses.length === 0) {
    if (searchQuery) {
      noCoursesMessage = `Нет уроков, соответствующих "${searchQuery}".`;
    } else if (selectedClassNumber && selectedSubject) {
      noCoursesMessage = `Нет уроков для ${selectedClassNumber}-го класса по предмету "${selectedSubject}".`;
    } else if (selectedClassNumber) {
      noCoursesMessage = `Нет уроков для ${selectedClassNumber}-го класса.`;
    } else if (selectedSubject) {
      noCoursesMessage = `Нет уроков по предмету "${selectedSubject}".`;
    } else {
      noCoursesMessage = 'урокы отсутствуют.';
    }
  }

  if (error) return <div className="text-center mt-8 text-red-500">Ошибка: {error}</div>;

  const totalPages = total ? Math.ceil(total / limit) : 1;

  return (
    <div className="max-w-5xl mx-auto mt-12 px-4">
      
		<motion.h1
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.1 }}
  className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
>
  📚 Уроки
</motion.h1>

      {isLoading && (
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-blue-600 animate-progress"></div>
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-end">
  <div className="w-full sm:w-auto">
    <label htmlFor="searchQuery" className="block text-sm font-medium mb-1">Поиск по названию</label>
    <div className="relative">
      <Input
        id="searchQuery"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Введите название урока..."
        className="w-full max-w-xs pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300"
      />
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
    </div>
  </div>

  <div className="w-full sm:w-auto">
    <label htmlFor="classNumberFilter" className="block text-sm font-medium mb-1">Фильтр по классу</label>
    <select
      id="classNumberFilter"
      value={selectedClassNumber ?? ''}
      onChange={(e) => setSelectedClassNumber(e.target.value ? parseInt(e.target.value) : undefined)}
      className="w-full max-w-xs rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300"
    >
      <option value="">Все классы</option>
      {[...Array(11)].map((_, i) => (
        <option key={i + 1} value={i + 1}>{i + 1}</option>
      ))}
    </select>
  </div>

  <div className="w-full sm:w-auto">
    <label htmlFor="subjectFilter" className="block text-sm font-medium mb-1">Фильтр по предмету</label>
    <select
      id="subjectFilter"
      value={selectedSubject}
      onChange={(e) => setSelectedSubject(e.target.value)}
      className="w-full max-w-xs rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300"
    >
      <option value="">Все предметы</option>
      {subjects.map((subj) => (
        <option key={subj} value={subj}>{subj}</option>
      ))}
    </select>
  </div>

  {(user?.role === 'teacher' || user?.role === 'admin') && (
    <div className="w-full sm:w-auto flex items-end">
      <Button
        onClick={() => setShowCreateForm(!showCreateForm)}
        className="hover:scale-105 transition-transform duration-300 w-full"
      >
        {showCreateForm ? 'Отменить' : 'Создать урок'}
      </Button>
    </div>
  )}
</div>


     

      {showCreateForm && (
        <Card className="mb-8 animate-fade-in-up">
          <form onSubmit={handleCreateCourse} className="space-y-4">
            {formError && <p className="text-red-500 text-sm text-center">{formError}</p>}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">Название урока</label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Введите название урока" />
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-1">Предмет</label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300"
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
            <Button type="submit" className="w-full hover:scale-105 transition-transform duration-300">Создать урок</Button>
          </form>
        </Card>
      )}

      {noCoursesMessage ? (
        <p className="text-center text-gray-500 mt-8 animate-fade-in-up">{noCoursesMessage}</p>
      ) : (
        <div
          className={clsx(
            'grid grid-cols-1 sm:grid-cols-2 gap-6 transition-opacity duration-500',
            isPageTransition ? 'opacity-0' : 'opacity-100'
          )}
          key={page}
        >
          {filteredCourses.map((course: Course, index) => (
            <Link href={`/courses/${course.id}`} key={course.id}>
              <Card
                className={clsx(
                  'p-6 flex flex-col cursor-pointer card-shadow card-hover-gradient min-h-[auto]',
                  'animate-fade-in-up transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
                  {
                    'scale-102': hoveredCourseId === course.id && clickedCourseId !== course.id,
                    'scale-95': clickedCourseId === course.id,
                    'scale-100': hoveredCourseId !== course.id && clickedCourseId !== course.id,
                  },
                  { 'animation-delay-100': index % 2 === 0, 'animation-delay-200': index % 2 === 1 }
                )}
                style={{ animationDelay: `${index * 100}ms` }}
                onMouseEnter={() => handleMouseEnter(course.id)}
                onMouseLeave={() => handleMouseLeave(course.id)}
                onMouseDown={() => handleMouseDown(course.id)}
                onMouseUp={handleMouseUp}
              >
                <div>
                  <h2 className="text-xl font-bold text-blue-700 mb-2">{course.title}</h2>
                  <div
                    className={clsx(
                      'text-sm text-gray-600 transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]',
                      descriptionCourseId === course.id ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                    )}
                    style={{
                      WebkitMaskImage: descriptionCourseId === course.id ? 'linear-gradient(to right, black 80%, transparent 100%)' : 'none',
                      maskImage: descriptionCourseId === course.id ? 'linear-gradient(to right, black 80%, transparent 100%)' : 'none',
                    }}
                  >
                    {typedDescriptions[course.id] || ''}
                  </div>
                  <p className="text-sm mt-2">
                    <strong>Предмет:</strong>{' '}
                    <span className={clsx('inline-block px-2 py-1 rounded-full text-xs font-semibold', subjectColors[course.subject])}>
                      {subjectIcons[course.subject]} {course.subject}
                    </span>
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    <strong>Класс:</strong> {course.class_number}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    <strong>Преподаватель:</strong> {course.teacher.username}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {total && total > limit && (
        <div className="mt-8 flex justify-center items-center gap-4 text-sm animate-fade-in-up">
          <Button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="bg-gray-200 hover:bg-gray-300 hover:scale-105 disabled:opacity-50 transition-transform duration-300"
          >
            ⬅ Предыдущая
          </Button>
          <span className="text-gray-600">Страница {page} из {totalPages}</span>
          <Button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="bg-gray-200 hover:bg-gray-300 hover:scale-105 disabled:opacity-50 transition-transform duration-300"
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
import { ArrowRightIcon, PlusIcon, TrashIcon, ChartBarIcon, CheckCircleIcon, XCircleIcon, DocumentIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Course {
  id: number;
  title: string;
  description: string;
  subject: string;
  class_number: number;
  teacher: { username: string };
  material_url?: string; // Новое поле для ссылки на PDF
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
const { assignments, loading: assignmentsLoading, error: assignmentsError, mutate } = useAssignments(courseId);
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
  const [materialFile, setMaterialFile] = useState<File | null>(null); // Для загрузки PDF
  const [isUploading, setIsUploading] = useState(false); // Состояние загрузки

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

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialFile) {
      toast.error('Выберите PDF-файл');
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', materialFile);
    try {
      await api.post(`/courses/${courseId}/material/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMaterialFile(null);
      await fetchCourse(); // Обновляем данные урока
      toast.success('Материал загружен');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      toast.error(axiosError.response?.data?.error || 'Ошибка при загрузке материала');
    } finally {
      setIsUploading(false);
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

  const handleDeleteAssignment = async (assignmentId: number) => {
  if (!confirm('Вы уверены, что хотите удалить это задание?')) return;

  try {
    await api.delete(`/assignments/${assignmentId}`);
    toast.success('Задание удалено');

    // Увеличиваем задержку для каскадных удалений
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Явно запрашиваем новые данные с сервера
    const updatedAssignments = await api.get(`/courses/${courseId}/assignments`);
    
    // Обновляем кэш SWR
    await mutate(updatedAssignments.data, { revalidate: false });

    // Обновляем другие данные
    await Promise.all([fetchCourse(), fetchStats(), fetchProgress()]);
  } catch (err) {
    const axiosErr = err as AxiosError<ErrorResponse>;
    toast.error(axiosErr.response?.data?.error || 'Ошибка при удалении');
  }
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <p><strong>Предмет:</strong> {course.subject}</p>
          <p><strong>Класс:</strong> {course.class_number}</p>
          <p><strong>Преподаватель:</strong> {course.teacher.username}</p>
        </div>
        {course?.material_url && (
  <a
    href={`http://localhost:8080${course.material_url}`} // обязательно абсолютный путь!
    download // ← ключевая штука, иначе откроется
    className="text-blue-600 hover:underline"
  >
    Скачать PDF
  </a>
)}

        {user?.role === 'student' && (
          <div className="flex justify-start animate-fade-in-up animation-delay-200">
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
      </Card>

      {['teacher', 'admin'].includes(user?.role || '') && (
        <Card className="p-6 mb-6 card-shadow card-hover-gradient animate-fade-in-up animation-delay-200">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <DocumentIcon className="w-6 h-6" /> Загрузка материала
          </h2>
          <form onSubmit={handleUploadMaterial} className="space-y-4">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}
              className="w-full text-gray-600 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-blue-300 dark:hover:file:bg-gray-600"
            />
            <Button
              type="submit"
              className="w-full hover:scale-105 transition-transform duration-300"
              disabled={isUploading}
            >
              {isUploading ? 'Загрузка...' : 'Загрузить PDF'}
            </Button>
          </form>
        </Card>
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
        <Card className="p-6 mb-6 card-shadow card-hover-gradient animate-fade-in-up animation-delay-300">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-6 h-6" /> Статистика урока
          </h2>
          {statsLoading ? (
            <div className="text-center animate-pulse">Загрузка...</div>
          ) : statsError ? (
  <div className="text-center text-gray-500 dark:text-gray-400">
    Пока нет решений студентов
  </div>
)
 : stats ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
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
              <div className="flex justify-end">
                <Link href={`/courses/${courseId}/submissions`}>
                  <Button className="hover:scale-105 transition-transform duration-300 flex items-center gap-2">
                    <ChartBarIcon className="w-5 h-5" /> Решения студентов
                  </Button>
                </Link>
              </div>
            </>
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
  <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">{totalPoints.toFixed(1)} (из 10 за задание)</p>
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
          <div className="space-y-6">
            {assignments.map((assignment, index) => (
  <Card
    key={assignment.id}
    className={clsx(
      'p-6 relative card-shadow card-hover-gradient hover:scale-[1.01] transition-all duration-300 animate-fade-in-up',
      {
        'animation-delay-100': index % 3 === 0,
        'animation-delay-200': index % 3 === 1,
        'animation-delay-300': index % 3 === 2,
      }
    )}
  >
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-300">{assignment.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{assignment.description}</p>
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <p><strong>Макс. балл:</strong> {assignment.max_score}</p>
          <p><strong>Срок сдачи:</strong> {new Date(assignment.due_date).toLocaleString()}</p>
        </div>
      </div>

      {(user?.role === 'teacher' || user?.role === 'admin') && (
        <button
          onClick={() => handleDeleteAssignment(assignment.id)}
          className="text-red-500 hover:text-red-700"
          title="Удалить задание"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      )}
    </div>

    <div className="mt-4 flex justify-end">
      <Link href={`/courses/${courseId}/assignments/${assignment.id}`}>
        <Button variant="outline" className="flex items-center gap-2">
          Открыть <ArrowRightIcon className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  </Card>
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
                              submission.score >= 4
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : submission.score >= 3
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
  Оценка: {quizResult.grade.toFixed(1)} / 10
</p>
            <p className="font-semibold text-gray-800 dark:text-white">
              Баллы: {quizResult.totalScore.toFixed(1)} / {assignment.max_score}
            </p>
            <div className="mt-4 space-y-4">
              {quizResult.answers.map((answer, idx) => {
                const subtask = subtasks.find((s) => s.id === answer.SubtaskID);
                const subtaskScore = answer.Score + (answer.IsCorrect ? 0 : 0);
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
  Баллы за подзадание: {answer.Score.toFixed(1)}
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
import { motion, AnimatePresence } from 'framer-motion';

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
      newSubtasks[index].options = value.map(opt => opt.trimEnd());
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
      } else {
        newSubtasks[index].options = ['', ''];
        newSubtasks[index].answer = '';
        newSubtasks[index].numOptions = 2;
      }
    } else if (typeof value === 'string') {
      switch (field) {
        case 'question':
          newSubtasks[index].question = value.trimEnd();
          break;
        case 'answer':
          if (newSubtasks[index].inputType === 'multiple_choice') {
            const normalizedOptions = newSubtasks[index].options.map(opt => opt.trimEnd());
            if (value && !normalizedOptions.includes(value.trimEnd())) {
              toast.error('Правильный ответ должен быть одним из вариантов');
              return;
            }
          }
          newSubtasks[index].answer = value.trimEnd();
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
        const errorMessage = 'ID урока не указан';
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      const formData = new FormData();
      formData.append('title', data.title.trimEnd());
      if (data.description) formData.append('description', data.description.trimEnd());
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
          Question: subtask.question.trimEnd(),
          Options: subtask.inputType === 'multiple_choice' ? subtask.options.map(opt => opt.trimEnd()) : [],
          Answer: subtask.answer.trimEnd(),
          SortOrder: index + 1,
          Type: subtask.inputType || 'multiple_choice',
        }));
        formData.append('subtasks_json', JSON.stringify(normalizedSubtasks));
      }

      const response = await api.post('/assignments', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
toast.success('Задание успешно создано!');
window.location.href = `/courses/${courseId}`; // 👈 Вот здесь замена

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
  Создать задание
</motion.h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-500 mb-4"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Тип задания
            </label>
            <select
              value={assignmentType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setAssignmentType(e.target.value as 'text' | 'multiple_choice')
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            >
              <option value="text">Обычное задание</option>
              <option value="multiple_choice">Тест с вариантами</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Название
            </label>
            <Input
              {...register('title')}
              className="w-full"
              placeholder="Введите название задания"
            />
            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Описание
            </label>
            <Input
              {...register('description')}
              className="w-full"
              placeholder="Введите описание (опционально)"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Максимальный балл
            </label>
            <Input
              type="number"
              {...register('max_score', { valueAsNumber: true })}
              className="w-full"
              placeholder="Введите максимальный балл"
            />
            {errors.max_score && <p className="text-sm text-red-500 mt-1">{errors.max_score.message}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Срок сдачи
            </label>
            <Input type="datetime-local" {...register('due_date')} className="w-full" />
            {errors.due_date && <p className="text-sm text-red-500 mt-1">{errors.due_date.message}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Файл (jpg, png, pdf)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleFileChange}
              className="w-full text-gray-700 dark:text-gray-200"
            />
            {preview && (
              <div className="mt-2">
                {preview.endsWith('.pdf') ? (
                  <a
                    href={preview}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 transition hover:scale-105 inline-block"
                  >
                    Просмотреть PDF
                  </a>
                ) : (
                  <Image
                    src={preview}
                    alt="Preview"
                    width={200}
                    height={200}
                    className="rounded-lg shadow-md"
                  />
                )}
              </div>
            )}
          </div>

          {assignmentType === 'multiple_choice' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Подзадания</h3>
              <AnimatePresence>
                {subtasks.map((subtask, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg"
                  >
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Вопрос
                      </label>
                      <Input
                        value={subtask.question}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleSubtaskChange(idx, 'question', e.target.value)
                        }
                        placeholder="Введите вопрос"
                      />
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Тип подзадания
                      </label>
                      <select
                        value={subtask.inputType || 'multiple_choice'}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleSubtaskChange(idx, 'inputType', e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                      >
                        <option value="multiple_choice">С выбором ответа</option>
                        <option value="text_input">С вводом ответа</option>
                      </select>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Файл подзадания (jpg, png, pdf)
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleSubtaskChange(idx, 'image', e.target.files?.[0] || null)
                        }
                        className="w-full text-gray-700 dark:text-gray-200"
                      />
                      {subtask.imagePreview && (
                        <div className="mt-2">
                          {subtask.image?.type === 'application/pdf' ? (
                            <a
                              href={subtask.imagePreview}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 transition hover:scale-105 inline-block"
                            >
                              Просмотреть PDF
                            </a>
                          ) : (
                            <Image
                              src={subtask.imagePreview}
                              alt={`Subtask ${idx + 1} Preview`}
                              width={200}
                              height={200}
                              className="rounded-lg shadow-md"
                            />
                          )}
                        </div>
                      )}
                      {subtask.inputType !== 'text_input' && (
                        <>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Количество вариантов ответа (2–6)
                          </label>
                          <select
                            value={subtask.numOptions}
                            onChange={(e) =>
                              handleSubtaskChange(idx, 'numOptions', Number(e.target.value))
                            }
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                          >
                            {[2, 3, 4, 5, 6].map((num) => (
                              <option key={num} value={num}>
                                {num}
                              </option>
                            ))}
                          </select>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Варианты ответа
                          </label>
                          {subtask.options.map((option, optIdx) => (
                            <Input
                              key={optIdx}
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...subtask.options];
                                newOptions[optIdx] = e.target.value;
                                handleSubtaskChange(idx, 'options', newOptions);
                              }}
                              placeholder={`Вариант ${optIdx + 1}`}
                              className="mb-1"
                            />
                          ))}
                        </>
                      )}
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Правильный ответ
                      </label>
                      {subtask.inputType === 'text_input' ? (
                        <Input
                          value={subtask.answer}
                          onChange={(e) =>
                            handleSubtaskChange(idx, 'answer', e.target.value)
                          }
                          placeholder="Введите правильный ответ"
                        />
                      ) : (
                        <select
                          value={subtask.answer}
                          onChange={(e) => handleSubtaskChange(idx, 'answer', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
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
                        variant="destructive"
                        className="mt-2 hover:scale-105 transition transform"
                      >
                        Удалить подзадание
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <Button
                type="button"
                onClick={handleAddSubtask}
                className="mt-2 hover:scale-105 transition transform"
              >
                Добавить подзадание
              </Button>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="hover:scale-105 transition transform"
          >
            {isSubmitting ? 'Создаётся...' : 'Создать'}
          </Button>
        </form>
      </Card>
    </motion.div>
  );
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/notifications/page.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/entities/user/hook';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import clsx from 'clsx';
import { BellIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface ErrorResponse {
  error?: string;
}

export default function NotificationsPage() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    async function fetchNotifications() {
      setIsLoading(true);
      try {
        const response = await api.get('/notifications');
        setNotifications(response.data);
        setError(null);
      } catch (err: unknown) {
        const axiosError = err as AxiosError<ErrorResponse>;
        const errorMsg = axiosError.response?.data?.error || 'Ошибка загрузки уведомлений';
        setError(errorMsg);
        toast.error(errorMsg);
        console.error('API error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, is_read: true } : notif))
      );
      toast.success('Уведомление отмечено как прочитанное');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Ошибка пометки уведомления';
      toast.error(errorMsg);
      console.error('Mark as read error:', err);
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.is_read;
    if (filter === 'read') return notif.is_read;
    return true;
  });

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto mt-12 px-4">

			<motion.h1
			  initial={{ opacity: 0, y: 20 }}
			  animate={{ opacity: 1, y: 0 }}
			  transition={{ duration: 0.5, delay: 0.1 }}
			  className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
			>
			  🔔 Уведомления
			</motion.h1>        
        <p className="text-center text-gray-600 dark:text-gray-400">
          Пожалуйста, войдите в систему
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 px-4">
      <motion.h1
			  initial={{ opacity: 0, y: 20 }}
			  animate={{ opacity: 1, y: 0 }}
			  transition={{ duration: 0.5, delay: 0.1 }}
			  className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
			>
			  🔔 Уведомления
			</motion.h1> 

      {error && (
        <p
          className="text-center bg-red-500 dark:bg-red-600 text-white p-3 rounded mb-4 animate-pulse"
          style={{ animationDelay: '200ms' }}
        >
          {error}
        </p>
      )}

      <Card
        className="p-4 mb-6 card-shadow card-hover-gradient dark:bg-gray-800 animate-fade-in-up"
        style={{ animationDelay: '200ms' }}
      >
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            onClick={() => setFilter('all')}
            className={clsx(
              'text-sm',
              filter === 'all'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            )}
          >
            Все
          </Button>
          <Button
            onClick={() => setFilter('unread')}
            className={clsx(
              'text-sm',
              filter === 'unread'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            )}
          >
            Непрочитанные
          </Button>
          <Button
            onClick={() => setFilter('read')}
            className={clsx(
              'text-sm',
              filter === 'read'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            )}
          >
            Прочитанные
          </Button>
        </div>
      </Card>

      {isLoading && !notifications.length ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card
              key={i}
              className="p-4 card-shadow dark:bg-gray-800 animate-pulse"
            >
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-1/4 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
            </Card>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card
          className="p-6 text-center card-shadow card-hover-gradient dark:bg-gray-800 animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          <BellIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'unread'
              ? 'Нет непрочитанных уведомлений'
              : filter === 'read'
              ? 'Нет прочитанных уведомлений'
              : 'Нет уведомлений'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification, index) => (
            <Card
              key={notification.id}
              className={clsx(
                'p-4 card-shadow card-hover-gradient dark:bg-gray-800 transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg',
                notification.is_read ? 'opacity-75' : 'border-l-4 border-blue-600'
              )}
              style={{ animationDelay: `${200 + index * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                <BellIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-gray-800 dark:text-gray-200">{notification.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(notification.created_at).toLocaleString('ru-RU', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    <span
                      className={clsx(
                        'text-xs px-2 py-1 rounded-full',
                        notification.is_read
                          ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      )}
                    >
                      {notification.is_read ? 'Прочитано' : 'Непрочитано'}
                    </span>
                  </div>
                </div>
                {!notification.is_read && (
                  <Button
                    onClick={() => markAsRead(notification.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 hover:scale-105 transition-transform duration-200 flex items-center gap-1"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Прочитано
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
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
import { motion } from 'framer-motion';

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

		<motion.h1
			  initial={{ opacity: 0, y: 20 }}
			  animate={{ opacity: 1, y: 0 }}
			  transition={{ duration: 0.5, delay: 0.1 }}
			  className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
			>
			  📄 Мои решения
			</motion.h1>  


      <Card>
        {submissions.length === 0 ? (
          <p className="text-center text-gray-500">Решения отсутствуют</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-600 text-gray-500 uppercase">
                  <th className="py-2 px-3">Задание</th>
                  <th className="py-2 px-3">урок</th>
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
import { motion } from 'framer-motion';

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
		<motion.h1
			  initial={{ opacity: 0, y: 20 }}
			  animate={{ opacity: 1, y: 0 }}
			  transition={{ duration: 0.5, delay: 0.1 }}
			  className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
			>
			 Регистрация
			</motion.h1>
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
import { motion } from 'framer-motion';

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto mt-12 px-4">
  <motion.h1
			  initial={{ opacity: 0, y: 20 }}
			  animate={{ opacity: 1, y: 0 }}
			  transition={{ duration: 0.5, delay: 0.1 }}
			  className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
			>
			 Вход
			</motion.h1>  
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
import { AvatarModal } from '@/widgets/AvatarModal';
import { avatarOptions } from '@/shared/constants/avatars';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface ErrorResponse {
  error?: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  subject: string;
  class_number: number;
  teacher: { username: string };
}

// Иконки для предметов
const subjectIcons: Record<string, string> = {
  Математика: '🧮',
  'Русский язык': '📖',
  Физика: '⚛️',
  Химия: '🧪',
  Литература: '📚',
  Биология: '🌱',
  История: '🏛️',
};

// Цвета для бейджей предметов
const subjectColors: Record<string, string> = {
  Математика: 'bg-blue-100 text-blue-800',
  'Русский язык': 'bg-purple-100 text-purple-800',
  Физика: 'bg-green-100 text-green-800',
  Химия: 'bg-yellow-100 text-yellow-800',
  Литература: 'bg-pink-100 text-pink-800',
  Биология: 'bg-teal-100 text-teal-800',
  История: 'bg-orange-100 text-orange-800',
};

export default function ProfilePage() {
  const { user, isLoading, error, refetch } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [editError, setEditError] = useState('');
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setFullName(user.full_name || '');
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    if (!user) return;
    setIsCoursesLoading(true);
    setCoursesError('');
    try {
      let response;
      if (user.role === 'student') {
        response = await api.get('/enrollments', { params: { userID: user.id } });
      } else if (user.role === 'teacher' || user.role === 'admin') {
        response = await api.get('/courses', { params: { teacherID: user.id } });
      }
      setCourses(response.data.courses || []);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Ошибка загрузки курсов';
      setCoursesError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsCoursesLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    try {
      await api.put('/users/me', { username, email, full_name: fullName });
      await refetch();
      setIsEditing(false);
      toast.success('Профиль обновлён!');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Ошибка обновления профиля';
      setEditError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleAvatarUpdate = async (url: string) => {
    try {
      await refetch();
      toast.success('Аватар обновлён!');
    } catch (err) {
      toast.error('Ошибка обновления аватара');
      console.error('Avatar update error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center mt-12 px-4">
        <div className="animate-pulse h-24 w-24 rounded-full bg-gray-200 mx-auto mb-4" />
        <div className="animate-pulse h-6 w-48 bg-gray-200 rounded mx-auto" />
      </div>
    );
  }
  if (error) {
    return <div className="text-center mt-12 text-red-500 px-4">Ошибка: {error}</div>;
  }
  if (!user) {
    return <div className="text-center mt-12 px-4">Пользователь не найден</div>;
  }

  return (
    <div className="min-h-[100dvh]">
      <div className="max-w-4xl mx-auto mt-12 px-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
        >
          Профиль
        </motion.h1>

        <Card
          className="p-6 mb-6 card-transparent card-shadow card-hover-gradient animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex flex-col items-center sm:items-start">
              {isLoading ? (
                <div className="animate-pulse h-24 w-24 rounded-full bg-gray-200" />
              ) : (
                <img
                  src={user?.avatar_url || avatarOptions[0]}
                  alt="avatar"
                  className="w-24 h-24 rounded-full border-4 border-blue-600 dark:border-blue-400 object-cover"
                />
              )}
              <Button
                onClick={() => setAvatarModalOpen(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
              >
                Выбрать аватар
              </Button>
            </div>

            {isEditing ? (
              <form onSubmit={handleEdit} className="flex-1 space-y-4">
                {editError && (
                  <p className="bg-red-500 dark:bg-red-600 text-white dark:text-gray-100 p-3 rounded text-sm animate-pulse mx-auto text-center">
                    {editError}
                  </p>
                )}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
                  >
                    Имя
                  </label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Введите имя"
                    className="border-blue-600 dark:bg-gray-800 dark:text-gray-300 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
                  >
                    ФИО
                  </label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Иванов Иван Иванович"
                    className="border-blue-600 dark:bg-gray-800 dark:text-gray-300 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="example@domain.com"
                    className="border-blue-600 dark:bg-gray-800 dark:text-gray-300 focus:ring-blue-600"
                  />
                </div>
                <div
                  className="flex flex-col sm:flex-row justify-end gap-3 pt-3 animate-pulse"
                  style={{ animationDelay: '400ms' }}
                >
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-600/20 transition-all duration-200"
                  >
                    Сохранить
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-600 hover:bg-blue-600 hover:text-white dark:hover:text-white transition-colors duration-200"
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex-1 space-y-4 text-gray-900 dark:text-gray-100">
                <p>
                  <strong>Имя:</strong> {user.username}
                </p>
                {user.full_name && (
                  <p>
                    <strong>ФИО:</strong> {user.full_name}
                  </p>
                )}
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p
                  className="relative group"
                  data-tooltip="Роль определяет ваш уровень доступа"
                >
                  <strong>Роль:</strong> {user.role}
                  <span className="absolute hidden group-hover:block bg-gray-800 dark:bg-gray-900 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    Роль определяет ваш уровень доступа
                  </span>
                </p>
                {user.role === 'student' && (
                  <p>
                    <strong>Класс:</strong> {user.class_number}
                  </p>
                )}
                <p>
                  <strong>Баллы:</strong>{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {user.points ?? 0}
                  </span>
                </p>
                <div
                  className="mt-6 flex flex-col sm:flex-row gap-3 justify-end animate-pulse"
                  style={{ animationDelay: '400ms' }}
                >
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-600/20 transition-all duration-200"
                  >
                    Редактировать профиль
                  </Button>
                  {user.role === 'student' && (
                    <Link href="/achievements">
                      <Button
                        variant="outline"
                        className="border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-600 hover:bg-blue-600 hover:text-white dark:hover:text-white transition-colors duration-200"
                      >
                        Мои достижения 🏆
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card
          className="p-6 card-transparent card-shadow card-hover-gradient animate-fade-in-up"
          style={{ animationDelay: '400ms' }}
        >
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
            {user.role === 'student' ? 'Мои уроки' : 'Созданные уроки'}
          </h2>
          {isCoursesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse h-24 w-full bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          ) : coursesError ? (
            <p className="text-center text-red-500">{coursesError}</p>
          ) : courses.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              {user.role === 'student' ? 'Вы не записаны на уроки' : 'Вы не создали уроки'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {courses.map((course, index) => (
                <Link href={`/courses/${course.id}`} key={course.id}>
                  <Card
                    className={clsx(
                      'p-6 flex flex-col cursor-pointer card-transparent card-shadow card-hover-gradient min-h-[auto]',
                      'animate-fade-in-up transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
                      'hover:scale-102'
                    )}
                    style={{ animationDelay: `${(index + 1) * 100}ms` }}
                  >
                    <h3 className="text-lg font-bold text-blue-700 mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                    <p className="text-sm mt-2">
                      <strong>Предмет:</strong>{' '}
                      <span
                        className={clsx(
                          'inline-block px-2 py-1 rounded-full text-xs font-semibold',
                          subjectColors[course.subject]
                        )}
                      >
                        {subjectIcons[course.subject]} {course.subject}
                      </span>
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      <strong>Класс:</strong> {course.class_number}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      <strong>Преподаватель:</strong> {course.teacher.username}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <AvatarModal
          isOpen={avatarModalOpen}
          onClose={() => setAvatarModalOpen(false)}
          currentAvatar={user?.avatar_url}
          onAvatarUpdate={handleAvatarUpdate}
        />
      </div>
    </div>
  );
}


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/achievements/page.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/entities/user/hook';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface Achievement {
  ID: number;
  Title: string;
  Description: string;
  ConditionType: string;
  Threshold: number;
}

interface UserAchievement {
  UserID: number;
  AchievementID: number;
  AwardedAt: string;
  Achievement: Achievement;
}

export default function AchievementsPage() {
  const { user } = useUser(); // Для авторизации
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAchievements() {
      try {
        const response = await api.get<UserAchievement[]>('/users/me/achievements');
        setAchievements(response.data);
      } catch (err: unknown) {
        const errorMsg = 'Не удалось загрузить достижения';
        setError(errorMsg);
        toast.error(errorMsg);
        console.error('API error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAchievements();
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-12 px-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
        >
          🏅 Мои достижения
        </motion.h1>
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse h-32 w-full bg-gray-200 dark:bg-gray-700 rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-12 px-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
        >
          🏅 Мои достижения
        </motion.h1>
        <p
          className="text-center bg-red-500 dark:bg-red-600 text-white p-3 rounded mb-4 animate-pulse"
          style={{ animationDelay: '200ms' }}
        >
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 px-4">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
      >
        🏅 Мои достижения
      </motion.h1>

      {achievements.length === 0 ? (
        <p
          className="text-center text-gray-500 dark:text-gray-400 animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          Вы ещё не получили ни одного достижения.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {achievements.map((ach, index) => {
            const awardedDate = new Date(ach.AwardedAt);
            const isNew = (Date.now() - awardedDate.getTime()) / (1000 * 60 * 60 * 24) < 7;
            return (
              <Card
                key={index}
                className={clsx(
                  'p-5 card-shadow card-hover-gradient dark:bg-gray-800 hover:scale-105 transition-transform duration-200 animate-fade-in-up group',
                  isNew && 'animate-pulse'
                )}
                style={{ animationDelay: `${200 + index * 100}ms` }}
                data-tooltip={`Получено: ${awardedDate.toLocaleString('ru-RU', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🏅</span>
                  <div>
                    <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                      {ach.Achievement.Title}
                    </h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1 line-clamp-2">
                      {ach.Achievement.Description}
                    </p>
                    <p className="text-xs text-gray-400">
                      Получено:{' '}
                      {awardedDate.toLocaleString('ru-RU', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                </div>
                <span className="absolute hidden group-hover:block bg-gray-800 dark:bg-gray-900 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  Получено: {awardedDate.toLocaleString('ru-RU', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </Card>
            );
          })}
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
import UserManagement from './components/UserManagement';
import AchievementManagement from './components/AchievementManagement';
import ActionLogs from './components/ActionLogs';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import clsx from 'clsx';
import { UserIcon, TrophyIcon, ClipboardIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import ConfirmModal from '@/widgets/ConfirmModal';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  class_number: number;
  full_name: string;
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
  const [activeTab, setActiveTab] = useState<'users' | 'achievements' | 'logs'>('users');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [roleModal, setRoleModal] = useState<{ isOpen: boolean; user: User | null; newRole: string }>({
    isOpen: false,
    user: null,
    newRole: '',
  });
  const [deleteUserModal, setDeleteUserModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  });
  const [deleteAchievementModal, setDeleteAchievementModal] = useState<{ isOpen: boolean; achievement: Achievement | null }>({
    isOpen: false,
    achievement: null,
  });

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
      const errorMsg = axiosError.response?.data?.error || 'Ошибка загрузки данных';
      setFormError(errorMsg);
      console.error('API error:', err);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const handleUpdateRole = async () => {
    if (!roleModal.user) return;

    try {
      await api.put(`/users/${roleModal.user.id}/role`, { role: roleModal.newRole.toLowerCase() });
      fetchData();
      setRoleModal({ isOpen: false, user: null, newRole: '' });
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Ошибка изменения роли';
      setFormError(errorMsg);
    }
  };

  const handleDeleteUser = async () => {
  if (!deleteUserModal.user) return;

  try {
    await api.delete(`/admin/users/${deleteUserModal.user.id}`); // Updated path
    fetchData();
    setDeleteUserModal({ isOpen: false, user: null });
  } catch (err: unknown) {
    const axiosError = err as AxiosError<ErrorResponse>;
    const errorMsg = axiosError.response?.data?.error || 'Ошибка удаления пользователя';
    setFormError(errorMsg);
  }
};

  const handleDeleteAchievement = async () => {
    if (!deleteAchievementModal.achievement) return;

    try {
      await api.delete(`/achievements/${deleteAchievementModal.achievement.id}`);
      fetchData();
      setDeleteAchievementModal({ isOpen: false, achievement: null });
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Ошибка удаления достижения';
      setFormError(errorMsg);
    }
  };

  const tabs = [
    {
      id: 'users',
      label: 'Управление пользователями',
      icon: UserIcon,
      component: (
        <UserManagement
          users={users}
          onSuccess={fetchData}
          setFormError={setFormError}
          openRoleModal={(user) =>
            setRoleModal({ isOpen: true, user, newRole: user.role })
          }
          openDeleteModal={(user) => setDeleteUserModal({ isOpen: true, user })}
        />
      ),
    },
    {
      id: 'achievements',
      label: 'Управление достижениями',
      icon: TrophyIcon,
      component: (
        <AchievementManagement
          achievements={achievements}
          onSuccess={fetchData}
          setFormError={setFormError}
          openDeleteModal={(achievement) => setDeleteAchievementModal({ isOpen: true, achievement })}
        />
      ),
    },
    { id: 'logs', label: 'Логи действий', icon: ClipboardIcon, component: <ActionLogs logs={logs} /> },
  ] as const;

  if (isLoading) {
    return (
      <div className="w-full h-auto flex flex-col bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)]">
        <div className="max-w-[140rem] mx-auto mt-8 px-4 flex flex-col flex-1">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
          >
            🛠 Админ-панель
          </motion.h1>
          <div className="space-y-4 flex-1">
            {[...Array(3)].map((_, i) => (
              <Card
                key={i}
                className="p-6 rounded-2xl dark:bg-gray-800 animate-pulse"
              >
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
              </Card>
            ))}
          </div>
        </div>
        <footer className="bg-gray-100 dark:bg-gray-800 text-center py-4 mt-auto">
          <p className="text-gray-600 dark:text-gray-400 text-sm">© 2025 Admin Panel</p>
        </footer>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="w-full h-auto flex flex-col bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)]">
        <div className="max-w-[140rem] mx-auto mt-8 px-4 flex flex-col flex-1">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
          >
            🛠 Админ-панель
          </motion.h1>
          <p
            className="text-center bg-red-500 dark:bg-red-600 text-white p-3 rounded-2xl mb-4 animate-pulse"
            style={{ animationDelay: '200ms' }}
          >
            Доступ запрещён
          </p>
        </div>
        <footer className="bg-gray-100 dark:bg-gray-800 text-center py-4 mt-auto">
          <p className="text-gray-600 dark:text-gray-400 text-sm">© 2025 Admin Panel</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="w-full h-auto flex flex-col bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)]">
      <div className="max-w-[140rem] mx-auto mt-8 px-4 flex flex-col md:flex-row gap-8 flex-1 rounded-2xl shadow-lg overflow-hidden">
        <Button
          className="md:hidden bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-2xl mb-4 flex items-center gap-2 hover:scale-105 transition-transform duration-200"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          Меню
        </Button>

        <Card
          className={clsx(
            'w-full md:w-64 rounded-2xl dark:bg-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 transition-transform duration-300',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
            'fixed md:static top-0 left-0 h-full md:h-auto z-40 shadow-xl md:shadow-none p-6'
          )}
        >
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
            <ClipboardIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Панель управления
          </h2>
          <nav className="space-y-2">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsSidebarOpen(false);
                  }}
                  className={clsx(
                    'w-full flex items-center gap-3 text-left py-3 px-4 rounded-2xl transition-transform duration-200 hover:scale-105',
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 animate-pulse'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600',
                    'animate-slide-in-left'
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Icon className="h-6 w-6 hover:animate-bounce" />
                  <span className="flex-1">{tab.label}</span>
                </Button>
              );
            })}
          </nav>
        </Card>

        <div className="flex-1 flex flex-col">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
          >
            🛠 Админ-панель
          </motion.h1>

          {formError && (
            <p
              className="text-center bg-red-500 dark:bg-red-600 text-white p-3 rounded-2xl mb-6 animate-pulse"
              style={{ animationDelay: '200ms' }}
            >
              {formError}
            </p>
          )}

          <div className="relative flex-1 flex flex-col">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={clsx(
                  'transition-all duration-600 ease-in-out w-full',
                  activeTab === tab.id
                    ? 'opacity-100 transform translate-x-0'
                    : 'opacity-0 transform translate-x-10 pointer-events-none absolute top-0 left-0 w-full'
                )}
              >
                <Card
                  className={clsx(
                    'p-8 rounded-2xl dark:bg-gray-800 animate-fade-in-up border-l-4 w-full',
                    tab.id === 'users' && 'border-blue-600',
                    tab.id === 'achievements' && 'border-yellow-600',
                    tab.id === 'logs' && 'border-gray-600'
                  )}
                  style={{ animationDelay: '200ms' }}
                >
                  <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
                    {tab.label}
                  </h2>
                  {tab.component}
                </Card>
              </div>
            ))}
          </div>
        </div>

        {roleModal.isOpen && roleModal.user && (
          <ConfirmModal
            isOpen={roleModal.isOpen}
            onClose={() => setRoleModal({ isOpen: false, user: null, newRole: '' })}
            onConfirm={handleUpdateRole}
            title="Изменить роль пользователя"
            message={
              <div>
                Изменить роль пользователя <span>{roleModal.user.username}</span> на:
                <select
                  value={roleModal.newRole}
                  onChange={(e) =>
                    setRoleModal({ ...roleModal, newRole: e.target.value })
                  }
                  className="mt-2 p-2 border border-blue-600 rounded-lg w-full dark:bg-gray-800 dark:text-gray-300"
                >
                  <option value="student">Ученик</option>
                  <option value="teacher">Учитель</option>
                  <option value="admin">Админ</option>
                </select>
              </div>
            }
            confirmText="Изменить"
            cancelText="Отмена"
          />
        )}

        {deleteUserModal.isOpen && deleteUserModal.user && (
          <ConfirmModal
            isOpen={deleteUserModal.isOpen}
            onClose={() => setDeleteUserModal({ isOpen: false, user: null })}
            onConfirm={handleDeleteUser}
            title="Удалить пользователя"
            message={`Вы уверены, что хотите удалить пользователя ${deleteUserModal.user.username} (${deleteUserModal.user.full_name || 'Без ФИО'})?`}
            confirmText="Удалить"
            cancelText="Отмена"
            confirmButtonClass="bg-red-600 hover:bg-red-700"
          />
        )}

        {deleteAchievementModal.isOpen && deleteAchievementModal.achievement && (
          <ConfirmModal
            isOpen={deleteAchievementModal.isOpen}
            onClose={() => setDeleteAchievementModal({ isOpen: false, achievement: null })}
            onConfirm={handleDeleteAchievement}
            title="Удалить достижение"
            message={`Вы уверены, что хотите удалить достижение "${deleteAchievementModal.achievement.title}"?`}
            confirmText="Удалить"
            cancelText="Отмена"
            confirmButtonClass="bg-red-600 hover:bg-red-700"
          />
        )}
      </div>
      <footer className="bg-gray-100 dark:bg-gray-800 text-center py-4 mt-auto">
        <p className="text-gray-600 dark:text-gray-400 text-sm">© 2025 Admin Panel</p>
        </footer>
    </div>
  );
}



════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/admin/components/ActionLogs.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import clsx from 'clsx';
import {
  UserIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { unparse } from 'papaparse';
import toast from 'react-hot-toast';

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
}

interface LogEntry {
  id: number;
  user_id: number;
  action: string;
  details: string;
  created_at: string;
  user?: User | null;
}

type FilterType = 'all' | 'create' | 'update' | 'delete' | 'enroll' | 'submit' | 'achieve';

interface FilterOption {
  id: FilterType;
  label: string;
}

interface ActionLogsProps {
  logs: LogEntry[];
}

export default function ActionLogs({ logs }: ActionLogsProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filterOptions: FilterOption[] = [
    { id: 'all', label: 'Все' },
    { id: 'create', label: 'Создание' },
    { id: 'update', label: 'Обновление' },
    { id: 'delete', label: 'Удаление' },
    { id: 'enroll', label: 'Уроки' },
    { id: 'submit', label: 'Оценки' },
    { id: 'achieve', label: 'Достижения' },
  ];

  const getActionType = (action: string = '') => {
    if (action.includes('create'))
      return { id: 'create', label: 'Создание', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: PlusIcon };
    if (action.includes('update'))
      return { id: 'update', label: 'Обновление', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: PencilIcon };
    if (action.includes('delete'))
      return { id: 'delete', label: 'Удаление', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: TrashIcon };
    if (action.includes('enroll'))
      return { id: 'enroll', label: 'Запись на урок', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', icon: AcademicCapIcon };
    if (action.includes('submit'))
      return { id: 'submit', label: 'Сдача задания', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: CheckCircleIcon };
    if (action.includes('achieve'))
      return { id: 'achieve', label: 'Получение достижения', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300', icon: StarIcon };
    return null;
  };

  const filteredLogs = logs
    .filter((log) => {
      if (!log.action) return false;
      const actionType = getActionType(log.action);
      if (!actionType) return false;
      return filter === 'all' || filter === actionType.id;
    })
    .filter((log) => {
      if (!search) return true;
      const searchTerm = search.toLowerCase();
      return (
        log.user_id.toString().includes(searchTerm) ||
        (log.details?.toLowerCase() || '').includes(searchTerm) ||
        (log.user?.username?.toLowerCase() || '').includes(searchTerm) ||
        (log.user?.full_name?.toLowerCase() || '').includes(searchTerm) ||
        (log.user?.role?.toLowerCase() || '').includes(searchTerm)
      );
    })
    .filter((log) => {
      if (!startDate && !endDate) return true;
      const logDate = new Date(log.created_at);
      if (isNaN(logDate.getTime())) return false;
      if (startDate && !endDate) return logDate >= startDate;
      if (!startDate && endDate) return logDate <= endDate;
      return logDate >= startDate! && logDate <= endDate!;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB.getTime() - dateA.getTime();
    });

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCSV = () => {
    try {
      const csvData = filteredLogs.map((log) => ({
        ID: log.id,
        UserID: log.user_id,
        Username: log.user?.username || (log.user_id === 0 ? 'Система' : 'Неизвестно'),
        FullName: log.user?.full_name || (log.user_id === 0 ? 'Система' : 'Неизвестно'),
        Role: log.user?.role || (log.user_id === 0 ? 'Система' : 'Неизвестно'),
        Action: getActionType(log.action)?.label || 'Неизвестно',
        Details: log.details,
        Date: new Date(log.created_at).toLocaleString('ru-RU'),
      }));
      const csv = unparse(csvData, { header: true });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'action_logs.csv';
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Логи экспортированы в CSV');
    } catch (error) {
      console.error('CSV Export Error:', error);
      toast.error('Ошибка при экспорте CSV');
    }
  };

  return (
    <div className="w-[50rem] mx-auto space-y-4 flex flex-col">
      <Card className="p-4 w-full shadow-sm rounded-xl dark:bg-gray-800">
        <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((f) => (
              <Button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={clsx(
                  'text-sm px-4 py-2',
                  filter === f.id
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                )}
              >
                {f.label}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Input
              placeholder="Поиск по ID, описанию, нику, ФИО или роли"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-blue-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-300" />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1">
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                placeholderText="Дата с"
                className="w-full pl-10 pr-4 py-2 border border-blue-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm"
                dateFormat="dd.MM.yyyy"
              />
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-300" />
            </div>
            <div className="relative flex-1">
              <DatePicker
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date)}
                placeholderText="Дата по"
                className="w-full pl-10 pr-4 py-2 border border-blue-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm"
                dateFormat="dd.MM.yyyy"
              />
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-300" />
            </div>
          </div>
          <Button
            onClick={handleExportCSV}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-4 py-2 rounded-md hover:ring-2 hover:ring-green-300 transition-all duration-200"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Экспорт CSV
          </Button>
        </div>
      </Card>
      <div className="flex-1 overflow-y-auto">
        {paginatedLogs.length === 0 ? (
          <Card className="p-6 text-center w-full shadow-sm rounded-xl dark:bg-gray-800">
            <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-300 mb-2" />
            <p className="text-gray-600 dark:text-gray-300">
              Нет логов для "{filterOptions.find((f) => f.id === filter)?.label || filter}". Действия появятся позже!
            </p>
          </Card>
        ) : (
          <ul className="w-full space-y-4">
            {paginatedLogs.map((log, index) => {
              const actionType = getActionType(log.action);
              if (!actionType) return null;
              const { label, color, icon: ActionIcon } = actionType;
              return (
                <li key={log.id}>
                  <Card
                    className={clsx(
                      'p-4 w-full shadow-sm rounded-xl dark:bg-gray-800 hover:shadow-md'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-300 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {log.user?.full_name || (log.user_id === 0 ? 'Система' : `Пользователь ${log.user_id}`)}
                            </span>
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              (@{log.user?.username || (log.user_id === 0 ? 'system' : 'unknown')})
                            </span>
                          </div>
                          <span className={clsx('text-xs px-2 py-1 rounded-full flex items-center gap-1', color)}>
                            <ActionIcon className="h-4 w-4" />
                            {label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          <span className="font-medium">Роль:</span> {log.user?.role || (log.user_id === 0 ? 'Система' : 'Неизвестно')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{log.details}</p>
                        <span className="text-xs text-gray-500 dark:text-gray-300">
                          {new Date(log.created_at).toLocaleString('ru-RU', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {totalPages > 1 && (
        <Card className="p-4 w-full shadow-sm rounded-xl dark:bg-gray-800 mt-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 items-center">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 p-2 rounded-md"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Страница {currentPage} из {totalPages} (Всего логов: {filteredLogs.length})
              </span>
              <Button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 p-2 rounded-md"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </Button>
            </div>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="p-2 border border-blue-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300"
            >
              <option value={5}>5 на странице</option>
              <option value={10}>10 на странице</option>
              <option value={50}>50 на странице</option>
            </select>
          </div>
        </Card>
      )}
    </div>
  );
}



════════════════════════════════════════════════════════════════════════════════
║ frontend/src/app/admin/components/UserManagement.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';

import { useState, FormEvent } from 'react';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { EnvelopeIcon, LockClosedIcon, UserGroupIcon, UserIcon, ArrowUpIcon, ArrowDownIcon, TrashIcon } from '@heroicons/react/24/outline';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  class_number: number;
}

interface ErrorResponse {
  error?: string;
}

interface UserManagementProps {
  users: User[];
  onSuccess: () => void;
  setFormError: (error: string) => void;
  openRoleModal: (user: User) => void;
  openDeleteModal: (user: User) => void;
}

export default function UserManagement({ users, onSuccess, setFormError, openRoleModal, openDeleteModal }: UserManagementProps) {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState('teacher');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'teacher' | 'student'>('all');
  const [filterClass, setFilterClass] = useState<number | 'all'>('all');
  const [filterFullName, setFilterFullName] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof User | 'class_number'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const validateCreateForm = () => {
    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserEmail)) {
      setEmailError('Введите корректный email');
      isValid = false;
    } else {
      setEmailError('');
    }
    if (newUserPassword.length < 6) {
      setPasswordError('Пароль должен быть не менее 6 символов');
      isValid = false;
    } else {
      setPasswordError('');
    }
    if (!newUserFullName) {
      setFullNameError('ФИО обязательно');
      isValid = false;
    } else {
      setFullNameError('');
    }
    return isValid;
  };

  const handleRegisterUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateCreateForm()) return;

    try {
      await api.post('/admin/create-user', {
        email: newUserEmail,
        password: newUserPassword,
        full_name: newUserFullName,
        role: newUserRole,
      });
      toast.success('Пользователь создан');
      onSuccess();
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
      setNewUserRole('teacher');
    } catch (err: any) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Ошибка регистрации';
      setFormError(errorMsg);
      toast.error(errorMsg);
      console.error('Create user error:', err);
    }
  };

  const handleSort = (column: keyof User | 'class_number') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const roleLabels: { [key: string]: string } = {
    student: 'Ученик',
    teacher: 'Учитель',
    admin: 'Админ',
  };

  const filteredUsers = users
    .filter((user) => {
      if (filterRole === 'all') return true;
      if (filterRole === user.role) {
        if (filterRole === 'student' && filterClass !== 'all') {
          return user.class_number === filterClass;
        }
        return true;
      }
      return false;
    })
    .filter((user) => {
      if (!filterFullName) return true;
      return user.full_name.toLowerCase().includes(filterFullName.toLowerCase());
    })
    .sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="w-[50rem] mx-auto">
      <Card className="p-4 rounded-xl dark:bg-gray-800 animate-fade-in-up border-l-4 border-green-500 w-full mb-4 shadow-sm" style={{ animationDelay: '300ms' }}>
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Создать пользователя</h3>
        <form onSubmit={handleRegisterUser} className="grid gap-3 sm:grid-cols-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-4 w-4 text-gray-400 dark:text-gray-300" />
            </div>
            <Input
              type="email"
              placeholder="Email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className={clsx(
                'pl-8 text-sm border-blue-500 dark:bg-gray-800 dark:text-gray-200',
                emailError && 'border-red-500'
              )}
              required
            />
            {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <LockClosedIcon className="h-4 w-4 text-gray-400 dark:text-gray-300" />
            </div>
            <Input
              type="password"
              placeholder="Пароль"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              className={clsx(
                'pl-8 text-sm border-blue-500 dark:bg-gray-800 dark:text-gray-200',
                passwordError && 'border-red-500'
              )}
              required
            />
            {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <UserIcon className="h-4 w-4 text-gray-400 dark:text-gray-300" />
            </div>
            <Input
              type="text"
              placeholder="ФИО"
              value={newUserFullName}
              onChange={(e) => setNewUserFullName(e.target.value)}
              className={clsx(
                'pl-8 text-sm border-blue-500 dark:bg-gray-800 dark:text-gray-200',
                fullNameError && 'border-red-500'
              )}
              required
            />
            {fullNameError && <p className="text-red-500 text-xs mt-1">{fullNameError}</p>}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <UserGroupIcon className="h-4 w-4 text-gray-400 dark:text-gray-300" />
            </div>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              className="p-2 pl-8 text-sm border border-blue-500 rounded-lg w-full dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="teacher">Учитель</option>
              <option value="admin">Админ</option>
            </select>
          </div>
          <Button
            type="submit"
            className="sm:col-span-2 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 hover:scale-105 transition-transform duration-200"
          >
            Создать
          </Button>
        </form>
      </Card>

      <Card className="p-3 rounded-xl dark:bg-gray-800 animate-fade-in-up w-full mb-4 shadow-sm" style={{ animationDelay: '200ms' }}>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'Все' },
              { value: 'teacher', label: 'Учитель' },
              { value: 'student', label: 'Ученик' },
            ].map((opt) => (
              <Button
                key={opt.value}
                onClick={() => {
                  setFilterRole(opt.value as 'all' | 'teacher' | 'student');
                  if (opt.value !== 'student') setFilterClass('all');
                }}
                className={clsx(
                  'text-xs py-1 px-3',
                  filterRole === opt.value
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                )}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:w-48">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <UserIcon className="h-4 w-4 text-gray-400 dark:text-gray-300" />
            </div>
            <Input
              placeholder="Поиск по ФИО"
              value={filterFullName}
              onChange={(e) => setFilterFullName(e.target.value)}
              className="pl-8 text-sm border-blue-500 dark:bg-gray-800 dark:text-gray-200 w-full"
            />
          </div>
          {filterRole === 'student' && (
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="p-2 text-sm border border-blue-500 rounded-lg dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="all">Все классы</option>
              {[...Array(11)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} класс
                </option>
              ))}
            </select>
          )}
          <Button
            onClick={() => {
              setFilterRole('all');
              setFilterClass('all');
              setFilterFullName('');
              setSortColumn('id');
              setSortDirection('asc');
            }}
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs py-1 px-3"
          >
            Сбросить
          </Button>
        </div>
      </Card>

      <Card className="p-4 rounded-xl dark:bg-gray-800 animate-fade-in-up w-full shadow-sm" style={{ animationDelay: '300ms' }}>
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Список пользователей</h3>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-6">
            <UserIcon className="h-10 w-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">Нет пользователей по выбранным фильтрам</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs text-left text-gray-800 dark:text-gray-200">
              <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-2 py-2 cursor-pointer min-w-[60px]" onClick={() => handleSort('id')}>
                    ID
                    {sortColumn === 'id' && (
                      sortDirection === 'asc' ? <ArrowUpIcon className="h-3 w-3 inline ml-1" /> : <ArrowDownIcon className="h-3 w-3 inline ml-1" />
                    )}
                  </th>
                  <th className="px-2 py-2 cursor-pointer min-w-[100px]" onClick={() => handleSort('username')}>
                    Имя
                    {sortColumn === 'username' && (
                      sortDirection === 'asc' ? <ArrowUpIcon className="h-3 w-3 inline ml-1" /> : <ArrowDownIcon className="h-3 w-3 inline ml-1" />
                    )}
                  </th>
                  <th className="px-2 py-2 cursor-pointer min-w-[100px]" onClick={() => handleSort('full_name')}>
                    ФИО
                    {sortColumn === 'full_name' && (
                      sortDirection === 'asc' ? <ArrowUpIcon className="h-3 w-3 inline ml-1" /> : <ArrowDownIcon className="h-3 w-3 inline ml-1" />
                    )}
                  </th>
                  <th className="px-2 py-2 cursor-pointer min-w-[120px]" onClick={() => handleSort('email')}>
                    Email
                    {sortColumn === 'email' && (
                      sortDirection === 'asc' ? <ArrowUpIcon className="h-3 w-3 inline ml-1" /> : <ArrowDownIcon className="h-3 w-3 inline ml-1" />
                    )}
                  </th>
                  <th className="px-2 py-2 cursor-pointer min-w-[80px]" onClick={() => handleSort('role')}>
                    Роль
                    {sortColumn === 'role' && (
                      sortDirection === 'asc' ? <ArrowUpIcon className="h-3 w-3 inline ml-1" /> : <ArrowDownIcon className="h-3 w-3 inline ml-1" />
                    )}
                  </th>
                  <th className="px-2 py-2 cursor-pointer min-w-[80px]" onClick={() => handleSort('class_number')}>
                    Класс
                    {sortColumn === 'class_number' && (
                      sortDirection === 'asc' ? <ArrowUpIcon className="h-3 w-3 inline ml-1" /> : <ArrowDownIcon className="h-3 w-3 inline ml-1" />
                    )}
                  </th>
                  <th className="px-2 py-2 min-w-[40px]">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 animate-fade-in-up transition-colors duration-200"
                    style={{ animationDelay: `${400 + index * 100}ms` }}
                  >
                    <td className="px-2 py-2">{user.id}</td>
                    <td className="px-2 py-2 truncate max-w-[100px]" title={user.username}>{user.username}</td>
                    <td className="px-2 py-2 truncate max-w-[100px]" title={user.full_name || '-'}>{user.full_name || '-'}</td>
                    <td className="px-2 py-2 truncate max-w-[120px]" title={user.email}>{user.email}</td>
                    <td className="px-2 py-2">
                      <button
                        className={clsx(
                          'text-blue-500 hover:underline text-xs',
                          user.role === 'student' && 'text-green-500 dark:text-green-400',
                          user.role === 'teacher' && 'text-blue-500 dark:text-blue-400',
                          user.role === 'admin' && 'text-purple-500 dark:text-purple-400'
                        )}
                        onClick={() => openRoleModal(user)}
                      >
                        {roleLabels[user.role] || user.role}
                      </button>
                    </td>
                    <td className="px-2 py-2">{user.class_number > 0 ? `${user.class_number} класс` : '-'}</td>
                    <td className="px-2 py-2">
                      <Button
                        onClick={() => openDeleteModal(user)}
                        className="bg-red-500 hover:bg-red-600 text-white p-1 rounded hover:scale-105 transition-transform duration-200"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
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
║ frontend/src/app/admin/components/AchievementManagement.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';

import { useState, FormEvent } from 'react';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { TrophyIcon } from '@heroicons/react/24/outline';

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
  openDeleteModal: (achievement: Achievement) => void;
}

export default function AchievementManagement({ achievements, onSuccess, setFormError, openDeleteModal }: AchievementManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [editAchievement, setEditAchievement] = useState<Achievement | null>(null);
  const [achTitle, setAchTitle] = useState('');
  const [achDesc, setAchDesc] = useState('');
  const [achCondition, setAchCondition] = useState('');
  const [localFormError, setLocalFormError] = useState('');

  const handleCreateOrUpdateAchievement = async (e: FormEvent) => {
    e.preventDefault();
    if (!achTitle || !achDesc || !achCondition) {
      const errorMsg = 'Заполните все поля';
      setLocalFormError(errorMsg);
      setFormError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      const payload = {
        title: achTitle,
        description: achDesc,
        condition: achCondition,
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
      setLocalFormError(errorMsg);
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

  const handleDelete = (achievement: Achievement) => {
    openDeleteModal(achievement);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditAchievement(null);
    setAchTitle('');
    setAchDesc('');
    setAchCondition('');
    setLocalFormError('');
  };

  return (
    <div className="w-[50rem] mx-auto">
      <Button
        onClick={() => setShowForm(!showForm)}
        className="mb-6 bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 transition-transform duration-200 flex items-center gap-2"
      >
        <TrophyIcon className="h-5 w-5" />
        {showForm ? 'Отменить' : 'Добавить достижение'}
      </Button>
      {localFormError && <p className="text-red-500 mb-4">{localFormError}</p>}
      {showForm && (
        <Card className="p-6 mb-4 w-full rounded-xl dark:bg-gray-800 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <form onSubmit={handleCreateOrUpdateAchievement} className="grid gap-4">
            <Input
              placeholder="Название достижения"
              value={achTitle}
              onChange={(e) => setAchTitle(e.target.value)}
              className="border-blue-600 dark:bg-gray-800 dark:text-gray-300"
              required
            />
            <Input
              placeholder="Описание"
              value={achDesc}
              onChange={(e) => setAchDesc(e.target.value)}
              className="border-blue-600 dark:bg-gray-800 dark:text-gray-300"
              required
            />
            <Input
              placeholder="Условие (например, 'Набрать 100 баллов')"
              value={achCondition}
              onChange={(e) => setAchCondition(e.target.value)}
              className="border-blue-600 dark:bg-gray-800 dark:text-gray-300"
              required
            />
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white hover:scale-105 transition-transform duration-200"
            >
              {editAchievement ? 'Обновить' : 'Добавить'}
            </Button>
          </form>
        </Card>
      )}
      {achievements.length === 0 ? (
        <Card className="p-6 text-center w-full rounded-xl dark:bg-gray-800 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <TrophyIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
          <p className="text-gray-600 dark:text-gray-400">Нет достижений. Создайте первое!</p>
        </Card>
      ) : (
        <ul className="w-full space-y-4">
          {achievements.map((ach, index) => (
            <li
              key={ach.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${400 + index * 100}ms` }}
            >
              <Card
                className={clsx(
                  'p-4 w-full rounded-xl dark:bg-gray-800 hover:shadow-lg'
                )}
              >
                <div className="flex items-start gap-3">
                  <TrophyIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {ach.title}
                      </h3>
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                        {ach.condition}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{ach.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(ach)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 hover:scale-105"
                    >
                      Редактировать
                    </Button>
                    <Button
                      onClick={() => handleDelete(ach)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 hover:scale-105"
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
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
      alert('Вы записаны на урок!');
    } catch {
      setError('Не удалось записаться на урок');
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
  refetch: (limit?: number, offset?: number, classNumber?: number | 'all') => Promise<void>;
  total: number;
}

export function useCourses(
  limit: number,
  offset: number,
  classNumber?: number | 'all'
): UseCoursesResult {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const { user } = useUser();

  const fetchCourses = async (
    newLimit?: number,
    newOffset?: number,
    newClassNumber?: number | 'all'
  ) => {
    setLoading(true);
    try {
      const params: Record<string, number | string> = {
        limit: newLimit ?? limit,
        offset: newOffset ?? offset,
      };

      // 💡 Явно передаём class_number, включая строку 'all'
      if (newClassNumber !== undefined) {
        params.class_number = newClassNumber;
      }

      const response = await api.get('/courses', { params });
      setCourses(response.data.courses);
      setTotal(response.data.total);
      setError(null);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ error?: string }>;
      setError(axiosError.response?.data?.error || 'Не удалось загрузить урокы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ⚠️ Всегда использовать classNumber проп, даже если student
    fetchCourses(limit, offset, classNumber);
  }, [limit, offset, classNumber, user?.id]);

  return { courses, loading, error, refetch: fetchCourses, total };
}



════════════════════════════════════════════════════════════════════════════════
║ frontend/src/shared/constants/avatars.ts
════════════════════════════════════════════════════════════════════════════════

export const avatarOptions = [
  '/avatars/1f803cd5-763c-484c-8db9-8a9e80e22f53.jpg',
  '/avatars/2467d09c-b0a6-46c9-9c01-eb2cbc29dd85.jpg',
  '/avatars/27258a85-1e4c-4ab9-b51e-ca6d8ad2e101.jpg',
  '/avatars/2aa12d4d-321f-4c58-a46b-bfa0f79022b4.jpg',
  '/avatars/2b1fa314-f37e-439e-be23-681b9cf2bd3e.jpg',
  '/avatars/4eda9fdf-8d86-473f-8364-34a7c1caefea.jpg',
  '/avatars/b9341e90-4e5c-4591-8a32-deff4d30c2af.jpg',
  '/avatars/c9d8ddeb-1b87-4451-9408-ad9672cdf889.jpg',
  '/avatars/d127a649-3bf3-45d0-b110-c1666c38b470.jpg',
];



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
    outline: 'border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500',
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

import { ReactNode, HTMLAttributes } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className = '', title, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'card card-shadow card-hover-gradient bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 transition-all',
        className
      )}
      {...props}
    >
      {title && <h2 className="text-2xl font-bold text-gray-800 dark:text-white p-4">{title}</h2>}
      <div className="p-4">{children}</div>
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
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/shared/ui/Button';

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
  const [tempAnswer, setTempAnswer] = useState<Record<number, string>>({});
  const [skipped, setSkipped] = useState<Record<number, boolean>>({});

  useEffect(() => {
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
    return <div className="text-center text-gray-700 dark:text-gray-200">Нет вопросов для квиза</div>;
  }

  const handleChange = async (subtaskId: number, answer: string) => {
    const normalizedAnswer = answer.trimEnd();

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

  const handlePrev = () => {
    if (currentSubtaskIndex > 0) {
      setCurrentSubtaskIndex(currentSubtaskIndex - 1);
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

    setIsSubmitting(true);
    try {
      const response = await api.post(`/assignments/${assignmentId}/submit-quiz`, { answers: payload });
      toast.success('Ответы отправлены!');
      onSubmit(response.data);
      subtasks.forEach((subtask) => {
        const subtaskId = subtask.id ?? subtask.ID ?? 0;
        localStorage.removeItem(`quiz_${assignmentId}_${subtaskId}`);
      });
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      toast.error(axiosErr.response?.data?.error || 'Ошибка при отправке');
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
    return (
      <div className="text-red-500 text-center">
        Ошибка: некорректные данные вопроса. Обратитесь к преподавателю.
      </div>
    );
  }

  if (inputType === 'multiple_choice' && !options.length) {
    return (
      <div className="text-red-500 text-center">
        Ошибка: отсутствуют варианты ответа для вопроса (ID: {subtaskId}). Обратитесь к преподавателю.
      </div>
    );
  }

  const isCorrect = answers[subtaskId]?.isCorrect;
  const incorrectOptionsForSubtask = incorrectOptions[subtaskId] || [];
  const attempts = answers[subtaskId]?.attempts || 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSubtaskIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <p className="font-semibold mb-2 text-gray-800 dark:text-white">
            {currentSubtaskIndex + 1}. {question} ({currentSubtaskIndex + 1}/{subtasks.length})
          </p>
          {fileUrl && !imageErrors[subtaskId] && (
            <div className="mt-2 mb-4">
              {fileUrl.endsWith('.pdf') ? (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 transition hover:scale-105 inline-block"
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
                    className="rounded-lg shadow-md"
                    onError={() =>
                      setImageErrors((prev) => ({
                        ...prev,
                        [subtaskId]: `Ошибка загрузки изображения для вопроса ${currentSubtaskIndex + 1}`,
                      }))
                    }
                  />
                  {imageErrors[subtaskId] && <p className="text-red-500 text-sm mt-2">{imageErrors[subtaskId]}</p>}
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
                      className={`accent-blue-600 h-4 w-4 ${
                        isOptionIncorrect ? 'border-red-500 bg-red-100' : ''
                      }`}
                    />
                    <span className={isOptionIncorrect ? 'text-red-600' : 'text-gray-700 dark:text-gray-200'}>
                      {option}
                    </span>
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
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                  placeholder="Введите ответ"
                />
                {!isCorrect && attempts < 3 && !skipped[subtaskId] && (
                  <div className="flex space-x-2 mt-2">
                    <Button
                      type="button"
                      onClick={() => handleConfirmTextAnswer(subtaskId)}
                      disabled={isSubmitting}
                      className="hover:scale-105 transition transform"
                    >
                      Подтвердить ответ
                    </Button>
                    {attempts > 0 && (
                      <Button
                        type="button"
                        onClick={() => handleSkip(subtaskId)}
                        variant="outline"
                        className="hover:scale-105 transition transform"
                      >
                        Пропустить
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Попытки: {attempts}{inputType === 'text_input' ? ' / 3' : ''}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex space-x-4">
        {currentSubtaskIndex > 0 && (
          <Button
            type="button"
            onClick={handlePrev}
            disabled={isSubmitting}
            variant="outline"
            className="hover:scale-105 transition transform"
          >
            Назад
          </Button>
        )}
        {currentSubtaskIndex < subtasks.length - 1 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="hover:scale-105 transition transform"
          >
            Далее
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="hover:scale-105 transition transform"
          >
            {isSubmitting ? 'Отправка...' : 'Завершить тест'}
          </Button>
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


════════════════════════════════════════════════════════════════════════════════
║ frontend/src/widgets/AvatarModal.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';
import { avatarOptions } from '@/shared/constants/avatars';
import { api } from '@/shared/api';
import { toast } from 'react-hot-toast';
import { Dialog } from '@headlessui/react';
import { useState } from 'react';

export function AvatarModal({ isOpen, onClose, currentAvatar, onAvatarUpdate }: {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  onAvatarUpdate: (url: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleSelect = async (url: string) => {
    try {
      setLoading(true);
      await api.put('/users/me/avatar', { avatar_url: url });
      toast.success('Аватар обновлён!');
      onAvatarUpdate(url); // обновляем в родителе
      onClose();
    } catch {
      toast.error('Ошибка при обновлении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 z-50 max-w-xl w-full">
        <Dialog.Title className="text-xl font-bold mb-4">Выберите аватар</Dialog.Title>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {avatarOptions.map((url) => (
            <img
              key={url}
              src={url}
              alt="avatar"
              className={`w-20 h-20 rounded-full object-cover cursor-pointer border transition ${
                currentAvatar === url ? 'ring-4 ring-blue-500' : 'hover:ring-2 hover:ring-blue-400'
              }`}
              onClick={() => handleSelect(url)}
            />
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} disabled={loading} className="text-sm text-gray-600 hover:underline">
            Закрыть
          </button>
        </div>
      </div>
    </Dialog>
  );
}



════════════════════════════════════════════════════════════════════════════════
║ frontend/src/widgets/ConfirmModal.tsx
════════════════════════════════════════════════════════════════════════════════

'use client';

import { Button } from '@/shared/ui/Button';
import clsx from 'clsx';
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  className?: string;
  confirmButtonClass?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отменить',
  className,
  confirmButtonClass = 'bg-blue-600 hover:bg-blue-700',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div
        className={clsx(
          'bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 card-shadow animate-fade-in-up',
          className
        )}
      >
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{title}</h2>
        <div className="text-gray-600 dark:text-gray-300 mb-6">{message}</div>
        <div className="flex justify-end gap-2">
          <Button
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={clsx('text-white hover:scale-105 transition-transform duration-200', confirmButtonClass)}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}