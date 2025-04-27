import { User } from '@/entities/user/model';

export interface Enrollment {
  user_id: number;
  course_id: number;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  teacher: User; // Используем User из user/model.ts
  enrollments: Enrollment[];
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: number;
  course_id: number;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  points_multiplier?: number;
  max_score?: number;
  teacher_id?: number;
}