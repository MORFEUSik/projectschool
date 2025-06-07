// frontend/src/app/admin/components/CreateUserForm.tsx
'use client';
import { useState, FormEvent } from 'react';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';

interface ErrorResponse {
  error?: string;
}

interface CreateUserFormProps {
  onSuccess: () => void;
  setFormError: (error: string) => void;
}

export function CreateUserForm({ onSuccess, setFormError }: CreateUserFormProps) {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('teacher');

  const handleRegisterUser = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/create-user', {
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });
      onSuccess();
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('teacher');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setFormError(axiosError.response?.data?.error || 'Ошибка регистрации');
    }
  };

  return (
    <Card className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Создать нового пользователя</h2>
      <form onSubmit={handleRegisterUser} className="grid gap-4 sm:grid-cols-2">
        <Input
          type="email"
          placeholder="Email"
          value={newUserEmail}
          onChange={(e) => setNewUserEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Пароль"
          value={newUserPassword}
          onChange={(e) => setNewUserPassword(e.target.value)}
          required
        />
        <select
          value={newUserRole}
          onChange={(e) => setNewUserRole(e.target.value)}
          className="p-2 border rounded sm:col-span-2"
        >
          <option value="teacher">Преподаватель</option>
          <option value="admin">Администратор</option>
        </select>
        <Button type="submit" className="sm:col-span-2">
          Создать
        </Button>
      </form>
    </Card>
  );
}