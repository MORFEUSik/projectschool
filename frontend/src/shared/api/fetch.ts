import Cookies from 'js-cookie';
import { log } from '@/shared/lib/logger';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = Cookies.get('token') || localStorage.getItem('token');
  log('fetchWithAuth: Token:', token);
  if (!token) {
    throw new Error('Токен отсутствует');
  }
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  const response = await fetch(`http://localhost:8080${url}`, { ...options, headers });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Неавторизован');
    }
    const errorData = await response.json();
    throw new Error(errorData.message || `Ошибка API: ${response.statusText}`);
  }
  return response;
}