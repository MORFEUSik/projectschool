import { fetchWithAuth } from '@/shared/api/fetch';
import { Role } from '@/entities/user/model';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: Role;
}

interface RegisterResponse {
  message: string;
  token: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface LoginResponse {
  message: string;
  token: string;
}

interface ProfileResponse {
  id: number;
  username: string;
  email: string;
  role: Role;
  points: number;
}

interface SubmissionResponse {
  id: number;
  assignment_id: number;
  content: string;
  grade: number;
  created_at: string;
  assignment: {
    id: number;
    title: string;
    course_id: number;
  };
}

export async function register(data: RegisterData): Promise<RegisterResponse> {
  const response = await fetchWithAuth('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка регистрации');
  }

  return response.json();
}

export async function login(data: LoginData): Promise<LoginResponse> {
  const response = await fetchWithAuth('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка входа');
  }

  return response.json();
}

export async function getProfile(): Promise<ProfileResponse> {
  const response = await fetchWithAuth('/api/users/me', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка загрузки профиля');
  }

  return response.json();
}

export async function getSubmissions(): Promise<SubmissionResponse[]> {
  const response = await fetchWithAuth('/api/users/me/submissions', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка загрузки решений');
  }

  return response.json();
}