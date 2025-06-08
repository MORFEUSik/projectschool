export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string; // Добавляем ФИО
  role: 'student' | 'teacher' | 'admin';
  class_number?: number;
  points: number;
  created_at: string;
  updated_at: string;
}