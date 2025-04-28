import { fetchWithAuth } from '@/shared/api/fetch';
import { Course } from '@/entities/course/model';

interface CreateCourseData {
  title: string;
  description: string;
}

export async function createCourse(data: CreateCourseData): Promise<Course> {
  const response = await fetchWithAuth('/api/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Ошибка создания курса');
  }
  return response.json();
}