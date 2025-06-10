'use client';

import { useState, FormEvent } from 'react';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { EnvelopeIcon, LockClosedIcon, UserGroupIcon, UserIcon, ShieldCheckIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  class_number: number; // Изменено с class
}

interface ErrorResponse {
  error?: string;
}

interface UserManagementProps {
  users: User[];
  onSuccess: () => void;
  setFormError: (error: string) => void;
}

export function UserManagement({ users, onSuccess, setFormError }: UserManagementProps) {
  // Форма создания пользователя
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('teacher');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Форма изменения роли
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('');
  const [idError, setIdError] = useState('');
  const [roleError, setRoleError] = useState('');

  // Вкладки и фильтры
  const [activeForm, setActiveForm] = useState<'create' | 'role'>('create');
  const [filterRole, setFilterRole] = useState<'all' | 'teacher' | 'student'>('all');
  const [filterClass, setFilterClass] = useState<number | 'all'>('all');

  // Сортировка
  const [sortColumn, setSortColumn] = useState<keyof User | 'class_number'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Заглушка для пользователей
  const mockUsers: User[] = [
    { id: 1, username: 'john_doe', email: 'john@example.com', role: 'teacher', class_number: 0 },
    { id: 2, username: 'jane_smith', email: 'jane@example.com', role: 'student', class_number: 10 },
    { id: 3, username: 'bob_jones', email: 'bob@example.com', role: 'teacher', class_number: 0 },
    { id: 4, username: 'alice_brown', email: 'alice@example.com', role: 'student', class_number: 11 },
    { id: 5, username: 'admin', email: 'admin@example.com', role: 'admin', class_number: 0 },
  ];

  const filteredUsers = (users.length > 0 ? users : mockUsers)
    .filter((user) => {
      if (filterRole === 'all') return true;
      if (filterRole === user.role) {
        if (filterRole === 'student' && filterClass !== 'all') {
          return user.class_number === filterClass;
        }
        return true;
      }
      return false;
    })
    .sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Валидация создания пользователя
  const validateCreateForm = () => {
    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserEmail)) {
      setEmailError('Введите корректный email');
      isValid = false;
    } else {
      setEmailError('');
    }
    if (newUserPassword.length < 6) {
      setPasswordError('Пароль должен быть не менее 6 символов');
      isValid = false;
    } else {
      setPasswordError('');
    }
    return isValid;
  };

  // Валидация изменения роли
  const validateRoleForm = () => {
    let isValid = true;
    if (!/^\d+$/.test(userId) || parseInt(userId) <= 0) {
      setIdError('Введите корректный ID (положительное число)');
      isValid = false;
    } else {
      setIdError('');
    }
    if (!['student', 'teacher', 'admin'].includes(role.toLowerCase())) {
      setRoleError('Роль: student, teacher или admin');
      isValid = false;
    } else {
      setRoleError('');
    }
    return isValid;
  };

  // Создание пользователя
  const handleRegisterUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateCreateForm()) return;

    try {
      await api.post('/admin/create-user', {
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });
      toast.success('Пользователь создан');
      onSuccess();
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('teacher');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Ошибка регистрации';
      setFormError(errorMsg);
      toast.error(errorMsg);
      console.error('Create user error:', err);
    }
  };

  // Изменение роли
  const handleUpdateRole = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateRoleForm()) return;

    try {
      await api.put(`/users/${userId}/role`, { role: role.toLowerCase() });
      toast.success('Роль обновлена');
      onSuccess();
      setUserId('');
      setRole('');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Ошибка изменения роли';
      setFormError(errorMsg);
      toast.error(errorMsg);
      console.error('Update role error:', err);
    }
  };

  // Сортировка
  const handleSort = (column: keyof User | 'class_number') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Вкладки */}
      <Card className="p-4 card-shadow dark:bg-gray-800 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="flex gap-2 justify-center">
          {[
            { id: 'create', label: 'Создать пользователя' },
            { id: 'role', label: 'Изменить роль' },
          ].map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveForm(tab.id as 'create' | 'role')}
              className={clsx(
                'text-sm',
                activeForm === tab.id
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              )}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Формы */}
      <div className="relative">
        <div
          className={clsx(
            'transition-all duration-600 ease-in-out',
            activeForm === 'create' ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-10 pointer-events-none absolute top-0 left-0 w-full'
          )}
        >
          <Card
            className="p-6 card-shadow card-hover-gradient dark:bg-gray-800 animate-fade-in-up border-l-4 border-green-600"
            style={{ animationDelay: '300ms' }}
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Создать пользователя</h3>
            <form onSubmit={handleRegisterUser} className="grid gap-4 sm:grid-cols-2">
              <div className="relative animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className={clsx(
                    'pl-10 border-blue-600 dark:bg-gray-800 dark:text-gray-300',
                    emailError && 'border-red-600'
                  )}
                  required
                />
                {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
              </div>
              <div className="relative animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className={clsx(
                    'pl-10 border-blue-600 dark:bg-gray-800 dark:text-gray-300',
                    passwordError && 'border-red-600'
                  )}
                  required
                />
                {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
              </div>
              <div className="relative sm:col-span-2 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserGroupIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="p-3 pl-10 border border-blue-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-300 w-full"
                >
                  <option value="teacher">Преподаватель</option>
                  <option value="admin">Администратор</option>
                  <option value="student">Ученик</option>
                </select>
              </div>
              <Button
                type="submit"
                className="sm:col-span-2 bg-green-600 hover:bg-green-700 text-white hover:scale-105 transition-transform duration-200 animate-fade-in-up"
                style={{ animationDelay: '700ms' }}
              >
                Создать
              </Button>
            </form>
          </Card>
        </div>
        <div
          className={clsx(
            'transition-all duration-600 ease-in-out',
            activeForm === 'role' ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-10 pointer-events-none absolute top-0 left-0 w-full'
          )}
        >
          <Card
            className="p-6 card-shadow card-hover-gradient dark:bg-gray-800 animate-fade-in-up border-l-4 border-blue-600"
            style={{ animationDelay: '300ms' }}
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Изменить роль</h3>
            <form onSubmit={handleUpdateRole} className="grid gap-4 sm:grid-cols-2">
              <div className="relative animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <Input
                  type="number"
                  placeholder="ID пользователя"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className={clsx(
                    'pl-10 border-blue-600 dark:bg-gray-800 dark:text-gray-300',
                    idError && 'border-red-600'
                  )}
                  required
                />
                {idError && <p className="text-red-500 text-xs mt-1">{idError}</p>}
              </div>
              <div className="relative animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShieldCheckIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <Input
                  placeholder="student / teacher / admin"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={clsx(
                    'pl-10 border-blue-600 dark:bg-gray-800 dark:text-gray-300',
                    roleError && 'border-red-600'
                  )}
                  required
                />
                {roleError && <p className="text-red-500 text-xs mt-1">{roleError}</p>}
              </div>
              <Button
                type="submit"
                className="sm:col-span-2 bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 transition-transform duration-200 animate-fade-in-up"
                style={{ animationDelay: '600ms' }}
              >
                Изменить
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Фильтры */}
      <Card className="p-4 card-shadow dark:bg-gray-800 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Все' },
              { id: 'teacher', label: 'Учитель' },
              { id: 'student', label: 'Ученик' },
            ].map((f) => (
              <Button
                key={f.id}
                onClick={() => {
                  setFilterRole(f.id as 'all' | 'teacher' | 'student');
                  if (f.id !== 'student') setFilterClass('all');
                }}
                className={clsx(
                  'text-sm',
                  filterRole === f.id
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600',
                  'hover:animate-pulse'
                )}
              >
                {f.label}
              </Button>
            ))}
          </div>
          {filterRole === 'student' && (
            <div className="relative animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="p-2 border border-blue-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="all">Все классы</option>
                {[...Array(11)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1} класс</option>
                ))}
              </select>
            </div>
          )}
          <Button
            onClick={() => {
              setFilterRole('all');
              setFilterClass('all');
              setSortColumn('id');
              setSortDirection('asc');
            }}
            className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm hover:animate-pulse"
          >
            Сбросить
          </Button>
        </div>
      </Card>

      {/* Список пользователей */}
      <Card className="p-6 card-shadow card-hover-gradient dark:bg-gray-800 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Список пользователей</h3>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <UserIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-gray-600 dark:text-gray-400">Нет пользователей по выбранным фильтрам</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-800 dark:text-gray-300">
              <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('id')}>
                    ID
                    {sortColumn === 'id' && (
                      sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4 inline ml-1" /> : <ArrowDownIcon className="h-4 w-4 inline ml-1" />
                    )}
                  </th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('email')}>
                    Email
                    {sortColumn === 'email' && (
                      sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4 inline ml-1" /> : <ArrowDownIcon className="h-4 w-4 inline ml-1" />
                    )}
                  </th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('role')}>
                    Роль
                    {sortColumn === 'role' && (
                      sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4 inline ml-1" /> : <ArrowDownIcon className="h-4 w-4 inline ml-1" />
                    )}
                  </th>
                  {filterRole === 'student' && (
                    <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('class_number')}>
                      Класс
                      {sortColumn === 'class_number' && (
                        sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4 inline ml-1" /> : <ArrowDownIcon className="h-4 w-4 inline ml-1" />
                      )}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 animate-fade-in-up"
                    style={{ animationDelay: `${400 + index * 100}ms` }}
                  >
                    <td className="px-4 py-3">{user.id}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'text-xs px-2 py-1 rounded-full',
                          user.role === 'student' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                          user.role === 'teacher' && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
                          user.role === 'admin' && 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                        )}
                      >
                        {user.role === 'student' ? 'Ученик' : user.role === 'teacher' ? 'Учитель' : 'Админ'}
                      </span>
                    </td>
                    {filterRole === 'student' && (
                      <td className="px-4 py-3">
                        {user.class_number > 0 ? `${user.class_number} класс` : 'Не указан'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}