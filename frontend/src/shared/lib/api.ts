import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/shared/api/fetch';
import { User } from '@/entities/user/model';
import { Course, Enrollment } from '@/entities/course/model';
import { Submission } from '@/entities/submission/model';

export function useUserProfile() {
  return useQuery<User>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/users/me');
      return response.json();
    },
  });
}

export function useCourses() {
  return useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/courses');
      const data = await response.json();
      return data.map((course: any) => ({
        ...course,
        enrollments: (course.enrollments || []).map((e: any) => ({
          id: e.id || 0,
          user_id: e.user_id,
          course_id: e.course_id,
          created_at: e.created_at || '',
        }) as Enrollment),
        teacher: course.teacher || null,
      }));
    },
  });
}

export function useSubmissions() {
  return useQuery<Submission[]>({
    queryKey: ['submissions'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/users/me/submissions');
      return response.json();
    },
  });
}