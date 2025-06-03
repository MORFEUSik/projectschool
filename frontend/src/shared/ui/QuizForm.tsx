'use client';
import { useState } from 'react';
import { api } from '@/shared/api';
import { Button } from '@/shared/ui/Button';
import toast from 'react-hot-toast';

interface Subtask {
  id: number;
  question: string;
  options: string[];
  order: number;
}

interface Props {
  assignmentId: number;
  subtasks: Subtask[];
}

export function QuizForm({ assignmentId, subtasks }: Props) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<
    { subtaskId: number; answer: string; attempts: number }[]
  >([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [disabledOptions, setDisabledOptions] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [grade, setGrade] = useState<number | null>(null);

  const handleOptionClick = (option: string) => {
    const subtask = subtasks[current];
    const isCorrect = option === subtask.options.find((o) => o === subtask.options.find(ans => ans === option));
    const correct = option === subtask.options.find(ans => ans === subtask.options.find((o) => o === subtask.options.find((p) => p === o && p === subtask.answer)));

    const prev = answers.find((a) => a.subtaskId === subtask.id);
    const attempts = prev ? prev.attempts + 1 : 1;

    if (option === subtask.answer) {
      setAnswers([...answers, { subtaskId: subtask.id, answer: option, attempts }]);
      setSelected([]);
      setDisabledOptions([]);
      if (current + 1 < subtasks.length) {
        setCurrent(current + 1);
      } else {
        submitQuiz([...answers, { subtaskId: subtask.id, answer: option, attempts }]);
      }
    } else {
      if (attempts >= subtask.options.length - 1) {
        // Последняя попытка — переходим дальше
        setAnswers([...answers, { subtaskId: subtask.id, answer: '', attempts }]);
        setSelected([]);
        setDisabledOptions([]);
        if (current + 1 < subtasks.length) {
          setCurrent(current + 1);
        } else {
          submitQuiz([...answers, { subtaskId: subtask.id, answer: '', attempts }]);
        }
      } else {
        setDisabledOptions([...disabledOptions, option]);
      }
    }
  };

  const submitQuiz = async (finalAnswers: typeof answers) => {
    try {
      const formatted = finalAnswers.map((a) => ({
        subtask_id: a.subtaskId,
        answer: a.answer,
        attempts: a.attempts,
      }));
      const res = await api.post(`/assignments/${assignmentId}/submit-quiz`, {
        answers: formatted,
      });
      setGrade(res.data.grade);
      setFinished(true);
      toast.success(`Оценка: ${res.data.grade}`);
    } catch (err) {
      console.error(err);
      toast.error('Ошибка при отправке квиза');
    }
  };

  if (finished) {
    return <div className="text-xl font-bold text-green-600">Оценка: {grade}</div>;
  }

  const subtask = subtasks[current];

  return (
    <div>
      <p className="mb-2 text-lg font-semibold">
        {current + 1}. {subtask.question}
      </p>
      <div className="space-y-2">
        {subtask.options.map((opt) => (
          <Button
            key={opt}
            variant={disabledOptions.includes(opt) ? 'destructive' : 'outline'}
            disabled={disabledOptions.includes(opt)}
            onClick={() => handleOptionClick(opt)}
            className="block w-full text-left"
          >
            {opt}
          </Button>
        ))}
      </div>
    </div>
  );
}
