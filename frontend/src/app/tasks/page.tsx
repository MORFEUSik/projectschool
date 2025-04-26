// frontend/src/app/tasks/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaBook, FaPlus } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Assignment } from '@/entities/assignment/model';
import { User, Role } from '@/entities/user/model';
import { fetchWithAuth } from '@/shared/api/fetch';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

export default function TasksPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const limit = 10;

  useEffect(() => {
    const fetchTasksData = async () => {
      try {
        const token = localStorage.getItem('token') || Cookies.get('token');
        if (!token) {
          toast.error('Пожалуйста, войдите в аккаунт');
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

        // Получаем список заданий
        const assignmentsResponse = await fetchWithAuth(`/api/assignments?limit=${limit}&offset=${(page - 1) * limit}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!assignmentsResponse.ok) {
          throw new Error('Ошибка загрузки заданий');
        }
        const assignmentsData: Assignment[] = await assignmentsResponse.json();
        setAssignments(assignmentsData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Не удалось загрузить данные';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchTasksData();
  }, [router, page]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-xl text-gray-600">Загрузка...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center text-xl mt-8">{error}</div>;
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
            <FaBook className="mr-2 text-primary" /> Задания
          </h1>
          {(user?.role === Role.Teacher || user?.role === Role.Admin) && (
            <Link href="/courses/[id]/assignments/new">
              <Button className="btn btn-primary flex items-center">
                <FaPlus className="mr-2" /> Создать задание
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.length ? (
            assignments.map((assignment) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-blue-50 rounded-xl p-6 shadow-uchi card-hover"
              >
                <h2 className="text-xl font-semibold text-gray-800">{assignment.title}</h2>
                <p className="text-gray-600 line-clamp-2">{assignment.description}</p>
                <div className="flex gap-2 mt-4">
                  <Button
                    className="btn btn-secondary"
                    onClick={() => router.push(`/courses/${assignment.course_id}/assignments/${assignment.id}`)}
                  >
                    Подробнее
                  </Button>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-gray-500 col-span-full">Задания пока не созданы.</p>
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
            disabled={assignments.length < limit}
            onClick={() => setPage(page + 1)}
          >
            Вперед
          </Button>
        </div>
      </motion.div>
    </div>
  );
}