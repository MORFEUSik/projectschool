'use client';
import { useState, useEffect } from 'react';
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
  const { courses, loading: isLoading, refetch, error, total } = useCourses(6, 0, selectedClassNumber);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [classNumber, setClassNumber] = useState('');
  const [formError, setFormError] = useState('');
  const [page, setPage] = useState(1);
  const limit = 6;

  // Устанавливаем начальный класс для студентов
  useEffect(() => {
    if (user?.role === 'student' && user?.class_number && selectedClassNumber === undefined) {
      setSelectedClassNumber(user.class_number);
    }
  }, [user?.class_number, user?.role]);

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
      setFormError(axiosError.response?.data?.error || 'Ошибка создания курса');
    }
  };

  const handleUnenroll = async (courseId: number) => {
    try {
      await api.delete(`/courses/${courseId}/enroll`);
      await refetch(limit, (page - 1) * limit, selectedClassNumber);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      alert(axiosError.response?.data?.error || 'Ошибка отмены записи');
    }
  };

  const handlePageChange = (newPage: number) => {
    const newOffset = (newPage - 1) * limit;
    if (newOffset < 0 || (total && newOffset >= total)) return;
    setPage(newPage);
    refetch(limit, newOffset, selectedClassNumber);
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

  // Фильтруем курсы по предмету
  const filteredCourses = courses.filter((course) => !selectedSubject || course.subject === selectedSubject);

  // Формируем сообщение, если курсов нет
  let noCoursesMessage = '';
  if (!isLoading && filteredCourses.length === 0) {
    if (selectedClassNumber && selectedSubject) {
      noCoursesMessage = `Нет курсов для ${selectedClassNumber}-го класса по предмету "${selectedSubject}".`;
    } else if (selectedClassNumber) {
      noCoursesMessage = `Нет курсов для ${selectedClassNumber}-го класса.`;
    } else if (selectedSubject) {
      noCoursesMessage = `Нет курсов по предмету "${selectedSubject}".`;
    } else {
      noCoursesMessage = 'Курсы отсутствуют.';
    }
  }

  if (isLoading) return <div className="text-center mt-8">Загрузка...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Ошибка: {error}</div>;

  const totalPages = total ? Math.ceil(total / limit) : 1;

  return (
    <div className="max-w-5xl mx-auto mt-12 px-4">
      <h1 className="text-4xl font-extrabold text-blue-600 text-center mb-8">📚 Курсы</h1>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div>
          <label htmlFor="classNumberFilter" className="block text-sm font-medium mb-1">Фильтр по классу</label>
          <select
            id="classNumberFilter"
            value={selectedClassNumber ?? ''}
            onChange={(e) => setSelectedClassNumber(e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full max-w-xs rounded border p-2 focus:outline-none focus:ring-blue-600"
          >
            <option value="">Все классы</option>
            {[...Array(11)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="subjectFilter" className="block text-sm font-medium mb-1">Фильтр по предмету</label>
          <select
            id="subjectFilter"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full max-w-xs rounded border p-2 focus:outline-none focus:ring-blue-600"
          >
            <option value="">Все предметы</option>
            {subjects.map((subj) => (
              <option key={subj} value={subj}>{subj}</option>
            ))}
          </select>
        </div>
      </div>

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
              <label htmlFor="subject" className="block text-sm font-medium mb-1">Предмет</label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full rounded border p-2 focus:outline-none focus:ring-blue-600"
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
            <Button type="submit" className="w-full">Создать курс</Button>
          </form>
        </Card>
      )}

      {noCoursesMessage ? (
        <p className="text-center text-gray-500 mt-8">{noCoursesMessage}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredCourses.map((course: Course) => (
            <Card key={course.id} className="p-6 flex flex-col justify-between">
              <div>
                <Link href={`/courses/${course.id}`}>
                  <h2 className="text-xl font-bold text-blue-700 hover:underline mb-2">{course.title}</h2>
                </Link>
                <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                <p className="text-sm text-gray-400 mb-2">
                  <strong>Предмет:</strong> {course.subject}
                </p>
                <p className="text-sm text-gray-400 mb-2">
                  <strong>Класс:</strong> {course.class_number}
                </p>
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