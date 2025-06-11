'use client';

import { useState, FormEvent } from 'react';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { TrophyIcon } from '@heroicons/react/24/outline';

interface Achievement {
  id: number;
  title: string;
  description: string;
  condition: string;
}

interface ErrorResponse {
  error?: string;
}

interface AchievementManagementProps {
  achievements: Achievement[];
  onSuccess: () => void;
  setFormError: (error: string) => void;
}

export default function AchievementManagement({ achievements, onSuccess, setFormError }: AchievementManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [editAchievement, setEditAchievement] = useState<Achievement | null>(null);
  const [achTitle, setAchTitle] = useState('');
  const [achDesc, setAchDesc] = useState('');
  const [achCondition, setAchCondition] = useState('');
  const [localFormError, setLocalFormError] = useState('');

  const handleCreateOrUpdateAchievement = async (e: FormEvent) => {
    e.preventDefault();
    if (!achTitle || !achDesc || !achCondition) {
      const errorMsg = 'Заполните все поля';
      setLocalFormError(errorMsg);
      setFormError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      const payload = {
        title: achTitle,
        description: achDesc,
        condition: achCondition,
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
    setAchCondition(achievement.condition);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить достижение?')) return;
    try {
      await api.delete(`/achievements/${id}`);
      toast.success('Достижение удалено');
      onSuccess();
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMsg = axiosError.response?.data?.error || 'Ошибка при удалении достижения';
      setLocalFormError(errorMsg);
      setFormError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditAchievement(null);
    setAchTitle('');
    setAchDesc('');
    setAchCondition('');
    setLocalFormError('');
  };

  return (
    <div>
      <Button
        onClick={() => setShowForm(!showForm)}
        className="mb-6 bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 transition-transform duration-200 flex items-center gap-2"
      >
        <TrophyIcon className="h-5 w-5" />
        {showForm ? 'Отменить' : 'Добавить достижение'}
      </Button>
      {localFormError && <p className="text-red-500 mb-4">{localFormError}</p>}
      {showForm && (
        <Card className="p-6 mb-4 card-shadow dark:bg-gray-800 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <form onSubmit={handleCreateOrUpdateAchievement} className="grid gap-4">
            <Input
              placeholder="Название достижения"
              value={achTitle}
              onChange={(e) => setAchTitle(e.target.value)}
              className="border-blue-600 dark:bg-gray-800 dark:text-gray-300"
              required
            />
            <Input
              placeholder="Описание"
              value={achDesc}
              onChange={(e) => setAchDesc(e.target.value)}
              className="border-blue-600 dark:bg-gray-800 dark:text-gray-300"
              required
            />
            <Input
              placeholder="Условие (например, 'Набрать 100 баллов')"
              value={achCondition}
              onChange={(e) => setAchCondition(e.target.value)}
              className="border-blue-600 dark:bg-gray-800 dark:text-gray-300"
              required
            />
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white hover:scale-105 transition-transform duration-200"
            >
              {editAchievement ? 'Обновить' : 'Добавить'}
            </Button>
          </form>
        </Card>
      )}
      {achievements.length === 0 ? (
        <Card className="p-6 text-center card-shadow dark:bg-gray-800 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <TrophyIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
          <p className="text-gray-600 dark:text-gray-400">Нет достижений. Создайте первое!</p>
        </Card>
      ) : (
        <ul className="space-y-4">
          {achievements.map((ach, index) => (
            <li
              key={ach.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${400 + index * 100}ms` }}
            >
              <Card
                className={clsx(
                  'p-4 card-shadow card-hover-gradient dark:bg-gray-800 transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg'
                )}
              >
                <div className="flex items-start gap-3">
                  <TrophyIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {ach.title}
                      </h3>
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                        {ach.condition}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{ach.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(ach)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 hover:scale-105"
                    >
                      Редактировать
                    </Button>
                    <Button
                      onClick={() => handleDelete(ach.id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 hover:scale-105"
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}