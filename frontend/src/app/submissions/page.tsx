'use client';
import { useSubmissions } from '@/shared/hooks/useSubmissions';
import { useUser } from '@/entities/user/hook';
import { Card } from '@/shared/ui/Card';
import Link from 'next/link';
import { parseISO, format } from 'date-fns';

interface Submission {
  id: number;
  assignment_id: number;
  user_id: number;
  score: number;
  submitted_at: string;
  assignment_title: string;
  course_id: number;
  course_title: string;
}

export default function SubmissionsPage() {
  const { user, isLoading: userLoading } = useUser();
  const { submissions, loading, error } = useSubmissions();

  if (userLoading || loading) {
    return <div className="text-center mt-8">Загрузка...</div>;
  }

  if (!user) {
    return <div className="text-center mt-8 text-red-500">Пожалуйста, войдите в систему</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">Ошибка: {error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Мои решения</h1>
      <Card className="p-6">
        {submissions.length === 0 ? (
          <p className="text-center">Решения отсутствуют</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Задание</th>
                <th className="text-left p-2">Курс</th>
                <th className="text-left p-2">Оценка</th>
                <th className="text-left p-2">Дата отправки</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission: Submission) => (
                <tr key={submission.id} className="border-b">
                  <td className="p-2">
                    {submission.course_id && submission.assignment_id ? (
                      <Link
                        href={`/courses/${submission.course_id}/assignments/${submission.assignment_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {submission.assignment_title}
                      </Link>
                    ) : (
                      submission.assignment_title
                    )}
                  </td>
                  <td className="p-2">{submission.course_title}</td>
                  <td className="p-2">
                    {submission.score > 0 ? submission.score.toFixed(2) : 'Не оценено'}
                  </td>
                  <td className="p-2">
                    {submission.submitted_at
                      ? format(parseISO(submission.submitted_at), 'dd.MM.yyyy HH:mm')
                      : 'Не указано'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}