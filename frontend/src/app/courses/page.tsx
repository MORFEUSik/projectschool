"use client";

import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useCourses, useUserProfile } from '@/shared/lib/api';
import { Course, Enrollment } from '@/entities/course/model';
import { User, Role } from '@/entities/user/model';
import { Button, Card } from '@/shared/ui';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaBook } from 'react-icons/fa';

export default function CoursesPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading, error: userError } = useUserProfile();
  const { data: courses = [], isLoading: coursesLoading, error: coursesError } = useCourses();

  if (userLoading || coursesLoading) {
    return <div className="flex justify-center items-center h-screen text-xl text-gray-600">Загрузка...</div>;
  }

  if (userError || coursesError) {
    const errorMessage = userError?.message || coursesError?.message || 'Не удалось загрузить данные';
    toast.error(errorMessage, { id: 'courses-error' });
    return <div className="text-red-500 text-center text-xl mt-8">{errorMessage}</div>;
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
        className="max-w-5xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-8 flex items-center">
          <FaBook className="mr-2 text-primary" /> Курсы
        </h1>
        {(user.role === Role.Teacher || user.role === Role.Admin) && (
          <Button
            className="mb-6 btn btn-primary"
            onClick={() => router.push('/courses/new')}
          >
            Создать курс
          </Button>
        )}
        <div className="courses-grid courses-grid--sm-2 courses-grid--lg-3">
          {courses.length ? (
            courses.map((course: Course) => (
              <Card
                key={course.id}
                className="course-card shadow-uchi card-hover"
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
              </Card>
            ))
          ) : (
            <p className="text-gray-500">Курсы отсутствуют.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}