// src/app/courses/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { fetchWithAuth } from '@/shared/api/fetch';
import { useAuthCheck } from '@/shared/lib/useAuthCheck';
import { Course, Assignment } from '@/entities/course/model';

export default function CoursePage() {
  useAuthCheck();
  const router = useRouter();
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // Получение данных курса
        const courseResponse = await fetchWithAuth(`/api/courses/${id}`);
        const courseData = await courseResponse.json();
        setCourse(courseData);

        // Получение списка заданий
        const assignmentsResponse = await fetchWithAuth(`/api/courses/${id}/assignments`);
        const assignmentsData = await assignmentsResponse.json();
        setAssignments(assignmentsData);

        // Проверка, записан ли пользователь на курс
        const profileResponse = await fetchWithAuth('/api/users/me');
        const profileData = await profileResponse.json();
        const enrolled = courseData.enrollments?.some(
          (enrollment: { user_id: number }) => enrollment.user_id === profileData.id
        );
        setIsEnrolled(enrolled);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки данных';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [id]);

  const handleEnroll = async () => {
    try {
      await fetchWithAuth(`/api/courses/${id}/enroll`, { method: 'POST' });
      setIsEnrolled(true);
      toast.success('Вы записались на курс!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка записи на курс';
      toast.error(errorMessage);
    }
  };

  const handleUnenroll = async () => {
    try {
      await fetchWithAuth(`/api/courses/${id}/unenroll`, { method: 'DELETE' });
      setIsEnrolled(false);
      toast.success('Вы отписались от курса');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка отписки';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <p className="text-red-500">{error || 'Курс не найден'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="p-6 mb-6 animate-bounce-in">
          <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
          <p className="text-gray-600 mb-4">{course.description}</p>
          <p className="text-gray-600 mb-4">
            Преподаватель: {course.teacher?.username || 'Не указан'}
          </p>
          <div className="flex gap-4">
            {isEnrolled ? (
              <Button onClick={handleUnenroll} className="btn-secondary">
                Отписаться
              </Button>
            ) : (
              <Button onClick={handleEnroll} className="btn-primary">
                Записаться
              </Button>
            )}
            <Button onClick={() => router.push(`/courses/${id}/assignments/new`)}>
              Создать задание
            </Button>
          </div>
        </Card>

        <h2 className="text-2xl font-bold mb-4">Задания</h2>
        {assignments.length === 0 ? (
          <p className="text-gray-600">Заданий пока нет</p>
        ) : (
          <div className="grid gap-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="p-4">
                <h3 className="text-xl font-semibold">{assignment.title}</h3>
                <p className="text-gray-600">{assignment.description}</p>
                <p className="text-gray-600">
                  Срок сдачи: {new Date(assignment.due_date).toLocaleDateString()}
                </p>
                <Button
                  onClick={() => router.push(`/courses/${id}/assignments/${assignment.id}/submissions`)}
                  className="mt-2"
                >
                  Отправить решение
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}