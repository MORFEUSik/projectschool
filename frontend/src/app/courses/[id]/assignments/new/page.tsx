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
  type: z.string().optional(),
});

type FormData = z.infer<typeof assignmentSchema>;

interface Subtask {
  question: string;
  options: string[];
  answer: string;
}

interface ErrorResponse {
  error?: string;
}

export default function CreateAssignmentPage() {
  const { id: courseId } = useParams();
  const { user } = useUser();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [assignmentType, setAssignmentType] = useState('text');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      max_score: 100,
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      type: 'text',
    },
  });

  const handleAddSubtask = () => {
    setSubtasks([...subtasks, { question: '', options: ['', '', '', ''], answer: '' }]);
  };

  const handleSubtaskChange = (
  index: number,
  field: keyof Subtask,
  value: string | string[]
) => {

    const newSubtasks = [...subtasks];
if (field === 'options' && Array.isArray(value)) {
  newSubtasks[index].options = value;
} else if (field !== 'options' && typeof value === 'string') {
  newSubtasks[index][field] = value;
}
setSubtasks(newSubtasks);

  };

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
      formData.append('type', assignmentType);
      if (data.file) formData.append('file', data.file);
      if (assignmentType === 'multiple_choice') {
        formData.append('subtasks_json', JSON.stringify(subtasks));
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

  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return <div className="text-center mt-8 text-red-500">Доступ запрещён</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Создать задание</h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div>
            <label htmlFor="type" className="block text-sm font-medium mb-1">Тип задания</label>
            <select id="type" value={assignmentType} onChange={(e) => setAssignmentType(e.target.value)} className="border p-2 rounded w-full">
              <option value="text">Обычное задание</option>
              <option value="multiple_choice">Тест с вариантами</option>
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">Название</label>
            <Input id="title" {...register('title')} placeholder="Название задания" />
            {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">Описание</label>
            <textarea id="description" {...register('description')} className="border p-2 rounded w-full" rows={4} />
          </div>

          <div>
            <label htmlFor="max_score" className="block text-sm font-medium mb-1">Максимальный балл</label>
            <Input id="max_score" type="number" {...register('max_score', { valueAsNumber: true })} />
          </div>

          <div>
            <label htmlFor="due_date" className="block text-sm font-medium mb-1">Срок сдачи</label>
            <Input id="due_date" type="datetime-local" {...register('due_date')} />
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium mb-1">Файл (jpg, png, pdf)</label>
            <input id="file" type="file" accept="image/jpeg,image/png,application/pdf" onChange={handleFileChange} className="border p-2 rounded w-full" />
            {preview && (
              <div className="mt-2">
                {preview.endsWith('.pdf') ? (
                  <a href={preview} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Просмотреть PDF
                  </a>
                ) : (
                  <Image src={preview} alt="Preview" width={300} height={300} className="rounded" />
                )}
              </div>
            )}
          </div>

          {assignmentType === 'multiple_choice' && (
            <div>
              <h2 className="text-xl font-semibold mt-6 mb-4">Подзадания</h2>
              {subtasks.map((subtask, idx) => (
                <div key={idx} className="mb-4 border p-4 rounded">
                  <label className="block text-sm font-medium mb-1">Вопрос</label>
                  <Input
                    value={subtask.question}
                    onChange={(e) => handleSubtaskChange(idx, 'question', e.target.value)}
                    className="mb-2"
                  />
                  <label className="block text-sm font-medium mb-1">Варианты ответа</label>
                  {subtask.options.map((option, optIdx) => (
                    <Input
                      key={optIdx}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...subtask.options];
                        newOptions[optIdx] = e.target.value;
                        handleSubtaskChange(idx, 'options', [...newOptions]);
                      }}
                      className="mb-1"
                    />
                  ))}
                  <label className="block text-sm font-medium mb-1">Правильный ответ</label>
                  <Input
                    value={subtask.answer}
                    onChange={(e) => handleSubtaskChange(idx, 'answer', e.target.value)}
                  />
                </div>
              ))}
              <Button type="button" onClick={handleAddSubtask}>Добавить подзадание</Button>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Создаётся...' : 'Создать'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
