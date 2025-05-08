// src/app/page.tsx
import { Card } from '@/shared/ui/Card';

export default function Home() {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-4">Добро пожаловать в ProjectSchool!</h1>
      <Card>
        <p>Обучайтесь, выполняйте задания и соревнуйтесь в таблице лидеров!</p>
      </Card>
    </div>
  );
}