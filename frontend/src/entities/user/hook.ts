// src/entities/user/hook.ts
'use client';
import { useState, useEffect } from 'react';
import { api } from '@/shared/api';
import { User } from '@/entities/user/model';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await api.get('/users/me');
        setUser(response.data);
      } catch {
        setError('Не удалось загрузить профиль');
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, []);

  return { user, isLoading, error };
}