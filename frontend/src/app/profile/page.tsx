"use client";

import { useUserProfile, useCourses, useSubmissions } from '@/shared/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaUser, FaEnvelope, FaStar, FaBook, FaEdit } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Card, Button } from '@/shared/ui';
import Image from 'next/image';
import Link from 'next/link';
import { Role, User } from '@/entities/user/model';
import { Course } from '@/entities/course/model';
import { Submission } from '@/entities/submission/model';

export default function ProfilePage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading, error: userError } = useUserProfile();
  const { data: courses = [], isLoading: coursesLoading, error: coursesError } = useCourses();
  const { data: submissions = [], isLoading: submissionsLoading, error: submissionsError } = useSubmissions();

  if (userLoading || coursesLoading || submissionsLoading) {
    return <div className="flex justify-center items-center h-screen text-xl text-gray-600">Загрузка...</div>;
  }

  if (userError || coursesError || submissionsError) {
    const errorMessage = userError?.message || coursesError?.message || submissionsError?.message || 'Не удалось загрузить данные';
    toast.error(errorMessage, { id: 'profile-error' });
    router.push('/login'); // Перенаправляем на /login при ошибке
    return null;
  }

  if (!user) {
    toast.error('Пожалуйста, войдите в аккаунт', { id: 'auth-error' });
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="p-8 profile-card">
          <div className="profile-header flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-6">
            <div className="profile-avatar relative w-32 h-32">
              <Image
                src="/default-avatar.png"
                alt="Аватар"
                fill
                className="profile-avatar__image rounded-full object-cover border-4 border-accent"
              />
            </div>
            <div className="profile-info text-center sm:text-left">
              <h1 className="profile-info__name text-3xl font-bold text-gray-800">{user.username}</h1>
              <p className="profile-info__email text-gray-600 flex items-center mt-2">
                <FaEnvelope className="mr-2 text-primary" /> {user.email}
              </p>
              <p className="profile-info__role text-gray-600 flex items-center mt-1">
                <FaUser className="mr-2 text-primary" /> {user.role}
              </p>
              <p className="profile-info__points text-gray-600 flex items-center mt-1">
                <FaStar className="mr-2 text-yellow-400" /> Баллы: {user.points}
              </p>
              <Button
                className="profile-info__edit btn btn-primary flex items-center mt-4"
                onClick={() => router.push('/profile/edit')}
              >
                <FaEdit className="mr-2" /> Редактировать
              </Button>
              {(user.role === Role.Teacher || user.role === Role.Admin) && (
                <Button
                  className="profile-info__create-course btn btn-secondary mt-4 ml-0 sm:ml-4"
                  onClick={() => router.push('/courses/new')}
                >
                  Создать курс
                </Button>
              )}
            </div>
          </div>
          <div className="profile-courses mt-8">
            <h2 className="profile-courses__title text-2xl font-semibold text-gray-800 flex items-center">
              <FaBook className="mr-2 text-primary" /> Мои курсы
            </h2>
            <div className="profile-courses__grid grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {courses.length ? (
                courses.map((course: Course) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="course-card bg-blue-50 rounded-xl p-6 shadow-uchi card-hover"
                  >
                    <Image
                      src="/course-placeholder.jpg"
                      alt={course.title}
                      width={300}
                      height={150}
                      className="course-card__image rounded-lg object-cover mb-4"
                    />
                    <h3 className="course-card__title text-xl font-semibold text-gray-800">{course.title}</h3>
                    <p className="course-card__description text-gray-600">{course.description}</p>
                    <p className="course-card__teacher text-gray-600 mt-1">
                      Учитель: {course.teacher?.username ?? 'Не указан'}
                    </p>
                    <Button
                      className="course-card__button btn btn-secondary mt-4"
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
          <div className="profile-submissions mt-8">
            <h2 className="profile-submissions__title text-2xl font-semibold text-gray-800 flex items-center">
              <FaBook className="mr-2 text-primary" /> Последние решения
            </h2>
            <div className="profile-submissions__list mt-4">
              {submissions.length ? (
                submissions.slice(0, 3).map((submission: Submission) => (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="submission-card bg-gray-50 rounded-xl p-4 mb-4 shadow-uchi"
                  >
                    <h3 className="submission-card__title text-lg font-semibold">
                      {submission.assignment?.title || 'Без названия'}
                    </h3>
                    <p className="submission-card__grade text-gray-600">
                      Оценка: {submission.grade ?? 'Не оценено'}
                    </p>
                    <p className="submission-card__date text-gray-600">
                      Дата: {new Date(submission.created_at).toLocaleDateString()}
                    </p>
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