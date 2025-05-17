import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant?: 'default' | 'outline' | 'destructive';
}

export function Button({ children, className = '', variant = 'default', ...props }: ButtonProps) {
  const variantStyles = {
    default: 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700',
    outline: 'border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-100',
    destructive: 'bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700',
  };
  return (
    <button
      className={`${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}