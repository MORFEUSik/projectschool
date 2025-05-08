// src/app/auth/login/page.tsx
import { LoginForm } from '@/features/auth/login';

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Вход</h1>
      <LoginForm />
    </div>
  );
}