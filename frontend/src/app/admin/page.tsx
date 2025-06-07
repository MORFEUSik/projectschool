// frontend/src/app/admin/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@/entities/user/hook';
import { UserRoleForm } from './components/UserRoleForm';
import { CreateUserForm } from './components/CreateUserForm';
import { AchievementManagement } from './components/AchievementManagement';
import { ActionLogs } from './components/ActionLogs';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface ApiAchievement {
  ID: number;
  Title: string;
  Description: string;
  Condition: string;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  condition: string;
}

interface LogEntry {
  id: number;
  user_id: number;
  action: string;
  details: string;
  created_at: string;
}

interface ErrorResponse {
  error?: string;
}

export default function AdminPage() {
  const { user, isLoading } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    try {
      const [usersRes, achRes, logRes] = await Promise.all([
        api.get<User[]>('/users'),
        api.get<ApiAchievement[]>('/achievements'),
        api.get<{ logs: LogEntry[]; total: number }>('/admin/logs'),
      ]);
      const transformedAchievements = achRes.data.map((ach) => ({
        id: ach.ID,
        title: ach.Title,
        description: ach.Description,
        condition: ach.Condition,
      }));
      setUsers(usersRes.data || []);
      setAchievements(transformedAchievements || []);
      setLogs(logRes.data.logs || []);
      setFormError('');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      setFormError(axiosError.response?.data?.error || 'Ошибка загрузки данных');
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  if (isLoading) return <div className="text-center mt-8">Загрузка...</div>;
  if (!user || user.role !== 'admin')
    return <div className="text-center mt-8 text-red-500">Доступ запрещён</div>;

  return (
    <div className="max-w-4xl mx-auto mt-12 px-4">
      <h1 className="text-4xl font-extrabold text-center text-blue-600 mb-8">🛠 Админ-панель</h1>
      {formError && <p className="text-red-500 text-sm mb-4 text-center">{formError}</p>}

      <UserRoleForm onSuccess={fetchData} setFormError={setFormError} />
      <CreateUserForm onSuccess={fetchData} setFormError={setFormError} />
      <AchievementManagement
        achievements={achievements}
        onSuccess={fetchData}
        setFormError={setFormError}
      />
      <ActionLogs logs={logs} />
    </div>
  );
}