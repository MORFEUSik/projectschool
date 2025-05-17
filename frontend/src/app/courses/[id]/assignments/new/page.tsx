// frontend/src/app/courses/[id]/assignments/new/page.tsx
'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUser } from '@/entities/user/hook';
import { api } from '@/shared/api';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { AxiosError } from 'axios';

const assignmentSchema = z.object({
  title: z.string().min(3, 'Название должно быть не короче 3 символов'),
  description: z.string().optional(),
  max_score: z.number().min(1, 'Максимальный балл должен быть больше 0'),
  due_date: z.string().refine((val) => new Date(val) > new Date(), {
    message: 'Срок сдачи должен быть в будущем',
  }),
});

type FormData = z.infer<typeof assignmentSchema>;

interface ErrorResponse {
  error?: string;
}

export default function CreateAssignmentPage() {
  const { id: courseId } = useParams();
  const { user } = useUser();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      max_score: 100,
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // Завтра
    },
  });

  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
	return <div className="text-center mt-8 text-red-500">Доступ запрещён</div>;
 }

 const onSubmit = async (data: FormData) => {
	setError('');
	setIsSubmitting(true);
	try {
	  const formattedDueDate = `${data.due_date}:00+00:00`; // Добавляем секунды и UTC таймзону
	  await api.post('/assignments', {
		 ...data,
		 due_date: formattedDueDate,
		 course_id: Number(courseId),
	  });
	  window.location.href = `/courses/${courseId}`;
	} catch (err: unknown) {
	  const axiosError = err as AxiosError<ErrorResponse>;
	  setError(axiosError.response?.data?.error || 'Ошибка создания задания');
	} finally {
	  setIsSubmitting(false);
	}
 };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Создать задание</h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">Название</label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Название задания"
            />
            {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">Описание</label>
            <textarea
              id="description"
              {...register('description')}
              className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
              rows={5}
              placeholder="Опишите задание"
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
          </div>
          <div>
            <label htmlFor="max_score" className="block text-sm font-medium mb-1">Максимальный балл</label>
            <Input
              id="max_score"
              type="number"
              {...register('max_score', { valueAsNumber: true })}
              placeholder="100"
            />
            {errors.max_score && <p className="text-red-500 text-sm">{errors.max_score.message}</p>}
          </div>
          <div>
            <label htmlFor="due_date" className="block text-sm font-medium mb-1">Срок сдачи</label>
            <Input
              id="due_date"
              type="datetime-local"
              {...register('due_date')}
            />
            {errors.due_date && <p className="text-red-500 text-sm">{errors.due_date.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Создаётся...' : 'Создать'}
          </Button>
        </form>
      </Card>
    </div>
  );
}