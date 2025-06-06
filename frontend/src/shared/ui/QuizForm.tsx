'use client';

import { useState, useEffect } from 'react';
import { api } from '@/shared/api';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import Image from 'next/image';

interface Subtask {
  id: number;
  ID?: number;
  question: string;
  Question?: string;
  options?: string[];
  Options?: string[];
  sort_order: number;
  SortOrder?: number;
  input_type?: string;
  InputType?: string;
  file_url?: string;
  File_url?: string;
}

interface QuizResult {
  grade: number;
  totalScore: number;
  answers: {
    SubtaskID: number;
    Answer: string;
    IsCorrect: boolean;
    Attempts: number;
    CorrectAnswer?: string;
    Score: number;
  }[];
}

interface QuizFormProps {
  assignmentId: number;
  subtasks: Subtask[];
  onSubmit: (result: QuizResult) => void;
}

export function QuizForm({ assignmentId, subtasks, onSubmit }: QuizFormProps) {
  const [answers, setAnswers] = useState<Record<number, { answer: string; attempts: number; isCorrect?: boolean }>>({});
  const [incorrectOptions, setIncorrectOptions] = useState<Record<number, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, string>>({});
  const [currentSubtaskIndex, setCurrentSubtaskIndex] = useState(0);

  console.log('QuizForm props:', { assignmentId, subtasks });
  console.log('Normalized subtasks in QuizForm:', subtasks); // Добавлено для отладки

  // Инициализация состояния
  useEffect(() => {
    // Временная очистка localStorage
    subtasks.forEach((subtask) => {
      const subtaskId = subtask.id ?? subtask.ID ?? 0;
      localStorage.removeItem(`quiz_${assignmentId}_${subtaskId}`);
    });

    const initialAnswers: Record<number, { answer: string; attempts: number; isCorrect?: boolean }> = {};
    const initialIncorrectOptions: Record<number, string[]> = {};
    subtasks.forEach((subtask) => {
      const subtaskId = subtask.id ?? subtask.ID ?? 0;
      const stored = localStorage.getItem(`quiz_${assignmentId}_${subtaskId}`);
      const data = stored ? JSON.parse(stored) : { attempts: 0, incorrectOptions: [] };
      initialAnswers[subtaskId] = { answer: '', attempts: data.attempts || 0, isCorrect: undefined };
      initialIncorrectOptions[subtaskId] = data.incorrectOptions || [];
    });
    setAnswers(initialAnswers);
    setIncorrectOptions(initialIncorrectOptions);

    return () => {
      subtasks.forEach((subtask) => {
        const subtaskId = subtask.id ?? subtask.ID ?? 0;
        localStorage.removeItem(`quiz_${assignmentId}_${subtaskId}`);
      });
    };
  }, [assignmentId, subtasks]);

  if (!Array.isArray(subtasks) || subtasks.length === 0) {
    console.warn('QuizForm: subtasks is empty or not an array');
    return <div>Нет вопросов для квиза</div>;
  }

  const handleChange = async (subtaskId: number, answer: string) => {
    const normalizedAnswer = answer.trim();

    try {
      const response = await api.post(`/assignments/${assignmentId}/check-subtask`, {
        subtask_id: subtaskId,
        answer: normalizedAnswer,
      });
      const { isCorrect, attempts } = response.data;

      setAnswers((prev) => ({
        ...prev,
        [subtaskId]: {
          answer: normalizedAnswer,
          attempts,
          isCorrect,
        },
      }));

      if (!isCorrect) {
        setIncorrectOptions((prev) => ({
          ...prev,
          [subtaskId]: [...(prev[subtaskId] || []), normalizedAnswer],
        }));
        toast.error('Неправильный ответ, попробуйте снова!');
      } else {
        toast.success('Правильный ответ!');
      }

      // Сохраняем в localStorage
      localStorage.setItem(
        `quiz_${assignmentId}_${subtaskId}`,
        JSON.stringify({
          attempts,
          answer: normalizedAnswer,
          isCorrect,
          incorrectOptions: [...(incorrectOptions[subtaskId] || []), ...(isCorrect ? [] : [normalizedAnswer])],
        })
      );
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      toast.error(axiosErr.response?.data?.error || 'Ошибка при проверке ответа');
      console.error('Check answer error:', err);
    }
  };

  const handleNext = () => {
    const subtaskId = subtasks[currentSubtaskIndex].id ?? subtasks[currentSubtaskIndex].ID ?? 0;
    if (!answers[subtaskId]?.answer) {
      toast.error('Пожалуйста, выберите ответ перед переходом к следующему вопросу');
      return;
    }
    if (currentSubtaskIndex < subtasks.length - 1) {
      setCurrentSubtaskIndex(currentSubtaskIndex + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subtaskId = subtasks[currentSubtaskIndex].id ?? subtasks[currentSubtaskIndex].ID ?? 0;
    if (!answers[subtaskId]?.answer) {
      toast.error('Пожалуйста, выберите ответ');
      return;
    }

    const payload = subtasks.map((subtask) => {
      const subtaskId = subtask.id ?? subtask.ID ?? 0;
      const answer = answers[subtaskId]?.answer || '';
      const attempts = answers[subtaskId]?.attempts || 0;
      return {
        SubtaskID: subtaskId,
        Answer: answer,
        Attempts: attempts,
      };
    });

    console.log('Submitting quiz payload:', { answers: payload });

    setIsSubmitting(true);
    try {
      const response = await api.post(`/assignments/${assignmentId}/submit-quiz`, { answers: payload });
      console.log('Quiz response:', response.data);
      toast.success('Ответы отправлены!');
      onSubmit(response.data);
      // Очищаем localStorage
      subtasks.forEach((subtask) => {
        const subtaskId = subtask.id ?? subtask.ID ?? 0;
        localStorage.removeItem(`quiz_${assignmentId}_${subtaskId}`);
      });
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      toast.error(axiosErr.response?.data?.error || 'Ошибка при отправке');
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSubtask = subtasks[currentSubtaskIndex];
  const subtaskId = currentSubtask.id ?? currentSubtask.ID ?? 0;
  const inputType = currentSubtask.input_type ?? currentSubtask.InputType ?? 'multiple_choice';
  const options = Array.isArray(currentSubtask.options)
    ? currentSubtask.options
    : Array.isArray(currentSubtask.Options)
    ? currentSubtask.Options
    : [];
  const question = currentSubtask.question ?? currentSubtask.Question ?? 'Вопрос отсутствует';
  const fileUrl = currentSubtask.file_url ?? currentSubtask.File_url;

  if (!currentSubtask || !subtaskId) {
    console.error('Invalid subtask data:', currentSubtask);
    return (
      <div className="text-red-500">
        Ошибка: некорректные данные вопроса. Обратитесь к преподавателю.
      </div>
    );
  }

  if (inputType === 'multiple_choice' && !options.length) {
    console.error(`Subtask ${subtaskId} has invalid options:`, currentSubtask);
    return (
      <div className="text-red-500">
        Ошибка: отсутствуют варианты ответа для вопроса (ID: {subtaskId}). Обратитесь к преподавателю.
      </div>
    );
  }

  const isCorrect = answers[subtaskId]?.isCorrect;
  const incorrectOptionsForSubtask = incorrectOptions[subtaskId] || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-4">
        <p className="font-semibold mb-2">
          {currentSubtaskIndex + 1}. {question} ({currentSubtaskIndex + 1}/{subtasks.length})
        </p>
        {fileUrl && !imageErrors[subtaskId] && (
          <div className="mt-2 mb-4">
            {fileUrl.endsWith('.pdf') ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Просмотреть PDF
              </a>
            ) : (
              <>
                <Image
                  src={fileUrl}
                  alt={`Subtask ${currentSubtaskIndex + 1} image`}
                  width={300}
                  height={300}
                  className="rounded"
                  onError={() =>
                    setImageErrors((prev) => ({
                      ...prev,
                      [subtaskId]: `Ошибка загрузки изображения для вопроса ${currentSubtaskIndex + 1}`,
                    }))
                  }
                />
                {imageErrors[subtaskId] && <p className="text-red-500 text-sm">{imageErrors[subtaskId]}</p>}
              </>
            )}
          </div>
        )}
        <div className="space-y-2">
          {inputType === 'multiple_choice' ? (
            options.map((option: string, i: number) => {
              const isOptionIncorrect = incorrectOptionsForSubtask.includes(option);
              return (
                <label key={i} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`subtask-${subtaskId}`}
                    value={option}
                    checked={answers[subtaskId]?.answer === option}
                    onChange={() => handleChange(subtaskId, option)}
                    disabled={isCorrect === true}
                    className={`accent-blue-600 ${isOptionIncorrect ? 'border-red-500 bg-red-100' : ''}`}
                  />
                  <span className={isOptionIncorrect ? 'text-red-600' : ''}>{option}</span>
                </label>
              );
            })
          ) : (
            <input
              type="text"
              value={answers[subtaskId]?.answer || ''}
              onChange={(e) => handleChange(subtaskId, e.target.value)}
              disabled={isCorrect === true}
              className="w-full border rounded px-3 py-2"
              placeholder="Введите ответ"
            />
          )}
          <p className="text-sm text-gray-500 mt-1">Попытки: {answers[subtaskId]?.attempts || 0}</p>
        </div>
      </div>
      <div className="flex space-x-4">
        {currentSubtaskIndex < subtasks.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
          >
            Далее
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
          >
            {isSubmitting ? 'Отправка...' : 'Завершить тест'}
          </button>
        )}
      </div>
    </form>
  );
}