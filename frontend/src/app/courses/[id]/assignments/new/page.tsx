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
import toast from 'react-hot-toast';
import Image from 'next/image';

const assignmentSchema = z.object({
  title: z.string().min(3, 'Название должно быть не короче 3 символов'),
  description: z.string().optional(),
  max_score: z.number().min(1, 'Максимальный балл должен быть больше 0'),
  due_date: z.string().refine((val) => new Date(val) > new Date(), {
    message: 'Срок сдачи должен быть в будущем',
  }),
  file: z.any().optional(),
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
  const [preview, setPreview] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      max_score: 100,
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    },
  });

  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return <div className="text-center mt-8 text-red-500">Доступ запрещён</div>;
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Файл слишком большой (макс. 10 МБ)');
        toast.error('Файл слишком большой (макс. 10 МБ)');
        return;
      }
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        setError('Неподдерживаемый тип файла (jpg, png, pdf)');
        toast.error('Неподдерживаемый тип файла (jpg, png, pdf)');
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setValue('file', file);
      setError('');
      toast.success('Файл выбран');
    }
  };

  const onSubmit = async (data: FormData) => {
    setError('');
    setIsSubmitting(true);
    try {
      if (!courseId || typeof courseId !== 'string') {
        const errorMessage = 'ID курса не указан';
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      const formData = new FormData();
      formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      formData.append('max_score', data.max_score.toString());
      formData.append('due_date', `${data.due_date}:00+00:00`);
      formData.append('course_id', courseId);
      if (data.file) {
        formData.append('file', data.file);
      }

      await api.post('/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Задание успешно создано!');
      window.location.href = `/courses/${courseId}`;
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMessage = axiosError.response?.data?.error || 'Ошибка создания задания';
      setError(errorMessage);
      toast.error(errorMessage);
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
            <label htmlFor="description" className="block text-sm font-medium mb-1">Описание (поддерживает Markdown)</label>
            <textarea
              id="description"
              {...register('description')}
              className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-600"
              rows={5}
              placeholder="Опишите задание, используйте Markdown для форматирования"
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
          <div>
            <label htmlFor="file" className="block text-sm font-medium mb-1">Файл (jpg, png, pdf)</label>
            <input
              id="file"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleFileChange}
              className="border p-2 rounded w-full"
            />
            {preview && (
              <div className="mt-2">
                {preview.endsWith('.pdf') ? (
                  <a href={preview} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Просмотреть PDF
                  </a>
                ) : (
                  <Image
                    src={preview}
                    alt="Preview"
                    width={300}
                    height={300}
                    className="rounded"
                  />
                )}
              </div>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Создаётся...' : 'Создать'}
          </Button>
        </form>
      </Card>
    </div>
  );
}