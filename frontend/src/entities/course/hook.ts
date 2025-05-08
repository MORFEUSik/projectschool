// src/entities/course/hook.ts
'use client';
import { useState, useEffect } from 'react';
import { api } from '@/shared/api';
import { Course } from '@/entities/course/model';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await api.get('/courses');
        setCourses(response.data);
      } catch {
        setError('Не удалось загрузить курсы');
      } finally {
        setIsLoading(false);
      }
    }
    fetchCourses();
  }, []);

  return { courses, isLoading, error };
}