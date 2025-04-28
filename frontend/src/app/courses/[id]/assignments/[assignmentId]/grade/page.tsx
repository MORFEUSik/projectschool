"use client";

import { useGradeSubmission } from '@/features/submission/grade/useGradeSubmission';
import { Card, Button, Input } from '@/shared/ui';
import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function GradeSubmissionPage() {
  const { assignmentId } = useParams();
  const submissionId = Number(assignmentId); // Предполагаем, что submissionId совпадает с assignmentId
  const { handleGrade, loading, error } = useGradeSubmission(submissionId);
  const [grade, setGrade] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500">
      <Card className="w-full max-w-md p-6 shadow-lg profile-card">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Выставить оценку</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGrade(Number(grade));
          }}
          className="flex flex-col gap-4"
        >
          <Input
            label="Оценка (0-100)"
            type="number"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            required
            min="0"
            max="100"
            className="input"
          />
          <Button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Загрузка...' : 'Выставить'}
          </Button>
        </form>
      </Card>
    </div>
  );
}