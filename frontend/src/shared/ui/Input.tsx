// src/shared/ui/Input.tsx
import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Input({ className = '', ...props }: InputProps) {
  return <input className={`border p-2 rounded w-full ${className}`} {...props} />;
}