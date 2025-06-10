'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/entities/user/hook';
import { UserManagement } from './components/UserManagement';
import { AchievementManagement } from './components/AchievementManagement';
import { ActionLogs } from './components/ActionLogs';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import clsx from 'clsx';
import { UserIcon, TrophyIcon, ClipboardIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  class_number: number; // Добавлено
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
  const [activeTab, setActiveTab] = useState<'users' | 'achievements' | 'logs'>('users');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      const errorMsg = axiosError.response?.data?.error || 'Ошибка загрузки данных';
      setFormError(errorMsg);
      console.error('API error:', err);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const tabs = [
    { id: 'users', label: 'Управление пользователями', icon: UserIcon, component: <UserManagement users={users} onSuccess={fetchData} setFormError={setFormError} /> },
    { id: 'achievements', label: 'Управление достижениями', icon: TrophyIcon, component: <AchievementManagement achievements={achievements} onSuccess={fetchData} setFormError={setFormError} /> },
    { id: 'logs', label: 'Логи действий', icon: ClipboardIcon, component: <ActionLogs logs={logs} /> }, // Убрано (logs.length)
  ] as const;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto mt-12 px-4">
        <h1 className="text-4xl font-extrabold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          🛠 Админ-панель
        </h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 card-shadow dark:bg-gray-800 animate-pulse">
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto mt-12 px-4">
        <h1 className="text-4xl font-extrabold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          🛠 Админ-панель
        </h1>
        <p className="text-center bg-red-500 dark:bg-red-600 text-white p-3 rounded mb-4 animate-pulse" style={{ animationDelay: '200ms' }}>
          Доступ запрещён
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-12 px-4 flex flex-col md:flex-row gap-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Mobile Sidebar Toggle */}
      <Button
        className="md:hidden bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg mb-4 flex items-center gap-2 hover:scale-105 transition-transform duration-200"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        Меню
      </Button>

      {/* Sidebar */}
      <Card
        className={clsx(
          'w-full md:w-64 card-shadow dark:bg-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 transition-transform duration-300',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          'fixed md:static top-0 left-0 h-full md:h-auto z-40 shadow-xl md:shadow-none p-6'
        )}
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
          <ClipboardIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          Панель управления
        </h2>
        <nav className="space-y-2">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsSidebarOpen(false);
                }}
                className={clsx(
                  'w-full flex items-center gap-3 text-left py-3 px-4 rounded-lg transition-transform duration-200 hover:scale-105',
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white hover:bg-blue-700 animate-pulse'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600',
                  'animate-slide-in-left'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Icon className="h-6 w-6 hover:animate-bounce" />
                <span className="flex-1">{tab.label}</span>
              </Button>
            );
          })}
        </nav>
      </Card>

      {/* Main Content */}
      <div className="flex-1">
        <h1
          className="text-4xl font-extrabold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          🛠 Админ-панель
        </h1>

        {formError && (
          <p
            className="text-center bg-red-500 dark:bg-red-600 text-white p-3 rounded mb-6 animate-pulse"
            style={{ animationDelay: '200ms' }}
          >
            {formError}
          </p>
        )}

        <div className="relative">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={clsx(
                'transition-all duration-600 ease-in-out',
                activeTab === tab.id
                  ? 'opacity-100 transform translate-x-0'
                  : 'opacity-0 transform translate-x-10 pointer-events-none absolute top-0 left-0 w-full'
              )}
            >
              <Card
                className={clsx(
                  'p-8 card-shadow card-hover-gradient dark:bg-gray-800 animate-fade-in-up border-l-4',
                  tab.id === 'users' && 'border-blue-600',
                  tab.id === 'achievements' && 'border-yellow-600',
                  tab.id === 'logs' && 'border-gray-600'
                )}
                style={{ animationDelay: '200ms' }}
              >
                <h2
                  className="text-2xl font-semibold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text"
                  style={{ animationDelay: '300ms' }}
                >
                  {tab.label}
                </h2>
                {tab.component}
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}