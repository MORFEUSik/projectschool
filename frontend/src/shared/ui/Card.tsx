import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string; // Добавляем пропс title
}

export function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`bg-white p-4 rounded shadow ${className}`}>
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      {children}
    </div>
  );
}
