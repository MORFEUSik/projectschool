'use client';
import { Button } from '@/shared/ui/Button';
import clsx from 'clsx';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  className?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отменить',
  className,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className={clsx(
          'bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 card-shadow animate-fade-in-up',
          className
        )}
      >
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{title}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="outline">
            {cancelText}
          </Button>
          <Button onClick={onConfirm} variant="destructive">
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}