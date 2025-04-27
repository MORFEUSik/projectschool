// src/app/tasks/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { fetchWithAuth } from '@/shared/api/fetch';
import { useAuthCheck } from '@/shared/lib/useAuthCheck';
import { Course, Assignment } from '@/entities/course/model';
import { User } from '@/entities/user/model';

// Расширяем тип Assignment для включения course_title
interface ExtendedAssignment extends Assignment {
  course_title: string;
}

export default function TasksPage() {
  useAuthCheck();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<ExtendedAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTasksData = async () => {
      try {
        // Получение профиля
        const profileResponse = await fetchWithAuth('/api/users/me');
        const profileData = await profileResponse.json();
        setUser(profileData);

        // Получение курсов
        const coursesResponse = await fetchWithAuth('/api/courses?limit=100&offset=0');
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);

        // Получение заданий для всех курсов, на которые записан пользователь
        const userCourses = coursesData.filter((course: Course) =>
          course.enrollments?.some((e: { user_id: number }) => e.user_id === profileData.id) ||
          course.teacher?.id === profileData.id // Исправлено: teacher_id -> teacher.id
        );

        const allAssignments: ExtendedAssignment[] = [];
        for (const course of userCourses) {
          const assignmentsResponse = await fetchWithAuth(`/api/courses/${course.id}/assignments`);
          const assignmentsData = await assignmentsResponse.json();
          allAssignments.push(
            ...assignmentsData.map((assignment: Assignment) => ({
              ...assignment,
              course_title: course.title,
            }))
          );
        }
        setAssignments(allAssignments);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки заданий';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchTasksData();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Задания</h1>
          {['Teacher', 'Admin'].includes(user?.role ?? '') ? (
  <Button onClick={() => router.push('/courses')}>Создать задание</Button>
) : null}
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {assignments.length === 0 ? (
          <p className="text-gray-600">Заданий пока нет</p>
        ) : (
          <div className="grid gap-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="p-4">
                <h3 className="text-xl font-semibold">{assignment.title}</h3>
                <p className="text-gray-600">{assignment.description}</p>
                <p className="text-gray-600">Курс: {assignment.course_title}</p>
                <p className="text-gray-600">
                  Срок сдачи: {new Date(assignment.due_date).toLocaleDateString()}
                </p>
                <Button
                  onClick={() =>
                    router.push(
                      `/courses/${assignment.course_id}/assignments/${assignment.id}/submissions`
                    )
                  }
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