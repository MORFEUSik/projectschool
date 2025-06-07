// frontend/src/app/admin/components/ActionLogs.tsx
'use client';
import { Card } from '@/shared/ui/Card';

interface LogEntry {
  id: number;
  user_id: number;
  action: string;
  details: string;
  created_at: string;
}

interface ActionLogsProps {
  logs: LogEntry[];
}

export function ActionLogs({ logs }: ActionLogsProps) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">Действия пользователей</h2>
      {logs.length === 0 ? (
        <p className="text-sm text-gray-500">Нет логов</p>
      ) : (
        <ul className="text-sm space-y-2 max-h-80 overflow-y-auto">
          {logs.map((log) => (
            <li key={log.id}>
              <span className="font-medium">Пользователь {log.user_id}:</span>{' '}
              {log.action} ({log.details}){' '}
              <span className="text-gray-500 text-xs">
                ({new Date(log.created_at).toLocaleString()})
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}