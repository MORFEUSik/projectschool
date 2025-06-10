'use client';
import { useState, useEffect, useRef } from 'react';
import { useCourses } from '@/shared/hooks/useCourses';
import { useUser } from '@/entities/user/hook';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { api } from '@/shared/api';
import Link from 'next/link';
import { AxiosError } from 'axios';
import clsx from 'clsx';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const classParam = selectedClassNumber ?? 'all';
  const { courses, loading: isLoading, refetch, error, total } = useCourses(6, 0, classParam);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [classNumber, setClassNumber] = useState('');
  const [formError, setFormError] = useState('');
  const [page, setPage] = useState(1);
  const limit = 6;

  // Состояние для анимации и пагинации
  const [hoveredCourseId, setHoveredCourseId] = useState<number | null>(null); // Для масштаба
  const [descriptionCourseId, setDescriptionCourseId] = useState<number | null>(null); // Для описания
  const [clickedCourseId, setClickedCourseId] = useState<number | null>(null); // Для клика
  const [typedDescriptions, setTypedDescriptions] = useState<Record<number, string>>({});
  const [isPageTransition, setIsPageTransition] = useState(false);
  const hoverTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const typingTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());

  // Устанавливаем начальный класс для студентов
  useEffect(() => {
    if (user?.role === 'student' && user?.class_number && selectedClassNumber === undefined) {
      setSelectedClassNumber(user.class_number);
    }
  }, [user?.class_number, user?.role]);

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      hoverTimers.current.forEach((timer) => clearTimeout(timer));
      hoverTimers.current.clear();
      typingTimers.current.forEach((timer) => clearTimeout(timer));
      typingTimers.current.clear();
    };
  }, []);

  // Анимация пагинации
  useEffect(() => {
    if (!isLoading) {
      setIsPageTransition(true);
      const timer = setTimeout(() => setIsPageTransition(false), 50);
      return () => clearTimeout(timer);
    }
  }, [page, isLoading]);

  // Эффект печатания описания
  useEffect(() => {
    if (descriptionCourseId !== null) {
      const course = courses.find((c) => c.id === descriptionCourseId);
      if (course) {
        const text = course.description || 'Описание отсутствует';
        let index = 0;
        setTypedDescriptions((prev) => ({ ...prev, [descriptionCourseId]: '' }));

        const type = () => {
          setTypedDescriptions((prev) => ({
            ...prev,
            [descriptionCourseId]: text.slice(0, index + 1),
          }));
          index++;
          if (index < text.length) {
            typingTimers.current.set(descriptionCourseId, setTimeout(type, 30));
          }
        };
        type();
      }
    } else {
      typingTimers.current.forEach((timer) => clearTimeout(timer));
      typingTimers.current.clear();
      setTypedDescriptions({});
    }
  }, [descriptionCourseId, courses]);

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

  const handlePageChange = (newPage: number) => {
    const newOffset = (newPage - 1) * limit;
    if (newOffset < 0 || (total && newOffset >= total)) return;
    setIsPageTransition(true);
    setPage(newPage);
    refetch(limit, newOffset, selectedClassNumber ?? 'all');
  };

  // Обработчики наведения и ухода курсора
  const handleMouseEnter = (courseId: number) => {
    setHoveredCourseId(courseId); // Мгновенный масштаб
    const timer = setTimeout(() => {
      setDescriptionCourseId(courseId); // Описание через 1с
    }, 1000);
    hoverTimers.current.set(courseId, timer);
  };

  const handleMouseLeave = (courseId: number) => {
    const timer = hoverTimers.current.get(courseId);
    if (timer) {
      clearTimeout(timer);
      hoverTimers.current.delete(courseId);
    }
    setHoveredCourseId(null);
    setDescriptionCourseId(null);
  };

  // Обработчики клика
  const handleMouseDown = (courseId: number) => {
    setClickedCourseId(courseId);
  };

  const handleMouseUp = () => {
    setClickedCourseId(null);
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

  // Иконки для предметов
  const subjectIcons: Record<string, string> = {
    Математика: '🧮',
    'Русский язык': '📖',
    Физика: '⚛️',
    Химия: '🧪',
    Литература: '📚',
    Биология: '🌱',
    История: '🏛️',
  };

  // Цвета для бейджей предметов
  const subjectColors: Record<string, string> = {
    Математика: 'bg-blue-100 text-blue-800',
    'Русский язык': 'bg-purple-100 text-purple-800',
    Физика: 'bg-green-100 text-green-800',
    Химия: 'bg-yellow-100 text-yellow-800',
    Литература: 'bg-pink-100 text-pink-800',
    Биология: 'bg-teal-100 text-teal-800',
    История: 'bg-orange-100 text-orange-800',
  };

  // Фильтрация курсов
  const filteredCourses = courses.filter((course: Course) =>
    (!selectedSubject || course.subject === selectedSubject) &&
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Сообщение, если курсов нет
  let noCoursesMessage = '';
  if (!isLoading && filteredCourses.length === 0) {
    if (searchQuery) {
      noCoursesMessage = `Нет курсов, соответствующих "${searchQuery}".`;
    } else if (selectedClassNumber && selectedSubject) {
      noCoursesMessage = `Нет курсов для ${selectedClassNumber}-го класса по предмету "${selectedSubject}".`;
    } else if (selectedClassNumber) {
      noCoursesMessage = `Нет курсов для ${selectedClassNumber}-го класса.`;
    } else if (selectedSubject) {
      noCoursesMessage = `Нет курсов по предмету "${selectedSubject}".`;
    } else {
      noCoursesMessage = 'Курсы отсутствуют.';
    }
  }

  if (error) return <div className="text-center mt-8 text-red-500">Ошибка: {error}</div>;

  const totalPages = total ? Math.ceil(total / limit) : 1;

  return (
    <div className="max-w-5xl mx-auto mt-12 px-4">
      <h1 className="text-4xl font-extrabold text-blue-600 text-center mb-8 animate-fade-in-up">📚 Курсы</h1>

      {isLoading && (
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-blue-600 animate-progress"></div>
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-auto">
          <label htmlFor="searchQuery" className="block text-sm font-medium mb-1">Поиск по названию</label>
          <div className="relative">
            <Input
              id="searchQuery"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Введите название курса..."
              className="w-full max-w-xs pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <label htmlFor="classNumberFilter" className="block text-sm font-medium mb-1">Фильтр по классу</label>
          <select
            id="classNumberFilter"
            value={selectedClassNumber ?? ''}
            onChange={(e) => setSelectedClassNumber(e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full max-w-xs rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300"
          >
            <option value="">Все классы</option>
            {[...Array(11)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <label htmlFor="subjectFilter" className="block text-sm font-medium mb-1">Фильтр по предмету</label>
          <select
            id="subjectFilter"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300"
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
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="hover:scale-105 transition-transform duration-300">
            {showCreateForm ? 'Отменить' : 'Создать курс'}
          </Button>
        </div>
      )}

      {showCreateForm && (
        <Card className="mb-8 animate-fade-in-up">
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
                className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300"
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
            <Button type="submit" className="w-full hover:scale-105 transition-transform duration-300">Создать курс</Button>
          </form>
        </Card>
      )}

      {noCoursesMessage ? (
        <p className="text-center text-gray-500 mt-8 animate-fade-in-up">{noCoursesMessage}</p>
      ) : (
        <div
          className={clsx(
            'grid grid-cols-1 sm:grid-cols-2 gap-6 transition-opacity duration-500',
            isPageTransition ? 'opacity-0' : 'opacity-100'
          )}
          key={page}
        >
          {filteredCourses.map((course: Course, index) => (
            <Link href={`/courses/${course.id}`} key={course.id}>
              <Card
                className={clsx(
                  'p-6 flex flex-col cursor-pointer card-shadow card-hover-gradient min-h-[auto]',
                  'animate-fade-in-up transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
                  {
                    'scale-102': hoveredCourseId === course.id && clickedCourseId !== course.id,
                    'scale-95': clickedCourseId === course.id,
                    'scale-100': hoveredCourseId !== course.id && clickedCourseId !== course.id,
                  },
                  { 'animation-delay-100': index % 2 === 0, 'animation-delay-200': index % 2 === 1 }
                )}
                style={{ animationDelay: `${index * 100}ms` }}
                onMouseEnter={() => handleMouseEnter(course.id)}
                onMouseLeave={() => handleMouseLeave(course.id)}
                onMouseDown={() => handleMouseDown(course.id)}
                onMouseUp={handleMouseUp}
              >
                <div>
                  <h2 className="text-xl font-bold text-blue-700 mb-2">{course.title}</h2>
                  <div
                    className={clsx(
                      'text-sm text-gray-600 transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]',
                      descriptionCourseId === course.id ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                    )}
                    style={{
                      WebkitMaskImage: descriptionCourseId === course.id ? 'linear-gradient(to right, black 80%, transparent 100%)' : 'none',
                      maskImage: descriptionCourseId === course.id ? 'linear-gradient(to right, black 80%, transparent 100%)' : 'none',
                    }}
                  >
                    {typedDescriptions[course.id] || ''}
                  </div>
                  <p className="text-sm mt-2">
                    <strong>Предмет:</strong>{' '}
                    <span className={clsx('inline-block px-2 py-1 rounded-full text-xs font-semibold', subjectColors[course.subject])}>
                      {subjectIcons[course.subject]} {course.subject}
                    </span>
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    <strong>Класс:</strong> {course.class_number}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    <strong>Преподаватель:</strong> {course.teacher.username}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {total && total > limit && (
        <div className="mt-8 flex justify-center items-center gap-4 text-sm animate-fade-in-up">
          <Button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="bg-gray-200 hover:bg-gray-300 hover:scale-105 disabled:opacity-50 transition-transform duration-300"
          >
            ⬅ Предыдущая
          </Button>
          <span className="text-gray-600">Страница {page} из {totalPages}</span>
          <Button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="bg-gray-200 hover:bg-gray-300 hover:scale-105 disabled:opacity-50 transition-transform duration-300"
          >
            Следующая ➡
          </Button>
        </div>
      )}
    </div>
  );
}