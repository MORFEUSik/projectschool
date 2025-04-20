import { cn } from '@/shared/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-md p-4 transition-transform transform hover:scale-105',
        className
      )}
    >
      {children}
    </div>
  );
}