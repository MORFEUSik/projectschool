'use client';

import { useState, FormEvent } from 'react';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import ConfirmModal from '@/widgets/ConfirmModal';
import { EnvelopeIcon, LockClosedIcon, UserGroupIcon, UserIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface User {
  id: number;
  username: string;
  email: string;
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
}

export default function UserManagement({ users, onSuccess, setFormError }: UserManagementProps) {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('teacher');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterRole, setFilterRole] = useState<'all' | 'teacher' | 'student'>('all');
  const [filterClass, setFilterClass] = useState<number | 'all'>('all');
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
    return isValid;
  };

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

  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsModalOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    try {
      await api.put(`/users/${selectedUser.id}/role`, { role: newRole.toLowerCase() });
      toast.success('Роль обновлена');
      onSuccess();
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Ошибка изменения роли';
      setFormError(errorMsg);
      toast.error(errorMsg);
      console.error('Update role error:', err);
    } finally {
      setIsModalOpen(false);
      setSelectedUser(null);
      setNewRole('');
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
    .sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="space-y-6">
      <Card className="p-6 card-shadow dark:bg-gray-800 animate-fade-in-up border-l-4 border-green-600" style={{ animationDelay: '300ms' }}>
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Создать пользователя</h3>
        <form onSubmit={handleRegisterUser} className="grid gap-4 sm:grid-cols-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-gray-300" />
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
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-gray-400 dark:text-gray-300" />
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
          <div className="relative sm:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserGroupIcon className="h-5 w-5 text-gray-400 dark:text-gray-300" />
            </div>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              className="p-2 pl-10 border border-blue-600 rounded-lg w-full dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="teacher">Учитель</option>
              <option value="student">Ученик</option>
              <option value="admin">Админ</option>
            </select>
          </div>
          <Button
            type="submit"
            className="sm:col-span-2 bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 transition-transform duration-200"
          >
            Создать
          </Button>
        </form>
      </Card>

      <Card className="p-4 card-shadow dark:bg-gray-800 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
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
                  'text-sm',
                  filterRole === opt.value
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                )}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          {filterRole === 'student' && (
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="p-2 border border-blue-600 rounded-lg dark:bg-gray-800 dark:text-gray-300"
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
              setSortColumn('id');
              setSortDirection('asc');
            }}
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Сбросить
          </Button>
        </div>
      </Card>

      <Card className="p-6 card-shadow dark:bg-gray-800 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Список пользователей</h3>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-6">
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
                  <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('username')}>
                    Имя
                    {sortColumn === 'username' && (
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
                  <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('class_number')}>
                    Класс
                    {sortColumn === 'class_number' && (
                      sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4 inline ml-1" /> : <ArrowDownIcon className="h-4 w-4 inline ml-1" />
                    )}
                  </th>
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
                    <td className="px-4 py-3">{user.username}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <button
                        className={clsx(
                          'text-blue-600 hover:underline',
                          user.role === 'student' && 'text-green-600 dark:text-green-400',
                          user.role === 'teacher' && 'text-blue-600 dark:text-blue-400',
                          user.role === 'admin' && 'text-purple-600 dark:text-purple-400'
                        )}
                        onClick={() => openRoleModal(user)}
                      >
                        {roleLabels[user.role] || user.role}
                      </button>
                    </td>
                    <td className="px-4 py-3">{user.class_number > 0 ? `${user.class_number} класс` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedUser && (
        <ConfirmModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
            setNewRole('');
          }}
          onConfirm={handleUpdateRole}
          title="Изменить роль пользователя"
          message={
            <>
              Изменить роль пользователя <strong>{selectedUser.username}</strong> на:
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="mt-2 p-2 border border-blue-600 rounded-lg w-full dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="student">Ученик</option>
                <option value="teacher">Учитель</option>
                <option value="admin">Админ</option>
              </select>
            </>
          }
          confirmText="Изменить"
          cancelText="Отмена"
        />
      )}
    </div>
  );
}