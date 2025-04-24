// src/app/courses/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaBook, FaPlus } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Course, Enrollment } from '@/entities/course/model';
import { User, Role } from '@/entities/user/model';
import { fetchWithAuth } from '@/shared/api/fetch';
import toast from 'react-hot-toast';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const limit = 10;

  useEffect(() => {
    const fetchCoursesData = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('CoursesPage: Token:', token);
        if (!token) {
          console.log('CoursesPage: No token, redirecting to /login');
          router.push('/login');
          return;
        }

        // Получаем данные пользователя
        const profileResponse = await fetchWithAuth('/api/users/me', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!profileResponse.ok) {
          throw new Error('Ошибка загрузки профиля');
        }
        const profileData = await profileResponse.json();
        setUser({
          id: profileData.id,
          username: profileData.username,
          email: profileData.email,
          role: profileData.role,
          points: profileData.points,
          created_at: '',
          updated_at: '',
        });

        // Получаем список курсов
        const coursesResponse = await fetchWithAuth(`/api/courses?limit=${limit}&offset=${(page - 1) * limit}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!coursesResponse.ok) {
          throw new Error('Ошибка загрузки курсов');
        }
        const coursesData: Course[] = await coursesResponse.json();
        setCourses(coursesData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Не удалось загрузить данные';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchCoursesData();
  }, [router, page]);

  const handleEnroll = async (courseId: number, isEnrolled: boolean) => {
    if (!user?.id) {
      setError('Пользователь не авторизован');
      toast.error('Пользователь не авторизован');
      return;
    }
    try {
      const method = isEnrolled ? 'DELETE' : 'POST';
      const response = await fetchWithAuth(`/api/courses/${courseId}/enroll`, {
        method,
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(isEnrolled ? 'Ошибка отписки' : 'Ошибка записи');
      }
      setCourses(courses.map((course) =>
        course.id === courseId
          ? {
              ...course,
              enrollments: isEnrolled
                ? course.enrollments.filter((e: Enrollment) => e.user_id !== user.id)
                : [...course.enrollments, { user_id: user.id, course_id: courseId }],
            }
          : course
      ));
      toast.success(isEnrolled ? 'Вы отписались от курса' : 'Вы записались на курс');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Не удалось выполнить действие';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl text-gray-600">
        Загрузка...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center text-xl mt-8">{error}</div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <FaBook className="mr-2 text-primary" /> Курсы
          </h1>
          {(user?.role === Role.Teacher || user?.role === Role.Admin) && (
            <Link href="/courses/new">
              <Button className="btn btn-primary flex items-center">
                <FaPlus className="mr-2" /> Создать курс
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.length ? (
            courses.map((course) => {
              const isEnrolled = course.enrollments.some((e: Enrollment) => e.user_id === user?.id);
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-blue-50 rounded-xl p-6 shadow-uchi card-hover"
                >
                  <Image
                    src="/course-placeholder.jpg"
                    alt={course.title}
                    width={300}
                    height={150}
                    className="rounded-lg object-cover mb-4"
                  />
                  <h2 className="text-xl font-semibold text-gray-800">{course.title}</h2>
                  <p className="text-gray-600 line-clamp-2">{course.description}</p>
                  <p className="text-gray-600 mt-1">Учитель: {course.teacher.username}</p>
                  <div className="flex gap-2 mt-4">
                    <Button
                      className="btn btn-secondary"
                      onClick={() => router.push(`/courses/${course.id}`)}
                    >
                      Подробнее
                    </Button>
                    {user?.role === Role.Student && (
                      <Button
                        className={`btn ${isEnrolled ? 'btn-accent' : 'btn-primary'}`}
                        onClick={() => handleEnroll(course.id, isEnrolled)}
                      >
                        {isEnrolled ? 'Отписаться' : 'Записаться'}
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <p className="text-gray-500 col-span-full">Курсы пока не созданы.</p>
          )}
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <Button
            className="btn btn-primary"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Назад
          </Button>
          <Button
            className="btn btn-primary"
            disabled={courses.length < limit}
            onClick={() => setPage(page + 1)}
          >
            Вперед
          </Button>
        </div>
      </motion.div>
    </div>
  );
}