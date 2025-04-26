// frontend/src/shared/api/fetch.ts
import Cookies from 'js-cookie';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token') || Cookies.get('token');
  console.log('fetchWithAuth: Token:', token);
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`http://localhost:8080${url}`, {
    ...options,
    headers,
  });

  console.log('fetchWithAuth: Response status:', response.status);
  return response;
}