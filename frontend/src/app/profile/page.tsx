'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaUser, FaEnvelope, FaStar, FaBook, FaEdit } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { User, Role } from '@/entities/user/model';
import { Course, Enrollment } from '@/entities/course/model';
import { Submission } from '@/entities/submission/model';
import { fetchWithAuth } from '@/shared/api/fetch';

interface ProfileResponse {
  id: number;
  username: string;
  email: string;
  role: Role;
  points: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Получаем данные профиля
        const profileResponse = await fetchWithAuth('/api/users/me', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!profileResponse.ok) {
          throw new Error('Ошибка загрузки профиля');
        }
        const profileData: ProfileResponse = await profileResponse.json();
        setUser({
          id: profileData.id,
          username: profileData.username,
          email: profileData.email,
          role: profileData.role,
          points: profileData.points,
          created_at: '',
          updated_at: '',
        });

        // Получаем список курсов юзера
        const coursesResponse = await fetchWithAuth('/api/courses', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (coursesResponse.ok) {
          const coursesData: Course[] = await coursesResponse.json();
          setCourses(coursesData.filter((course) =>
            course.teacher.id === profileData.id || // Курсы, где юзер учитель
            course.enrollments.some((e: Enrollment) => e.user_id === profileData.id) // Курсы, где юзер записан
          ));
        }

        // Получаем последние решения
        const submissionsResponse = await fetchWithAuth('/api/users/me/submissions', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (submissionsResponse.ok) {
          const submissionsData: Submission[] = await submissionsResponse.json();
          setSubmissions(submissionsData.slice(0, 3)); // Показываем только 3 последних
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [router]);

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
        className="max-w-4xl mx-auto"
      >
        <Card className="p-8 animate-bounce-in">
          {/* Информация о пользователе */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-6">
            <div className="relative w-32 h-32">
              <Image
                src="/default-avatar.png"
                alt="Аватар"
                fill
                className="rounded-full object-cover border-4 border-accent"
              />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold text-gray-800">{user?.username}</h1>
              <p className="text-gray-600 flex items-center mt-2">
                <FaEnvelope className="mr-2 text-primary" /> {user?.email}
              </p>
              <p className="text-gray-600 flex items-center mt-1">
                <FaUser className="mr-2 text-primary" /> {user?.role}
              </p>
              <p className="text-gray-600 flex items-center mt-1">
                <FaStar className="mr-2 text-yellow-400" /> Баллы: {user?.points}
              </p>
              <Button
                className="mt-4 btn btn-primary flex items-center"
                onClick={() => router.push('/profile/edit')}
              >
                <FaEdit className="mr-2" /> Редактировать
              </Button>
            </div>
          </div>

          {/* Список курсов */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
              <FaBook className="mr-2 text-primary" /> Мои курсы
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {courses.length ? (
                courses.map((course) => (
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
                    <h3 className="text-xl font-semibold text-gray-800">{course.title}</h3>
                    <p className="text-gray-600">{course.description}</p>
                    <p className="text-gray-600 mt-1">Учитель: {course.teacher.username}</p>
                    <Button
                      className="mt-4 btn btn-secondary"
                      onClick={() => router.push(`/courses/${course.id}`)}
                    >
                      Перейти
                    </Button>
                  </motion.div>
                ))
              ) : (
                <p className="text-gray-500">Вы пока не записаны на курсы.</p>
              )}
            </div>
          </div>

          {/* Последние решения */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
              <FaBook className="mr-2 text-primary" /> Последние решения
            </h2>
            <div className="mt-4">
              {submissions.length ? (
                submissions.map((submission) => (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-50 rounded-xl p-4 mb-4 shadow-uchi"
                  >
                    <h3 className="text-lg font-semibold">{submission.assignment.title}</h3>
                    <p className="text-gray-600">Оценка: {submission.grade ?? 'Не оценено'}</p>
                    <p className="text-gray-600">Дата: {new Date(submission.created_at).toLocaleDateString()}</p>
                  </motion.div>
                ))
              ) : (
                <p className="text-gray-500">Решений пока нет.</p>
              )}
              {submissions.length > 0 && (
                <Link href="/profile/submissions" className="text-blue-500 hover:underline mt-4 block">
                  Все решения
                </Link>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}