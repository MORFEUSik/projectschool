"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { Card, Button, Input } from '@/shared/ui';
import { useAuth } from '@/shared/lib/AuthContext';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login: authLogin } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('Sending login request:', formData);
    try {
      const response = await fetch('http://localhost:8080/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      console.log('Login response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка входа');
      }
      const data = await response.json();
      console.log('Login response data:', data);
      if (!data.token) {
        throw new Error('Токен не получен от сервера');
      }
      authLogin(data.token); // Используем login из AuthContext
      console.log('Token saved in Cookies:', Cookies.get('token'));
      console.log('Token saved in localStorage:', localStorage.getItem('token'));
      toast.success('Вход выполнен!', { id: 'login-success' });
      router.push('/courses');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка входа';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'login-error' });
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500">
      <Card className="w-full max-w-md p-6 shadow-lg profile-card">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Вход</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="input"
          />
          <Input
            label="Пароль"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="input"
          />
          <Button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Загрузка...' : 'Войти'}
          </Button>
        </form>
        <p className="text-center mt-4 text-gray-600">
          Нет аккаунта?{' '}
          <a href="/register" className="text-blue-500 hover:underline">
            Зарегистрируйтесь
          </a>
        </p>
      </Card>
    </div>
  );
}