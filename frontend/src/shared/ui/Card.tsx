import { ReactNode, HTMLAttributes } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className = '', title, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'card card-shadow card-hover-gradient bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 transition-all',
        className
      )}
      {...props}
    >
      {title && <h2 className="text-2xl font-bold text-gray-800 dark:text-white p-4">{title}</h2>}
      <div className="p-4">{children}</div>
    </div>
  );
}