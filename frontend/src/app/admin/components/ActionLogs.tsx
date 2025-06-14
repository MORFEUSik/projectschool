'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import clsx from 'clsx';
import {
  UserIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { unparse } from 'papaparse';
import toast from 'react-hot-toast';

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
}

interface LogEntry {
  id: number;
  user_id: number;
  action: string;
  details: string;
  created_at: string;
  user?: User | null;
}

type FilterType = 'all' | 'create' | 'update' | 'delete' | 'enroll' | 'submit' | 'achieve';

interface FilterOption {
  id: FilterType;
  label: string;
}

interface ActionLogsProps {
  logs: LogEntry[];
}

export default function ActionLogs({ logs }: ActionLogsProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filterOptions: FilterOption[] = [
    { id: 'all', label: 'Все' },
    { id: 'create', label: 'Создание' },
    { id: 'update', label: 'Обновление' },
    { id: 'delete', label: 'Удаление' },
    { id: 'enroll', label: 'Уроки' },
    { id: 'submit', label: 'Оценки' },
    { id: 'achieve', label: 'Достижения' },
  ];

  const getActionType = (action: string = '') => {
    if (action.includes('create'))
      return { id: 'create', label: 'Создание', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: PlusIcon };
    if (action.includes('update'))
      return { id: 'update', label: 'Обновление', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: PencilIcon };
    if (action.includes('delete'))
      return { id: 'delete', label: 'Удаление', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: TrashIcon };
    if (action.includes('enroll'))
      return { id: 'enroll', label: 'Запись на урок', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', icon: AcademicCapIcon };
    if (action.includes('submit'))
      return { id: 'submit', label: 'Сдача задания', color: 'bg-yellow-800 text-white dark:bg-yellow-900 dark:text-yellow-300', icon: CheckCircleIcon };
    if (action.includes('achieve'))
      return { id: 'achieve', label: 'Получение достижения', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300', icon: StarIcon };
    return null;
  };

  const filteredLogs = logs
    .filter((log) => {
      if (!log.action) return false;
      const actionType = getActionType(log.action);
      if (!actionType) return false;
      return filter === 'all' || filter === actionType.id;
    })
    .filter((log) => {
      if (!search) return true;
      const searchTerm = search.toLowerCase();
      return (
        log.user_id.toString().includes(searchTerm) ||
        (log.details?.toLowerCase() || '').includes(searchTerm) ||
        (log.user?.username?.toLowerCase() || '').includes(searchTerm) ||
        (log.user?.full_name?.toLowerCase() || '').includes(searchTerm) ||
        (log.user?.role?.toLowerCase() || '').includes(searchTerm)
      );
    })
    .filter((log) => {
      if (!startDate && !endDate) return true;
      const logDate = new Date(log.created_at);
      if (isNaN(logDate.getTime())) return false;
      if (startDate && !endDate) return logDate >= startDate;
      if (!startDate && endDate) return logDate <= endDate;
      return logDate >= startDate! && logDate <= endDate!;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB.getTime() - dateA.getTime();
    });

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCSV = () => {
    try {
      const csvData = filteredLogs.map((log) => ({
        ID: log.id,
        UserID: log.user_id,
        Username: log.user?.username || (log.user_id === 0 ? 'Система' : 'Неизвестно'),
        FullName: log.user?.full_name || (log.user_id === 0 ? 'Система' : 'Неизвестно'),
        Role: log.user?.role || (log.user_id === 0 ? 'Система' : 'Неизвестно'),
        Action: getActionType(log.action)?.label || 'Неизвестно',
        Details: log.details,
        Date: new Date(log.created_at).toLocaleString('ru-RU'),
      }));
      const csv = unparse(csvData, { header: true });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'action_logs.csv';
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Логи экспортированы в CSV');
    } catch (error) {
      console.error('CSV Export Error:', error);
      toast.error('Ошибка при экспорте CSV');
    }
  };

  return (
    <div className="w-[50rem] mx-auto space-y-4 flex flex-col">
      {/* Фильтры в отдельном контейнере */}
      <Card className="p-4 w-full shadow-sm rounded-xl dark:bg-gray-800 z-10">
        <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((f) => (
              <Button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={clsx(
                  'text-sm px-4 py-2',
                  filter === f.id
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                )}
              >
                {f.label}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Input
              placeholder="Поиск по ID, описанию, нику, ФИО или роли"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-blue-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-300" />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1">
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                popperClassName="custom-datepicker-popper"
                placeholderText="Дата с"
                className="w-full pl-10 pr-4 py-2 border border-blue-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm"
                dateFormat="dd.MM.yyyy"
              />
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-300" />
            </div>
            <div className="relative flex-1">
              <DatePicker
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date)}
                popperClassName="custom-datepicker-popper"
                placeholderText="Дата по"
                className="w-full pl-10 pr-4 py-2 border border-blue-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm"
                dateFormat="dd.MM.yyyy"
              />
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-300" />
            </div>
          </div>
          <Button
            onClick={handleExportCSV}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-4 py-2 rounded-md hover:ring-2 hover:ring-green-300 transition-all duration-200"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Экспорт CSV
          </Button>
        </div>
      </Card>

      {/* Контейнер логов с прокруткой */}
      <div className="flex-1 overflow-y-auto">
        {paginatedLogs.length === 0 ? (
          <Card className="p-6 text-center w-full shadow-sm rounded-xl dark:bg-gray-800">
            <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-300 mb-2" />
            <p className="text-gray-600 dark:text-gray-300">
              Нет логов для "{filterOptions.find((f) => f.id === filter)?.label || filter}". Действия появятся позже!
            </p>
          </Card>
        ) : (
          <ul className="w-full space-y-4">
            {paginatedLogs.map((log, index) => {
              const actionType = getActionType(log.action);
              if (!actionType) return null;
              const { label, color, icon: ActionIcon } = actionType;
              return (
                <li key={log.id}>
                  <Card
                    className={clsx(
                      'p-4 w-full shadow-sm rounded-xl dark:bg-gray-800 hover:shadow-md'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-300 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {log.user?.full_name || (log.user_id === 0 ? 'Система' : `Пользователь ${log.user_id}`)}
                            </span>
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              (@{log.user?.username || (log.user_id === 0 ? 'system' : 'unknown')})
                            </span>
                          </div>
                          <span className={clsx('text-xs px-2 py-1 rounded-full flex items-center gap-1', color)}>
                            <ActionIcon className="h-4 w-4" />
                            {label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          <span className="font-medium">Роль:</span> {log.user?.role || (log.user_id === 0 ? 'Система' : 'Неизвестно')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{log.details}</p>
                        <span className="text-xs text-gray-500 dark:text-gray-300">
                          {new Date(log.created_at).toLocaleString('ru-RU', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <Card className="p-4 w-full shadow-sm rounded-xl dark:bg-gray-800 mt-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 items-center">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 p-2 rounded-md"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Страница {currentPage} из {totalPages} (Всего логов: {filteredLogs.length})
              </span>
              <Button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 p-2 rounded-md"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </Button>
            </div>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="p-2 border border-blue-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300"
            >
              <option value={5}>5 на странице</option>
              <option value={10}>10 на странице</option>
              <option value={50}>50 на странице</option>
            </select>
          </div>
        </Card>
      )}
    </div>
  );
}