// src/shared/ui/Button.tsx
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export function Button({ children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}