import { fetchWithAuth } from '@/shared/api/fetch';
import { Submission } from '@/entities/submission/model';

interface GradeSubmissionData {
  submission_id: number;
  grade: number;
}

export async function gradeSubmission(data: GradeSubmissionData): Promise<Submission> {
  const response = await fetchWithAuth(`/api/submissions/${data.submission_id}/grade`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grade: data.grade }),
  });
  if (!response.ok) {
    throw new Error('Ошибка выставления оценки');
  }
  return response.json();
}