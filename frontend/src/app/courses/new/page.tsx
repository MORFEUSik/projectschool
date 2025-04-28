"use client";

import { useCreateCourse } from '@/features/course/create/useCreateCourse';
import { Card, Button, Input } from '@/shared/ui';
import { useState } from 'react';

export default function NewCoursePage() {
  const { handleCreate, loading, error } = useCreateCourse();
  const [formData, setFormData] = useState({ title: '', description: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500">
      <Card className="w-full max-w-md p-6 shadow-lg animate-bounce-in">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Создать курс</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={(e) => { e.preventDefault(); handleCreate(formData); }} className="flex flex-col gap-4">
          <Input label="Название курса" name="title" value={formData.title} onChange={handleChange} required />
          <div>
            <label className="block text-gray-700 mb-2">Описание</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Загрузка...' : 'Создать'}
          </Button>
        </form>
      </Card>
    </div>
  );
}