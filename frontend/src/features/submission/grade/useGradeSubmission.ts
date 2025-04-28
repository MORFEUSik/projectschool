import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { gradeSubmission } from './api';

export function useGradeSubmission(submissionId: number) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleGrade(grade: number) {
    setLoading(true);
    setError('');
    try {
      await gradeSubmission({ submission_id: submissionId, grade });
      toast.success('Оценка выставлена!', { id: 'grade-submission' });
      router.push('/submissions');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка выставления оценки';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'grade-submission' });
    } finally {
      setLoading(false);
    }
  }

  return { handleGrade, loading, error };
}