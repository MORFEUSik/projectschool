'use client';

import { useState, useEffect } from 'react';
import { api } from '@/shared/api';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

interface Subtask {
  id: number;
  ID?: number;
  question: string;
  Question?: string;
  options: string[] | undefined;
  Options?: string[];
  sort_order: number;
  SortOrder?: number;
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

  console.log('QuizForm props:', { assignmentId, subtasks });

  // Инициализация состояния
  useEffect(() => {
    const initialAnswers: Record<number, { answer: string; attempts: number; isCorrect?: boolean }> = {};
    const initialIncorrectOptions: Record<number, string[]> = {};
    subtasks.forEach((subtask) => {
      const subtaskId = subtask.id ?? subtask.ID ?? 0;
      const stored = localStorage.getItem(`quiz_${assignmentId}_${subtaskId}`);
      const data = stored ? JSON.parse(stored) : { attempts: 1, incorrectOptions: [] };
      initialAnswers[subtaskId] = { answer: '', attempts: data.attempts || 1 };
      initialIncorrectOptions[subtaskId] = data.incorrectOptions || [];
    });
    setAnswers(initialAnswers);
    setIncorrectOptions(initialIncorrectOptions);
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
          incorrectOptions: [...(incorrectOptions[subtaskId] || []), ...(isCorrect ? [] : [normalizedAnswer])],
        })
      );
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      toast.error(axiosErr.response?.data?.error || 'Ошибка при проверке ответа');
      console.error('Check answer error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = subtasks.map((subtask) => {
      const subtaskId = subtask.id ?? subtask.ID ?? 0;
      const answer = answers[subtaskId]?.answer || '';
      const attempts = answers[subtaskId]?.attempts || 1;
      return {
        SubtaskID: subtaskId,
        Answer: answer,
        Attempts: attempts,
      };
    });

    if (payload.some((ans) => ans.Answer === '')) {
      toast.error('Пожалуйста, ответьте на все вопросы');
      return;
    }

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {subtasks.map((subtask, idx) => {
        const options = Array.isArray(subtask.options) ? subtask.options : Array.isArray(subtask.Options) ? subtask.Options : [];
        const question = subtask.question ?? subtask.Question ?? 'Вопрос отсутствует';
        const subtaskId = subtask.id ?? subtask.ID ?? 0;
        if (!options.length) {
          console.error(`Subtask ${subtaskId} has invalid options:`, subtask);
          return (
            <div key={subtaskId} className="text-red-500">
              Ошибка: некорректные варианты ответа для вопроса `{question}`
            </div>
          );
        }

        const isCorrect = answers[subtaskId]?.isCorrect;
        const incorrectOptionsForSubtask = incorrectOptions[subtaskId] || [];

        return (
          <div key={subtaskId} className="mb-4">
            <p className="font-semibold mb-2">{idx + 1}. {question}</p>
            <div className="space-y-2">
              {options.map((option: string, i: number) => {
                const isOptionIncorrect = incorrectOptionsForSubtask.includes(option);
                return (
                  <label key={i} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`subtask-${subtaskId}`}
                      value={option}
                      checked={answers[subtaskId]?.answer === option}
                      onChange={() => handleChange(subtaskId, option)}
                      disabled={isCorrect === true} // Блокируем выбор после правильного ответа
                      className={`accent-blue-600 ${isOptionIncorrect ? 'border-red-500 bg-red-100' : ''}`}
                    />
                    <span className={isOptionIncorrect ? 'text-red-600' : ''}>{option}</span>
                  </label>
                );
              })}
              <p className="text-sm text-gray-500 mt-1">Попытки: {answers[subtaskId]?.attempts || 1}</p>
            </div>
          </div>
        );
      })}
      <button
        type="submit"
        disabled={isSubmitting || !subtasks.every((subtask) => answers[subtask.id ?? subtask.ID ?? 0]?.answer)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
      >
        {isSubmitting ? 'Отправка...' : 'Завершить тест'}
      </button>
    </form>
  );
}
