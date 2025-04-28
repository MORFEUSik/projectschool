import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { submitSolution } from './api';

export function useSubmitSolution(assignmentId: number) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(content: string) {
    setLoading(true);
    setError('');
    try {
      await submitSolution({ assignment_id: assignmentId, content });
      toast.success('Решение отправлено!', { id: 'submit-solution' });
      router.push('/profile/submissions');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка отправки';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'submit-solution' });
    } finally {
      setLoading(false);
    }
  }

  return { handleSubmit, loading, error };
}