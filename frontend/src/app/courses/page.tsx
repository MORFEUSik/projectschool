// src/app/courses/page.tsx
'use client';
import { useCourses } from '@/entities/course/hook';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { EnrollButton } from '@/features/course/enroll';
import { Course } from '@/entities/course/model'; // Добавляем импорт

export default function CoursesPage() {
  const { courses, isLoading, error } = useCourses();

  if (isLoading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Курсы</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course: Course) => (
          <Card key={course.id}>
            <h2 className="text-xl font-semibold">{course.title}</h2>
            <p>{course.description}</p>
            <p><strong>Преподаватель:</strong> {course.teacher.username}</p>
            <EnrollButton courseId={course.id} />
          </Card>
        ))}
        <Button>Создать курс</Button>
      </div>
    </div>
  );
}