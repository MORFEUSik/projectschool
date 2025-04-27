// src/shared/api/fetch.ts
import Cookies from 'js-cookie';
import { handleApiError } from './utils';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = Cookies.get('token');
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`http://localhost:8080${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return response;
}