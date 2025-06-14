'use client';

import { useState, FormEvent } from 'react';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { EnvelopeIcon, LockClosedIcon, UserGroupIcon, UserIcon, ArrowUpIcon, ArrowDownIcon, TrashIcon } from '@heroicons/react/24/outline';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  class_number: number;
}

interface ErrorResponse {
  error?: string;
}

interface UserManagementProps {
  users: User[];
  onSuccess: () => void;
  setFormError: (error: string) => void;
  openRoleModal: (user: User) => void;
  openDeleteModal: (user: User) => void;
}

export default function UserManagement({ users, onSuccess, setFormError, openRoleModal, openDeleteModal }: UserManagementProps) {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState('teacher');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'teacher' | 'student'>('all');
  const [filterClass, setFilterClass] = useState<number | 'all'>('all');
  const [filterFullName, setFilterFullName] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof User | 'class_number'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
    if (!newUserFullName) {
      setFullNameError('ФИО обязательно');
      isValid = false;
    } else {
      setFullNameError('');
    }
    return isValid;
  };

  const handleRegisterUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateCreateForm()) return;

    try {
      await api.post('/admin/create-user', {
        email: newUserEmail,
        password: newUserPassword,
        full_name: newUserFullName,
        role: newUserRole,
      });
      toast.success('Пользователь создан');
      onSuccess();
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
      setNewUserRole('teacher');
    } catch (err: any) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Ошибка регистрации';
      setFormError(errorMsg);
      toast.error(errorMsg);
      console.error('Create user error:', err);
    }
  };

  const handleSort = (column: keyof User | 'class_number') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const roleLabels: { [key: string]: string } = {
    student: 'Ученик',
    teacher: 'Учитель',
    admin: 'Админ',
  };

  const filteredUsers = users
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
    .filter((user) => {
      if (!filterFullName) return true;
      return user.full_name.toLowerCase().includes(filterFullName.toLowerCase());
    })
    .sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="w-[50rem] mx-auto">
      <Card className="p-4 rounded-xl dark:bg-gray-800 animate-fade-in-up border-l-4 border-green-500 w-full mb-4 shadow-sm" style={{ animationDelay: '300ms' }}>
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Создать пользователя</h3>
        <form onSubmit={handleRegisterUser} className="grid gap-3 sm:grid-cols-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-4 w-4 text-gray-400 dark:text-gray-300" />
            </div>
            <Input
              type="email"
              placeholder="Email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className={clsx(
                'pl-8 text-sm border-blue-500 dark:bg-gray-800 dark:text-gray-200',
                emailError && 'border-red-500'
              )}
              required
            />
            {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <LockClosedIcon className="h-4 w-4 text-gray-400 dark:text-gray-300" />
            </div>
            <Input
              type="password"
              placeholder="Пароль"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              className={clsx(
                'pl-8 text-sm border-blue-500 dark:bg-gray-800 dark:text-gray-200',
                passwordError && 'border-red-500'
              )}
              required
            />
            {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <UserIcon className="h-4 w-4 text-gray-400 dark:text-gray-300" />
            </div>
            <Input
              type="text"
              placeholder="ФИО"
              value={newUserFullName}
              onChange={(e) => setNewUserFullName(e.target.value)}
              className={clsx(
                'pl-8 text-sm border-blue-500 dark:bg-gray-800 dark:text-gray-200',
                fullNameError && 'border-red-500'
              )}
              required
            />
            {fullNameError && <p className="text-red-500 text-xs mt-1">{fullNameError}</p>}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <UserGroupIcon className="h-4 w-4 text-gray-400 dark:text-gray-300" />
            </div>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              className="p-2 pl-8 text-sm border border-blue-500 rounded-lg w-full dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="teacher">Учитель</option>
              <option value="admin">Админ</option>
            </select>
          </div>
          <Button
            type="submit"
            className="sm:col-span-2 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 hover:scale-105 transition-transform duration-200"
          >
            Создать
          </Button>
        </form>
      </Card>

      <Card className="p-3 rounded-xl dark:bg-gray-800 animate-fade-in-up w-full mb-4 shadow-sm" style={{ animationDelay: '200ms' }}>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'Все' },
              { value: 'teacher', label: 'Учитель' },
              { value: 'student', label: 'Ученик' },
            ].map((opt) => (
              <Button
                key={opt.value}
                onClick={() => {
                  setFilterRole(opt.value as 'all' | 'teacher' | 'student');
                  if (opt.value !== 'student') setFilterClass('all');
                }}
                className={clsx(
                  'text-xs py-1 px-3',
                  filterRole === opt.value
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                )}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:w-48">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <UserIcon className="h-4 w-4 text-gray-400 dark:text-gray-300" />
            </div>
            <Input
              placeholder="Поиск по ФИО"
              value={filterFullName}
              onChange={(e) => setFilterFullName(e.target.value)}
              className="pl-8 text-sm border-blue-500 dark:bg-gray-800 dark:text-gray-200 w-full"
            />
          </div>
          {filterRole === 'student' && (
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="p-2 text-sm border border-blue-500 rounded-lg dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="all">Все классы</option>
              {[...Array(11)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} класс
                </option>
              ))}
            </select>
          )}
          <Button
            onClick={() => {
              setFilterRole('all');
              setFilterClass('all');
              setFilterFullName('');
              setSortColumn('id');
              setSortDirection('asc');
            }}
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs py-1 px-3"
          >
            Сбросить
          </Button>
        </div>
      </Card>

      <Card className="p-4 rounded-xl dark:bg-gray-800 animate-fade-in-up w-full shadow-sm" style={{ animationDelay: '300ms' }}>
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Список пользователей</h3>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-6">
            <UserIcon className="h-10 w-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">Нет пользователей по выбранным фильтрам</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs text-left text-gray-800 dark:text-gray-200">
              <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-2 py-2 cursor-pointer min-w-[60px]" onClick={() => handleSort('id')}>
                    ID
                    {sortColumn === 'id' && (
                      sortDirection === 'asc' ? <ArrowUpIcon className="h-3 w-3 inline ml-1" /> : <ArrowDownIcon className="h-3 w-3 inline ml-1" />
                    )}
                  </th>
                  <th className="px-2 py-2 cursor-pointer min-w-[100px]" onClick={() => handleSort('username')}>
                    Имя
                    {sortColumn === 'username' && (
                      sortDirection === 'asc' ? <ArrowUpIcon className="h-3 w-3 inline ml-1" /> : <ArrowDownIcon className="h-3 w-3 inline ml-1" />
                    )}
                  </th>
                  <th className="px-2 py-2 cursor-pointer min-w-[100px]" onClick={() => handleSort('full_name')}>
                    ФИО
                    {sortColumn === 'full_name' && (
                      sortDirection === 'asc' ? <ArrowUpIcon className="h-3 w-3 inline ml-1" /> : <ArrowDownIcon className="h-3 w-3 inline ml-1" />
                    )}
                  </th>
                  <th className="px-2 py-2 cursor-pointer min-w-[120px]" onClick={() => handleSort('email')}>
                    Email
                    {sortColumn === 'email' && (
                      sortDirection === 'asc' ? <ArrowUpIcon className="h-3 w-3 inline ml-1" /> : <ArrowDownIcon className="h-3 w-3 inline ml-1" />
                    )}
                  </th>
                  <th className="px-2 py-2 cursor-pointer min-w-[80px]" onClick={() => handleSort('role')}>
                    Роль
                    {sortColumn === 'role' && (
                      sortDirection === 'asc' ? <ArrowUpIcon className="h-3 w-3 inline ml-1" /> : <ArrowDownIcon className="h-3 w-3 inline ml-1" />
                    )}
                  </th>
                  <th className="px-2 py-2 cursor-pointer min-w-[80px]" onClick={() => handleSort('class_number')}>
                    Класс
                    {sortColumn === 'class_number' && (
                      sortDirection === 'asc' ? <ArrowUpIcon className="h-3 w-3 inline ml-1" /> : <ArrowDownIcon className="h-3 w-3 inline ml-1" />
                    )}
                  </th>
                  <th className="px-2 py-2 min-w-[40px]">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 animate-fade-in-up transition-colors duration-200"
                    style={{ animationDelay: `${400 + index * 100}ms` }}
                  >
                    <td className="px-2 py-2">{user.id}</td>
                    <td className="px-2 py-2 truncate max-w-[100px]" title={user.username}>{user.username}</td>
                    <td className="px-2 py-2 truncate max-w-[100px]" title={user.full_name || '-'}>{user.full_name || '-'}</td>
                    <td className="px-2 py-2 truncate max-w-[120px]" title={user.email}>{user.email}</td>
                    <td className="px-2 py-2">
                      <button
                        className={clsx(
                          'text-blue-500 hover:underline text-xs',
                          user.role === 'student' && 'text-green-500 dark:text-green-400',
                          user.role === 'teacher' && 'text-blue-500 dark:text-blue-400',
                          user.role === 'admin' && 'text-purple-500 dark:text-purple-400'
                        )}
                        onClick={() => openRoleModal(user)}
                      >
                        {roleLabels[user.role] || user.role}
                      </button>
                    </td>
                    <td className="px-2 py-2">{user.class_number > 0 ? `${user.class_number} класс` : '-'}</td>
                    <td className="px-2 py-2">
                      <Button
                        onClick={() => openDeleteModal(user)}
                        className="bg-red-500 hover:bg-red-600 text-white p-1 rounded hover:scale-105 transition-transform duration-200"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </td>
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