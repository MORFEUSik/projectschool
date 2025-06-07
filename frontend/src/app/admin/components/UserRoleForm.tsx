// frontend/src/app/admin/components/UserRoleForm.tsx
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

interface UserRoleFormProps {
  onSuccess: () => void;
  setFormError: (error: string) => void;
}

export function UserRoleForm({ onSuccess, setFormError }: UserRoleFormProps) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('');

  const handleUpdateRole = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/users/${userId}/role`, { role });
      onSuccess();
      setUserId('');
      setRole('');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setFormError(axiosError.response?.data?.error || 'Ошибка изменения роли');
    }
  };

  return (
    <Card className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Изменить роль пользователя</h2>
      <form onSubmit={handleUpdateRole} className="grid gap-4 sm:grid-cols-2">
        <Input
          type="number"
          placeholder="ID пользователя"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        />
        <Input
          placeholder="student / teacher / admin"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        />
        <Button type="submit" className="sm:col-span-2">
          Изменить
        </Button>
      </form>
    </Card>
  );
}