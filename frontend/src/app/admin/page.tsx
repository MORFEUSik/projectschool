'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/entities/user/hook';
import UserManagement from './components/UserManagement';
import AchievementManagement from './components/AchievementManagement';
import ActionLogs from './components/ActionLogs';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import clsx from 'clsx';
import { UserIcon, TrophyIcon, ClipboardIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import ConfirmModal from '@/widgets/ConfirmModal';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  class_number: number;
  full_name: string;
}

interface ApiAchievement {
  ID: number;
  Title: string;
  Description: string;
  ConditionType: string;
  Threshold: number;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  condition_type: string;
  threshold: number;
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
  const [roleModal, setRoleModal] = useState<{ isOpen: boolean; user: User | null; newRole: string }>({
    isOpen: false,
    user: null,
    newRole: '',
  });
  const [deleteUserModal, setDeleteUserModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  });
  const [deleteAchievementModal, setDeleteAchievementModal] = useState<{ isOpen: boolean; achievement: Achievement | null }>({
    isOpen: false,
    achievement: null,
  });

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
        condition_type: ach.ConditionType,
        threshold: ach.Threshold,
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

  const handleUpdateRole = async () => {
    if (!roleModal.user) return;

    try {
      await api.put(`/users/${roleModal.user.id}/role`, { role: roleModal.newRole.toLowerCase() });
      fetchData();
      setRoleModal({ isOpen: false, user: null, newRole: '' });
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Ошибка изменения роли';
      setFormError(errorMsg);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserModal.user) return;

    try {
      await api.delete(`/admin/users/${deleteUserModal.user.id}`);
      fetchData();
      setDeleteUserModal({ isOpen: false, user: null });
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Ошибка удаления пользователя';
      setFormError(errorMsg);
    }
  };

  const handleDeleteAchievement = async () => {
    if (!deleteAchievementModal.achievement) return;

    try {
      await api.delete(`/achievements/${deleteAchievementModal.achievement.id}`);
      fetchData();
      setDeleteAchievementModal({ isOpen: false, achievement: null });
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Ошибка удаления достижения';
      setFormError(errorMsg);
    }
  };

  const tabs = [
    {
      id: 'users',
      label: 'Управление пользователями',
      icon: UserIcon,
      component: (
        <UserManagement
          users={users}
          onSuccess={fetchData}
          setFormError={setFormError}
          openRoleModal={(user) =>
            setRoleModal({ isOpen: true, user, newRole: user.role })
          }
          openDeleteModal={(user) => setDeleteUserModal({ isOpen: true, user })}
        />
      ),
    },
    {
      id: 'achievements',
      label: 'Управление достижениями',
      icon: TrophyIcon,
      component: (
        <AchievementManagement
          achievements={achievements}
          onSuccess={fetchData}
          setFormError={setFormError}
          openDeleteModal={(achievement) => setDeleteAchievementModal({ isOpen: true, achievement })}
        />
      ),
    },
    { id: 'logs', label: 'Логи действий', icon: ClipboardIcon, component: <ActionLogs logs={logs} /> },
  ] as const;

  if (isLoading) {
    return (
      <div className="w-full h-auto flex flex-col bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)]">
        <div className="max-w-[140rem] mx-auto mt-8 px-4 flex flex-col flex-1">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
          >
            🛠 Админ-панель
          </motion.h1>
          <div className="space-y-4 flex-1">
            {[...Array(3)].map((_, i) => (
              <Card
                key={i}
                className="p-6 rounded-2xl dark:bg-gray-800 animate-pulse"
              >
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
              </Card>
            ))}
          </div>
        </div>
        <footer className="bg-gray-100 dark:bg-gray-800 text-center py-4 mt-auto">
          <p className="text-gray-600 dark:text-gray-400 text-sm">© 2025 Admin Panel</p>
        </footer>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="w-full h-auto flex flex-col bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)]">
        <div className="max-w-[140rem] mx-auto mt-8 px-4 flex flex-col flex-1">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
          >
            🛠 Админ-панель
          </motion.h1>
          <p
            className="text-center bg-red-500 dark:bg-red-600 text-white p-3 rounded-2xl mb-4 animate-pulse"
            style={{ animationDelay: '200ms' }}
          >
            Доступ запрещён
          </p>
        </div>
        <footer className="bg-gray-100 dark:bg-gray-800 text-center py-4 mt-auto">
          <p className="text-gray-600 dark:text-gray-400 text-sm">© 2025 Admin Panel</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="w-full h-auto flex flex-col bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)]">
      <div className="max-w-[140rem] mx-auto mt-8 px-4 flex flex-col md:flex-row gap-8 flex-1 rounded-2xl shadow-lg overflow-hidden">
        <Button
          className="md:hidden bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-2xl mb-4 flex items-center gap-2 hover:scale-105 transition-transform duration-200"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          Меню
        </Button>

        <Card
          className={clsx(
            'w-full md:w-64 rounded-2xl dark:bg-gray-800 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 transition-transform duration-300',
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
                    'w-full flex items-center gap-3 text-left py-3 px-4 rounded-2xl transition-transform duration-200 hover:scale-105',
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 animate-pulse'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600',
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

        <div className="flex-1 flex flex-col">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
          >
            🛠 Админ-панель
          </motion.h1>

          {formError && (
            <p
              className="text-center bg-red-500 dark:bg-red-600 text-white p-3 rounded-2xl mb-6 animate-pulse"
              style={{ animationDelay: '200ms' }}
            >
              {formError}
            </p>
          )}

          <div className="relative flex-1 flex flex-col">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={clsx(
                  'transition-all duration-600 ease-in-out w-full',
                  activeTab === tab.id
                    ? 'opacity-100 transform translate-x-0'
                    : 'opacity-0 transform translate-x-10 pointer-events-none absolute top-0 left-0 w-full'
                )}
              >
                <Card
                  className={clsx(
                    'p-8 rounded-2xl dark:bg-gray-800 animate-fade-in-up border-l-4 w-full',
                    tab.id === 'users' && 'border-blue-600',
                    tab.id === 'achievements' && 'border-yellow-600',
                    tab.id === 'logs' && 'border-gray-600'
                  )}
                  style={{ animationDelay: '200ms' }}
                >
                  <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
                    {tab.label}
                  </h2>
                  {tab.component}
                </Card>
              </div>
            ))}
          </div>
        </div>

        {roleModal.isOpen && roleModal.user && (
          <ConfirmModal
            isOpen={roleModal.isOpen}
            onClose={() => setRoleModal({ isOpen: false, user: null, newRole: '' })}
            onConfirm={handleUpdateRole}
            title="Изменить роль пользователя"
            message={
              <div>
                Изменить роль пользователя <span>{roleModal.user.username}</span> на:
                <select
                  value={roleModal.newRole}
                  onChange={(e) =>
                    setRoleModal({ ...roleModal, newRole: e.target.value })
                  }
                  className="mt-2 p-2 border border-blue-600 rounded-lg w-full dark:bg-gray-800 dark:text-gray-300"
                >
                  <option value="student">Ученик</option>
                  <option value="teacher">Учитель</option>
                  <option value="admin">Админ</option>
                </select>
              </div>
            }
            confirmText="Изменить"
            cancelText="Отмена"
          />
        )}

        {deleteUserModal.isOpen && deleteUserModal.user && (
          <ConfirmModal
            isOpen={deleteUserModal.isOpen}
            onClose={() => setDeleteUserModal({ isOpen: false, user: null })}
            onConfirm={handleDeleteUser}
            title="Удалить пользователя"
            message={`Вы уверены, что хотите удалить пользователя ${deleteUserModal.user.username} (${deleteUserModal.user.full_name || 'Без ФИО'})?`}
            confirmText="Удалить"
            cancelText="Отмена"
            confirmButtonClass="bg-red-600 hover:bg-red-700"
          />
        )}

        {deleteAchievementModal.isOpen && deleteAchievementModal.achievement && (
          <ConfirmModal
            isOpen={deleteAchievementModal.isOpen}
            onClose={() => setDeleteAchievementModal({ isOpen: false, achievement: null })}
            onConfirm={handleDeleteAchievement}
            title="Удалить достижение"
            message={`Вы уверены, что хотите удалить достижение "${deleteAchievementModal.achievement.title}"?`}
            confirmText="Удалить"
            cancelText="Отмена"
            confirmButtonClass="bg-red-600 hover:bg-red-700"
          />
        )}
      </div>
      <footer className="bg-gray-100 dark:bg-gray-800 text-center py-4 mt-auto">
        <p className="text-gray-600 dark:text-gray-400 text-sm">© 2025 Admin Panel</p>
      </footer>
    </div>
  );
}