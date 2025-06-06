import { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={clsx(
      'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 transition-all',
      className
    )}>
      {title && <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{title}</h2>}
      {children}
    </div>
  );
}
