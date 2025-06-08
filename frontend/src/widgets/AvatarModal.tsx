'use client';
import { avatarOptions } from '@/shared/constants/avatars';
import { api } from '@/shared/api';
import { toast } from 'react-hot-toast';
import { Dialog } from '@headlessui/react';
import { useState } from 'react';

export function AvatarModal({ isOpen, onClose, currentAvatar, onAvatarUpdate }: {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  onAvatarUpdate: (url: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleSelect = async (url: string) => {
    try {
      setLoading(true);
      await api.put('/users/me/avatar', { avatar_url: url });
      toast.success('Аватар обновлён!');
      onAvatarUpdate(url); // обновляем в родителе
      onClose();
    } catch {
      toast.error('Ошибка при обновлении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 z-50 max-w-xl w-full">
        <Dialog.Title className="text-xl font-bold mb-4">Выберите аватар</Dialog.Title>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {avatarOptions.map((url) => (
            <img
              key={url}
              src={url}
              alt="avatar"
              className={`w-20 h-20 rounded-full object-cover cursor-pointer border transition ${
                currentAvatar === url ? 'ring-4 ring-blue-500' : 'hover:ring-2 hover:ring-blue-400'
              }`}
              onClick={() => handleSelect(url)}
            />
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} disabled={loading} className="text-sm text-gray-600 hover:underline">
            Закрыть
          </button>
        </div>
      </div>
    </Dialog>
  );
}
