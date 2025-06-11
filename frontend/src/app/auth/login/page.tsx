// src/app/auth/login/page.tsx
'use client';
import { LoginForm } from '@/features/auth/login';
import { Card } from '@/shared/ui/Card';
import { motion } from 'framer-motion';

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto mt-12 px-4">
  <motion.h1
			  initial={{ opacity: 0, y: 20 }}
			  animate={{ opacity: 1, y: 0 }}
			  transition={{ duration: 0.5, delay: 0.1 }}
			  className="text-center text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white max-w-3xl mx-auto break-words mb-6"
			>
			 Вход
			</motion.h1>  
  <Card className="p-6">
    <LoginForm />
  </Card>
</div>
  );
}