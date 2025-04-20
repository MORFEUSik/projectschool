import { cn } from '@/shared/lib/utils'

interface AuthFormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
}

export function AuthForm({ children, onSubmit, className }: AuthFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn('flex flex-col gap-4', className)}
    >
      {children}
    </form>
  );
}