'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import Link from 'next/link';
import { AxiosError } from 'axios';

interface Assignment {
  id: number;
  title: string;
  description: string;
  max_score: number;
  due_date: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  teacher: { username: string };
}

interface ErrorResponse {
  error?: string;
}

export default function CoursePage() {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCourse() {
      setIsLoading(true);
      try {
        const courseResponse = await api.get<Course>(`/courses/${id}`);
        const assignmentsResponse = await api.get<Assignment[]>(`/courses/${id}/assignments`);
        setCourse(courseResponse.data);
        setAssignments(assignmentsResponse.data);
      } catch (err: unknown) {
        const axiosError = err as AxiosError<ErrorResponse>;
        setError(axiosError.response?.data?.error || 'Ошибка загрузки курса');
      } finally {
        setIsLoading(false);
      }
    }
    fetchCourse();
  }, [id]);

  if (isLoading) return <div className="text-center mt-8">Загрузка...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Ошибка: {error}</div>;
  if (!course) return <div className="text-center mt-8">Курс не найден</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">{course.title}</h1>
      <Card className="p-6 mb-6">
        <p className="mb-2">{course.description}</p>
        <p>
          <strong>Преподаватель:</strong> {course.teacher.username}
        </p>
      </Card>
      <h2 className="text-2xl font-semibold mb-4">Задания</h2>
      <div className="space-y-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="p-6">
            <Link href={`/courses/${id}/assignments/${assignment.id}`}>
              <h3 className="text-xl font-semibold hover:underline">{assignment.title}</h3>
            </Link>
            <p className="mt-2">{assignment.description}</p>
            <p className="mt-2">
              <strong>Максимальный балл:</strong> {assignment.max_score}
            </p>
            <p className="mt-2">
              <strong>Срок сдачи:</strong> {new Date(assignment.due_date).toLocaleString()}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}