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
    <div className="max-w-5xl mx-auto mt-12 px-4">
  <h1 className="text-4xl font-extrabold text-blue-600 text-center mb-8">📚 Курсы</h1>

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
          <label htmlFor="description" className="block text-sm font-medium mb-1">Описание</label>
          <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Введите описание" />
        </div>
        <Button type="submit" className="w-full">Создать курс</Button>
      </form>
    </Card>
  )}

  {isLoading ? (
    <p className="text-center text-gray-500">Загрузка...</p>
  ) : error ? (
    <p className="text-center text-red-500">Ошибка: {error}</p>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {courses.map((course: Course) => (
        <Card key={course.id} className="p-6 flex flex-col justify-between">
          <div>
            <Link href={`/courses/${course.id}`}>
              <h2 className="text-xl font-bold text-blue-700 hover:underline mb-2">{course.title}</h2>
            </Link>
            <p className="text-sm text-gray-600 mb-2">{course.description}</p>
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