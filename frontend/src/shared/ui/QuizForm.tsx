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
  answers: { SubtaskID: number; Answer: string; IsCorrect: boolean }[];
}

interface QuizFormProps {
  assignmentId: number;
  subtasks: Subtask[];
  onSubmit: (result: QuizResult) => void;
}

export function QuizForm({ assignmentId, subtasks, onSubmit }: QuizFormProps) {
  const [answers, setAnswers] = useState<Record<number, { answer: string; attempts: number }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('QuizForm props:', { assignmentId, subtasks });

  // Инициализация попыток из localStorage
  useEffect(() => {
    const initialAnswers: Record<number, { answer: string; attempts: number }> = {};
    subtasks.forEach((subtask) => {
      const subtaskId = subtask.id ?? subtask.ID ?? 0;
      const stored = localStorage.getItem(`quiz_${assignmentId}_${subtaskId}`);
      const attempts = stored ? JSON.parse(stored).attempts || 1 : 1;
      initialAnswers[subtaskId] = { answer: '', attempts };
    });
    setAnswers(initialAnswers);
  }, [assignmentId, subtasks]);

  if (!Array.isArray(subtasks) || subtasks.length === 0) {
    console.warn('QuizForm: subtasks is empty or not an array');
    return <div>Нет вопросов для квиза</div>;
  }

  const handleChange = (subtaskId: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [subtaskId]: {
        answer,
        attempts: prev[subtaskId].attempts,
      },
    }));
    // Увеличиваем попытки при новом ответе
    localStorage.setItem(
      `quiz_${assignmentId}_${subtaskId}`,
      JSON.stringify({ attempts: (answers[subtaskId]?.attempts || 1) + 1 })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = subtasks.map((subtask) => {
      const subtaskId = subtask.id ?? subtask.ID ?? 0;
      return {
        SubtaskID: subtaskId,
        Answer: answers[subtaskId]?.answer || '',
        Attempts: answers[subtaskId]?.attempts || 1,
      };
    });

    if (payload.some((ans) => ans.Answer === '')) {
      toast.error('Пожалуйста, ответьте на все вопросы');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post(`/assignments/${assignmentId}/submit-quiz`, { answers: payload });
      toast.success('Ответы отправлены!');
      onSubmit(response.data);
      // Очищаем localStorage после успешной отправки
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
        const options = Array.isArray(subtask.options)
          ? subtask.options
          : Array.isArray(subtask.Options)
          ? subtask.Options
          : [];
        const question = subtask.question ?? subtask.Question ?? 'Вопрос отсутствует';
        const subtaskId = subtask.id ?? subtask.ID ?? 0;

        if (!options.length) {
  console.error(`Subtask ${subtaskId} has invalid options:`, subtask);
  return (
    <div key={subtaskId} className="text-red-500">
      Ошибка: некорректные варианты ответа для вопроса &apos;{question}&apos;
    </div>
  );
}

        return (
          <div key={subtaskId}>
            <p className="font-medium mb-2">{idx + 1}. {question}</p>
            <div className="space-y-1">
              {options.map((option, i) => (
                <label key={i} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`subtask-${subtaskId}`}
                    value={option}
                    checked={answers[subtaskId]?.answer === option}
                    onChange={() => handleChange(subtaskId, option)}
                    className="accent-blue-600"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
      >
        {isSubmitting ? 'Отправка...' : 'Отправить тест'}
      </button>
    </form>
  );
}