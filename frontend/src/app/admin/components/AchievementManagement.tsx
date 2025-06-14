'use client';

import { useState, FormEvent } from 'react';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { TrophyIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface Achievement {
  id: number;
  title: string;
  description: string;
  condition_type: string;
  threshold: number;
  condition?: string; // Для отображения
}

interface ErrorResponse {
  error?: string;
}

interface AchievementManagementProps {
  achievements: Achievement[];
  onSuccess: () => void;
  setFormError: (error: string) => void;
  openDeleteModal: (achievement: Achievement) => void;
}

export default function AchievementManagement({ achievements, onSuccess, setFormError, openDeleteModal }: AchievementManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [editAchievement, setEditAchievement] = useState<Achievement | null>(null);
  const [achTitle, setAchTitle] = useState('');
  const [achDesc, setAchDesc] = useState('');
  const [achConditionType, setAchConditionType] = useState<'points' | 'courses' | 'submissions' | ''>('');
  const [achThreshold, setAchThreshold] = useState('');
  const [localFormError, setLocalFormError] = useState('');

  // Формируем condition для отображения
  const getDisplayCondition = (achievement: Achievement) => {
    if (achievement.condition) return achievement.condition;
    switch (achievement.condition_type) {
      case 'points':
        return `Набрать ${achievement.threshold} баллов`;
      case 'courses':
        return `Завершить ${achievement.threshold} курсов`;
      case 'submissions':
        return `Сдать ${achievement.threshold} заданий с оценкой 8+`;
      default:
        return 'Условие не указано';
    }
  };

  const handleCreateOrUpdateAchievement = async (e: FormEvent) => {
    e.preventDefault();
    if (!achTitle || !achDesc || !achConditionType || !achThreshold || isNaN(parseInt(achThreshold)) || parseInt(achThreshold) <= 0) {
      const errorMsg = 'Заполните все поля корректно';
      setLocalFormError(errorMsg);
      setFormError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      const payload = {
        title: achTitle,
        description: achDesc,
        condition_type: achConditionType,
        threshold: parseInt(achThreshold),
      };
      if (editAchievement) {
        await api.put(`/achievements/${editAchievement.id}`, payload);
        toast.success('Достижение обновлено');
      } else {
        await api.post('/achievements', payload);
        toast.success('Достижение создано');
      }
      onSuccess();
      resetForm();
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Ошибка при сохранении достижения';
      setLocalFormError(errorMsg);
      setFormError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleEdit = (achievement: Achievement) => {
    setEditAchievement(achievement);
    setAchTitle(achievement.title);
    setAchDesc(achievement.description);
    setAchConditionType(achievement.condition_type as 'points' | 'courses' | 'submissions');
    setAchThreshold(achievement.threshold.toString());
    setShowForm(true);
  };

  const handleDelete = (achievement: Achievement) => {
    openDeleteModal(achievement);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditAchievement(null);
    setAchTitle('');
    setAchDesc('');
    setAchConditionType('');
    setAchThreshold('');
    setLocalFormError('');
  };

  return (
    <div className="w-[50rem] mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <TrophyIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          Достижения
        </h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          className={clsx(
            'bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
            showForm ? 'bg-red-600 hover:bg-red-700' : 'hover:scale-105'
          )}
        >
          {showForm ? (
            <>
              <XMarkIcon className="h-5 w-5" />
              Отменить
            </>
          ) : (
            <>
              <SparklesIcon className="h-5 w-5" />
              Добавить достижение
            </>
          )}
        </Button>
      </div>

      {localFormError && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 p-3 rounded-lg"
        >
          {localFormError}
        </motion.p>
      )}

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6 w-full rounded-xl dark:bg-gray-800 shadow-lg border border-blue-200 dark:border-blue-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              {editAchievement ? 'Редактировать достижение' : 'Создать новое достижение'}
            </h3>
            <form onSubmit={handleCreateOrUpdateAchievement} className="grid gap-4">
              <div className="relative">
                <Input
                  placeholder="Название достижения (например, Мастер знаний)"
                  value={achTitle}
                  onChange={(e) => setAchTitle(e.target.value)}
                  className="border-blue-600 dark:bg-gray-800 dark:text-gray-300 pl-10"
                  required
                />
                <TrophyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-300" />
              </div>
              <div className="relative">
                <Input
                  placeholder="Описание (например, Завершите 10 курсов)"
                  value={achDesc}
                  onChange={(e) => setAchDesc(e.target.value)}
                  className="border-blue-600 dark:bg-gray-800 dark:text-gray-300 pl-10"
                  required
                />
                <SparklesIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-300" />
              </div>
              <div className="relative">
                <select
                  value={achConditionType}
                  onChange={(e) => setAchConditionType(e.target.value as 'points' | 'courses' | 'submissions')}
                  className="w-full pl-10 pr-4 py-2 border border-blue-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                >
                  <option value="" disabled>Выберите тип условия</option>
                  <option value="points">Баллы</option>
                  <option value="courses">Курсы</option>
                  <option value="submissions">Задания</option>
                </select>
                <SparklesIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-300" />
              </div>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Порог (например, 100)"
                  value={achThreshold}
                  onChange={(e) => setAchThreshold(e.target.value)}
                  className="border-blue-600 dark:bg-gray-800 dark:text-gray-300 pl-10"
                  min="1"
                  required
                />
                <SparklesIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-300" />
              </div>
              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white flex-1 py-2 rounded-lg hover:scale-105 transition-transform duration-200"
                >
                  {editAchievement ? 'Обновить' : 'Создать'}
                </Button>
                <Button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex-1 py-2 rounded-lg hover:scale-105 transition-transform duration-200"
                >
                  Очистить
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {achievements.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="p-8 text-center w-full rounded-xl dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
            <TrophyIcon className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4 animate-pulse" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Нет достижений. Создайте первое, чтобы вдохновить пользователей!
            </p>
          </Card>
        </motion.div>
      ) : (
        <ul className="w-full space-y-4">
          {achievements.map((ach, index) => (
            <motion.li
              key={ach.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card
                className={clsx(
                  'p-6 w-full rounded-xl dark:bg-gray-800 hover:shadow-xl transition-shadow duration-200 border border-gray-200 dark:border-gray-700'
                )}
              >
                <div className="flex items-start gap-4">
                  <TrophyIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        {ach.title}
                      </h3>
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-sm px-3 py-1 rounded-full">
                        {getDisplayCondition(ach)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{ach.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      ID: {ach.id} | Тип: {ach.condition_type || 'Не указан'} | Порог: {ach.threshold || 'Не указан'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(ach)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg hover:scale-105 transition-transform duration-200"
                    >
                      Редактировать
                    </Button>
                    <Button
                      onClick={() => handleDelete(ach)}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg hover:scale-105 transition-transform duration-200"
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}