import { fetchWithAuth } from '@/shared/api/fetch';
import { Submission } from '@/entities/submission/model';

interface SubmitSolutionData {
  assignment_id: number;
  content: string;
}

export async function submitSolution(data: SubmitSolutionData): Promise<Submission> {
  const response = await fetchWithAuth('/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Ошибка отправки решения');
  }
  return response.json();
}