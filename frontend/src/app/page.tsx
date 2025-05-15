// src/app/page.tsx
'use client';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="text-center max-w-4xl mx-auto mt-8">
      <h1 className="text-4xl font-bold mb-6">Добро пожаловать в ProjectSchool!</h1>
      <Card className="p-6">
        <p className="mb-4">Обучайтесь, выполняйте задания и соревнуйтесь в таблице лидеров!</p>
        <Link href="/courses">
          <Button>Перейти к курсам</Button>
        </Link>
      </Card>
    </div>
  );
}