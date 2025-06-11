'use client';

import { useState, useEffect } from 'react';
import { api } from '@/shared/api';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/shared/ui/Button';

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
  const [tempAnswer, setTempAnswer] = useState<Record<number, string>>({});
  const [skipped, setSkipped] = useState<Record<number, boolean>>({});

  useEffect(() => {
    subtasks.forEach((subtask) => {
      const subtaskId = subtask.id ?? subtask.ID ?? 0;
      localStorage.removeItem(`quiz_${assignmentId}_${subtaskId}`);
    });

    const initialAnswers: Record<number, { answer: string; attempts: number; isCorrect?: boolean }> = {};
    const initialIncorrectOptions: Record<number, string[]> = {};
    const initialTempAnswers: Record<number, string> = {};
    subtasks.forEach((subtask) => {
      const subtaskId = subtask.id ?? subtask.ID ?? 0;
      const stored = localStorage.getItem(`quiz_${assignmentId}_${subtaskId}`);
      const data = stored ? JSON.parse(stored) : { attempts: 0, incorrectOptions: [] };
      initialAnswers[subtaskId] = { answer: '', attempts: data.attempts || 0, isCorrect: undefined };
      initialIncorrectOptions[subtaskId] = data.incorrectOptions || [];
      initialTempAnswers[subtaskId] = '';
    });
    setAnswers(initialAnswers);
    setIncorrectOptions(initialIncorrectOptions);
    setTempAnswer(initialTempAnswers);

    return () => {
      subtasks.forEach((subtask) => {
        const subtaskId = subtask.id ?? subtask.ID ?? 0;
        localStorage.removeItem(`quiz_${assignmentId}_${subtaskId}`);
      });
    };
  }, [assignmentId, subtasks]);

  if (!Array.isArray(subtasks) || subtasks.length === 0) {
    return <div className="text-center text-gray-700 dark:text-gray-200">Нет вопросов для квиза</div>;
  }

  const handleChange = async (subtaskId: number, answer: string) => {
    const normalizedAnswer = answer.trimEnd();

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
    }
  };

  const handleConfirmTextAnswer = async (subtaskId: number) => {
    const normalizedAnswer = tempAnswer[subtaskId]?.trimEnd() || '';
    if (!normalizedAnswer) {
      toast.error('Введите ответ перед подтверждением');
      return;
    }

    if (answers[subtaskId].attempts >= 3) {
      toast.error('Достигнуто максимальное количество попыток (3)');
      return;
    }

    await handleChange(subtaskId, normalizedAnswer);
  };

  const handleSkip = (subtaskId: number) => {
    setSkipped((prev) => ({ ...prev, [subtaskId]: true }));
    setAnswers((prev) => ({
      ...prev,
      [subtaskId]: {
        ...prev[subtaskId],
        answer: '',
        attempts: prev[subtaskId].attempts,
        isCorrect: false,
      },
    }));
    toast.info('Подзадание пропущено');
    handleNext();
  };

  const handleNext = () => {
    const subtaskId = subtasks[currentSubtaskIndex].id ?? subtasks[currentSubtaskIndex].ID ?? 0;
    const inputType = subtasks[currentSubtaskIndex].input_type ?? subtasks[currentSubtaskIndex].InputType ?? 'multiple_choice';

    if (inputType === 'multiple_choice' && !answers[subtaskId]?.answer && !skipped[subtaskId]) {
      toast.error('Пожалуйста, выберите ответ перед переходом к следующему вопросу');
      return;
    }

    if (currentSubtaskIndex < subtasks.length - 1) {
      setCurrentSubtaskIndex(currentSubtaskIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentSubtaskIndex > 0) {
      setCurrentSubtaskIndex(currentSubtaskIndex - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subtaskId = subtasks[currentSubtaskIndex].id ?? subtasks[currentSubtaskIndex].ID ?? 0;
    const inputType = subtasks[currentSubtaskIndex].input_type ?? subtasks[currentSubtaskIndex].InputType ?? 'multiple_choice';

    if (inputType === 'multiple_choice' && !answers[subtaskId]?.answer && !skipped[subtaskId]) {
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

    setIsSubmitting(true);
    try {
      const response = await api.post(`/assignments/${assignmentId}/submit-quiz`, { answers: payload });
      toast.success('Ответы отправлены!');
      onSubmit(response.data);
      subtasks.forEach((subtask) => {
        const subtaskId = subtask.id ?? subtask.ID ?? 0;
        localStorage.removeItem(`quiz_${assignmentId}_${subtaskId}`);
      });
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      toast.error(axiosErr.response?.data?.error || 'Ошибка при отправке');
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
    return (
      <div className="text-red-500 text-center">
        Ошибка: некорректные данные вопроса. Обратитесь к преподавателю.
      </div>
    );
  }

  if (inputType === 'multiple_choice' && !options.length) {
    return (
      <div className="text-red-500 text-center">
        Ошибка: отсутствуют варианты ответа для вопроса (ID: {subtaskId}). Обратитесь к преподавателю.
      </div>
    );
  }

  const isCorrect = answers[subtaskId]?.isCorrect;
  const incorrectOptionsForSubtask = incorrectOptions[subtaskId] || [];
  const attempts = answers[subtaskId]?.attempts || 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSubtaskIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <p className="font-semibold mb-2 text-gray-800 dark:text-white">
            {currentSubtaskIndex + 1}. {question} ({currentSubtaskIndex + 1}/{subtasks.length})
          </p>
          {fileUrl && !imageErrors[subtaskId] && (
            <div className="mt-2 mb-4">
              {fileUrl.endsWith('.pdf') ? (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 transition hover:scale-105 inline-block"
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
                    className="rounded-lg shadow-md"
                    onError={() =>
                      setImageErrors((prev) => ({
                        ...prev,
                        [subtaskId]: `Ошибка загрузки изображения для вопроса ${currentSubtaskIndex + 1}`,
                      }))
                    }
                  />
                  {imageErrors[subtaskId] && <p className="text-red-500 text-sm mt-2">{imageErrors[subtaskId]}</p>}
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
                      className={`accent-blue-600 h-4 w-4 ${
                        isOptionIncorrect ? 'border-red-500 bg-red-100' : ''
                      }`}
                    />
                    <span className={isOptionIncorrect ? 'text-red-600' : 'text-gray-700 dark:text-gray-200'}>
                      {option}
                    </span>
                  </label>
                );
              })
            ) : (
              <>
                <input
                  type="text"
                  value={tempAnswer[subtaskId] || ''}
                  onChange={(e) => setTempAnswer((prev) => ({ ...prev, [subtaskId]: e.target.value }))}
                  disabled={isCorrect === true || attempts >= 3 || skipped[subtaskId]}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                  placeholder="Введите ответ"
                />
                {!isCorrect && attempts < 3 && !skipped[subtaskId] && (
                  <div className="flex space-x-2 mt-2">
                    <Button
                      type="button"
                      onClick={() => handleConfirmTextAnswer(subtaskId)}
                      disabled={isSubmitting}
                      className="hover:scale-105 transition transform"
                    >
                      Подтвердить ответ
                    </Button>
                    {attempts > 0 && (
                      <Button
                        type="button"
                        onClick={() => handleSkip(subtaskId)}
                        variant="outline"
                        className="hover:scale-105 transition transform"
                      >
                        Пропустить
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Попытки: {attempts}{inputType === 'text_input' ? ' / 3' : ''}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex space-x-4">
        {currentSubtaskIndex > 0 && (
          <Button
            type="button"
            onClick={handlePrev}
            disabled={isSubmitting}
            variant="outline"
            className="hover:scale-105 transition transform"
          >
            Назад
          </Button>
        )}
        {currentSubtaskIndex < subtasks.length - 1 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="hover:scale-105 transition transform"
          >
            Далее
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="hover:scale-105 transition transform"
          >
            {isSubmitting ? 'Отправка...' : 'Завершить тест'}
          </Button>
        )}
      </div>
    </form>
  );
}