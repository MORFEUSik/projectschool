// src/app/auth/login/page.tsx
'use client';
import { LoginForm } from '@/features/auth/login';
import { Card } from '@/shared/ui/Card';

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto mt-12 px-4">
  <h1 className="text-4xl font-extrabold text-center text-blue-600 mb-8">Вход</h1>
  <Card className="p-6">
    <LoginForm />
  </Card>
</div>
  );
}