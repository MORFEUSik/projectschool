// frontend/src/app/admin/components/AchievementManagement.tsx
'use client';
import { useState, FormEvent } from 'react';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { api } from '@/shared/api';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

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

export function AchievementManagement({
  achievements,
  onSuccess,
  setFormError,
}: AchievementManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [editAchievement, setEditAchievement] = useState<Achievement | null>(null);
  const [achTitle, setAchTitle] = useState('');
  const [achDesc, setAchDesc] = useState('');
  const [achCondition, setAchCondition] = useState('');

  const conditionOptions = [
    { value: 'points_50', label: 'Набрать 50 очков' },
    { value: 'points_100', label: 'Набрать 100 очков' },
    { value: 'points_500', label: 'Набрать 500 очков' },
    { value: 'courses_1', label: 'Завершить 1 курс' },
    { value: 'courses_3', label: 'Записаться на 3 курса' },
    { value: 'submissions_5', label: 'Сдать 5 заданий' },
    { value: 'custom', label: 'Произвольное' },
  ];

  const handleCreateOrUpdateAchievement = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: achTitle,
        description: achDesc,
        condition: achCondition || 'custom',
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
  };

  return (
    <Card className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Управление достижениями</h2>
      <Button onClick={() => setShowForm(!showForm)} className="mb-4">
        {showForm ? 'Отменить' : 'Добавить достижение'}
      </Button>
      {showForm && (
        <form onSubmit={handleCreateOrUpdateAchievement} className="grid gap-4 mb-6">
          <Input
            placeholder="Название"
            value={achTitle}
            onChange={(e) => setAchTitle(e.target.value)}
            required
          />
          <Input
            placeholder="Описание"
            value={achDesc}
            onChange={(e) => setAchDesc(e.target.value)}
            required
          />
          <select
            value={achCondition}
            onChange={(e) => setAchCondition(e.target.value)}
            className="p-2 border rounded-md text-sm"
            required
          >
            <option value="">Выберите условие</option>
            {conditionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Button type="submit">{editAchievement ? 'Обновить' : 'Добавить'}</Button>
        </form>
      )}
      <div>
        <h3 className="font-semibold mb-2">Существующие достижения:</h3>
        {achievements.length === 0 ? (
          <p className="text-sm text-gray-500">Нет достижений</p>
        ) : (
          <ul className="text-sm space-y-2">
            {achievements.map((ach) => (
              <li key={ach.id} className="flex justify-between items-center">
                <span>
                  {ach.title} — {ach.description} ({ach.condition})
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(ach)}
                    className="bg-blue-600 text-white text-xs px-2 py-1"
                  >
                    Редактировать
                  </Button>
                  <Button
                    onClick={() => handleDelete(ach.id)}
                    className="bg-red-600 text-white text-xs px-2 py-1"
                  >
                    Удалить
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}