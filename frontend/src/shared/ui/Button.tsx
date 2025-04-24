// frontend/src/shared/ui/Button.tsx
import { cn } from '@/shared/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function Button({ children, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'bg-primary text-white px-4 py-2 rounded-xl hover:bg-secondary transition-colors duration-200 disabled:bg-gray-400',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}