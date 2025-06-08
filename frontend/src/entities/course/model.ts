export interface Course {
  id: number;
  title: string;
  description: string;
  subject: string;
  class_number: number;
  teacher: {
    id: number;
    username: string;
  };
  created_at: string;
  updated_at: string;
  assignments?: {
    id: number;
    title: string;
    description: string;
    max_score: number;
    due_date: string;
  }[];
}