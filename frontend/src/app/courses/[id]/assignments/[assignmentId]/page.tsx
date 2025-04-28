"use client";

import { useSubmitSolution } from '@/features/submission/submit/useSubmitSolution';
import { Card, Button, Input } from '@/shared/ui';
import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function SubmitSolutionPage() {
  const { assignmentId } = useParams();
  const id = Number(assignmentId);
  const { handleSubmit, loading, error } = useSubmitSolution(id);
  const [content, setContent] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500">
      <Card className="w-full max-w-md p-6 shadow-lg profile-card">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Отправить решение</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(content);
          }}
          className="flex flex-col gap-4"
        >
          <div className="input-group">
            <label className="input-label">Решение</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="input w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <Button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Загрузка...' : 'Отправить'}
          </Button>
        </form>
      </Card>
    </div>
  );
}