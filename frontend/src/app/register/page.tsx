// frontend/src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register } from '@/features/auth/api';
import { AuthForm } from '@/features/auth/ui';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Role } from '@/entities/user/model';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: Role.Student,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await register(formData);
      localStorage.setItem('token', response.token);
      Cookies.set('token', response.token, { expires: 7 }); // Сохраняем в cookies на 7 дней
      toast.success('Регистрация прошла успешно!');
      router.push('/profile');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка регистрации';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500">
      <Card className="w-full max-w-md p-6 shadow-lg animate-bounce-in">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Регистрация</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <AuthForm onSubmit={handleSubmit}>
          <Input
            label="Имя пользователя"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Введите имя"
            className="mb-4"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Введите email"
            className="mb-4"
          />
          <Input
            label="Пароль"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Введите пароль"
            className="mb-4"
          />
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Роль</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-200"
            >
              <option value={Role.Student}>Студент</option>
              <option value={Role.Teacher}>Учитель</option>
              <option value={Role.Admin}>Админ</option>
            </select>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Загрузка...' : 'Зарегистрироваться'}
          </Button>
        </AuthForm>
        <p className="text-center mt-4">
          Уже есть аккаунт?{' '}
          <a href="/login" className="text-blue-500 hover:underline">
            Войти
          </a>
        </p>
      </Card>
    </div>
  );
}