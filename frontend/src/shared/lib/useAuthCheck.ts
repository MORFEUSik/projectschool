// src/shared/lib/useAuthCheck.ts
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

export function useAuthCheck() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('token') || Cookies.get('token');
    if (!token) {
      toast.error('Пожалуйста, войдите в аккаунт');
      router.push('/login');
    }
  }, [router]);
  //return { isAuthenticated: !!token };
}