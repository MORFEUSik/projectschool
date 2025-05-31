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