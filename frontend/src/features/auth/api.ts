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