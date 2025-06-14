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
import { motion, AnimatePresence } from 'framer-motion';

const assignmentSchema = z.object({
  title: z.string().min(3, 'Название должно быть не короче 3 символов'),
  description: z.string().optional(),
  max_score: z.number().min(1, 'Максимальный балл должен быть больше 0'),
  due_date: z.string().refine((val) => new Date(val) > new Date(), {
    message: 'Срок сдачи должен быть в будущем',
  }),
  file: z.any().optional(),
  type: z.enum(['text', 'multiple_choice']),
});

type FormData = z.infer<typeof assignmentSchema>;

interface Subtask {
  question: string;
  options: string[];
  answer: string;
  numOptions: number;
  inputType?: 'multiple_choice' | 'text_input';
  image?: File | null;
  imagePreview?: string | null;
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
  const [assignmentType, setAssignmentType] = useState<'text' | 'multiple_choice'>('text');
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
    setSubtasks([
      ...subtasks,
      {
        question: '',
        options: ['', ''],
        answer: '',
        numOptions: 2,
        inputType: 'multiple_choice',
        image: null,
        imagePreview: null,
      },
    ]);
  };

  const handleRemoveSubtask = (index: number) => {
    const subtask = subtasks[index];
    if (subtask.imagePreview) {
      URL.revokeObjectURL(subtask.imagePreview);
    }
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubtaskChange = (
    index: number,
    field: keyof Subtask,
    value: string | string[] | number | File | null
  ) => {
    const newSubtasks = [...subtasks];

    if (field === 'numOptions' && typeof value === 'number') {
      newSubtasks[index].numOptions = value;
      newSubtasks[index].options = Array(value).fill('');
      newSubtasks[index].answer = '';
    } else if (field === 'options' && Array.isArray(value)) {
      newSubtasks[index].options = value.map(opt => opt.trimEnd());
    } else if (field === 'image' && value instanceof File) {
      if (value.size > 10 * 1024 * 1024) {
        toast.error(`Файл подзадания ${index + 1} слишком большой (макс. 10 МБ)`);
        return;
      }
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(value.type)) {
        toast.error(`Неподдерживаемый тип файла для подзадания ${index + 1} (jpg, png, pdf)`);
        return;
      }
      if (newSubtasks[index].imagePreview) {
        URL.revokeObjectURL(newSubtasks[index].imagePreview);
      }
      newSubtasks[index].image = value;
      newSubtasks[index].imagePreview = URL.createObjectURL(value);
    } else if (field === 'inputType' && typeof value === 'string') {
      newSubtasks[index].inputType = value as 'multiple_choice' | 'text_input';
      if (value === 'text_input') {
        newSubtasks[index].options = [];
        newSubtasks[index].answer = '';
      } else {
        newSubtasks[index].options = ['', ''];
        newSubtasks[index].answer = '';
        newSubtasks[index].numOptions = 2;
      }
    } else if (typeof value === 'string') {
      switch (field) {
        case 'question':
          newSubtasks[index].question = value.trimEnd();
          break;
        case 'answer':
          if (newSubtasks[index].inputType === 'multiple_choice') {
            const normalizedOptions = newSubtasks[index].options.map(opt => opt.trimEnd());
            if (value && !normalizedOptions.includes(value.trimEnd())) {
              toast.error('Правильный ответ должен быть одним из вариантов');
              return;
            }
          }
          newSubtasks[index].answer = value.trimEnd();
          break;
        default:
          break;
      }
    }

    setSubtasks(newSubtasks);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (preview) {
        URL.revokeObjectURL(preview);
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
        const errorMessage = 'ID урока не указан';
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      const formData = new FormData();
      formData.append('title', data.title.trimEnd());
      if (data.description) formData.append('description', data.description.trimEnd());
      formData.append('max_score', data.max_score.toString());
      formData.append('due_date', `${data.due_date}:00+00:00`);
      formData.append('course_id', courseId);
      formData.append('type', assignmentType);
      if (data.file) formData.append('file', data.file);

      if (assignmentType === 'multiple_choice') {
        if (subtasks.length === 0) {
          setError('Тест должен содержать хотя бы одно подзадание');
          toast.error('Тест должен содержать хотя бы одно подзадание');
          return;
        }
        for (const [index, subtask] of subtasks.entries()) {
          if (!subtask.question) {
            setError(`Вопрос ${index + 1} должен быть заполнен`);
            toast.error(`Вопрос ${index + 1} должен быть заполнен`);
            return;
          }
          if (subtask.inputType === 'multiple_choice') {
            if (subtask.options.filter(opt => opt.trim()).length < 2 || subtask.options.length > 6) {
              setError(`Подзадание ${index + 1} должно иметь от 2 до 6 вариантов ответа`);
              toast.error(`Подзадание ${index + 1} должно иметь от 2 до 6 вариантов ответа`);
              return;
            }
          } else if (subtask.inputType === 'text_input') {
            if (subtask.options.length > 0) {
              setError(`Подзадание ${index + 1} с текстовым вводом не должно содержать варианты ответа`);
              toast.error(`Подзадание ${index + 1} с текстовым вводом не должно содержать варианты ответа`);
              return;
            }
          }
          if (!subtask.answer) {
            setError(`Подзадание ${index + 1} должно иметь правильный ответ`);
            toast.error(`Подзадание ${index + 1} должен иметь правильный ответ`);
            return;
          }
          if (subtask.image) {
            formData.append(`subtask_image_${index}`, subtask.image);
          }
        }

        const normalizedSubtasks = subtasks.map((subtask, index) => ({
          Question: subtask.question.trimEnd(),
          Options: subtask.inputType === 'multiple_choice' ? subtask.options.map(opt => opt.trimEnd()) : [],
          Answer: subtask.answer.trimEnd(),
          SortOrder: index + 1,
          Type: subtask.inputType || 'multiple_choice',
        }));
        formData.append('subtasks_json', JSON.stringify(normalizedSubtasks));
      }

      const response = await api.post('/assignments', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
toast.success('Задание успешно создано!');
window.location.href = `/courses/${courseId}`; // 👈 Вот здесь замена

    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMessage = axiosError.response?.data?.error || 'Ошибка при создании задания';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return (
      <div className="container text-center mt-8 text-red-500">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Доступ запрещён
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mt-8"
    >
		<motion.h1
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.1 }}
  className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
>
  Создать задание
</motion.h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-500 mb-4"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Тип задания
            </label>
            <select
              value={assignmentType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setAssignmentType(e.target.value as 'text' | 'multiple_choice')
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            >
              <option value="text">Обычное задание</option>
              <option value="multiple_choice">Тест с вариантами</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Название
            </label>
            <Input
              {...register('title')}
              className="w-full"
              placeholder="Введите название задания"
            />
            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Описание
            </label>
            <Input
              {...register('description')}
              className="w-full"
              placeholder="Введите описание (опционально)"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Максимальный балл
            </label>
            <Input
              type="number"
              {...register('max_score', { valueAsNumber: true })}
              className="w-full"
              placeholder="Введите максимальный балл"
            />
            {errors.max_score && <p className="text-sm text-red-500 mt-1">{errors.max_score.message}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Срок сдачи
            </label>
            <Input type="datetime-local" {...register('due_date')} className="w-full" />
            {errors.due_date && <p className="text-sm text-red-500 mt-1">{errors.due_date.message}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Файл (jpg, png, pdf)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleFileChange}
              className="w-full text-gray-700 dark:text-gray-200"
            />
            {preview && (
              <div className="mt-2">
                {preview.endsWith('.pdf') ? (
                  <a
                    href={preview}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 transition hover:scale-105 inline-block"
                  >
                    Просмотреть PDF
                  </a>
                ) : (
                  <Image
                    src={preview}
                    alt="Preview"
                    width={200}
                    height={200}
                    className="rounded-lg shadow-md"
                  />
                )}
              </div>
            )}
          </div>

          {assignmentType === 'multiple_choice' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Подзадания</h3>
              <AnimatePresence>
                {subtasks.map((subtask, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg"
                  >
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Вопрос
                      </label>
                      <Input
                        value={subtask.question}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleSubtaskChange(idx, 'question', e.target.value)
                        }
                        placeholder="Введите вопрос"
                      />
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Тип подзадания
                      </label>
                      <select
                        value={subtask.inputType || 'multiple_choice'}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleSubtaskChange(idx, 'inputType', e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                      >
                        <option value="multiple_choice">С выбором ответа</option>
                        <option value="text_input">С вводом ответа</option>
                      </select>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Файл подзадания (jpg, png, pdf)
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleSubtaskChange(idx, 'image', e.target.files?.[0] || null)
                        }
                        className="w-full text-gray-700 dark:text-gray-200"
                      />
                      {subtask.imagePreview && (
                        <div className="mt-2">
                          {subtask.image?.type === 'application/pdf' ? (
                            <a
                              href={subtask.imagePreview}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 transition hover:scale-105 inline-block"
                            >
                              Просмотреть PDF
                            </a>
                          ) : (
                            <Image
                              src={subtask.imagePreview}
                              alt={`Subtask ${idx + 1} Preview`}
                              width={200}
                              height={200}
                              className="rounded-lg shadow-md"
                            />
                          )}
                        </div>
                      )}
                      {subtask.inputType !== 'text_input' && (
                        <>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Количество вариантов ответа (2–6)
                          </label>
                          <select
                            value={subtask.numOptions}
                            onChange={(e) =>
                              handleSubtaskChange(idx, 'numOptions', Number(e.target.value))
                            }
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                          >
                            {[2, 3, 4, 5, 6].map((num) => (
                              <option key={num} value={num}>
                                {num}
                              </option>
                            ))}
                          </select>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Варианты ответа
                          </label>
                          {subtask.options.map((option, optIdx) => (
                            <Input
                              key={optIdx}
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...subtask.options];
                                newOptions[optIdx] = e.target.value;
                                handleSubtaskChange(idx, 'options', newOptions);
                              }}
                              placeholder={`Вариант ${optIdx + 1}`}
                              className="mb-1"
                            />
                          ))}
                        </>
                      )}
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Правильный ответ
                      </label>
                      {subtask.inputType === 'text_input' ? (
                        <Input
                          value={subtask.answer}
                          onChange={(e) =>
                            handleSubtaskChange(idx, 'answer', e.target.value)
                          }
                          placeholder="Введите правильный ответ"
                        />
                      ) : (
                        <select
                          value={subtask.answer}
                          onChange={(e) => handleSubtaskChange(idx, 'answer', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                        >
                          <option value="">Выберите ответ</option>
                          {subtask.options.map((opt, i) =>
                            opt.trim() ? (
                              <option key={i} value={opt}>
                                {opt}
                              </option>
                            ) : null
                          )}
                        </select>
                      )}
                      <Button
                        type="button"
                        onClick={() => handleRemoveSubtask(idx)}
                        variant="destructive"
                        className="mt-2 hover:scale-105 transition transform"
                      >
                        Удалить подзадание
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <Button
                type="button"
                onClick={handleAddSubtask}
                className="mt-2 hover:scale-105 transition transform"
              >
                Добавить подзадание
              </Button>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="hover:scale-105 transition transform"
          >
            {isSubmitting ? 'Создаётся...' : 'Создать'}
          </Button>
        </form>
      </Card>
    </motion.div>
  );
}