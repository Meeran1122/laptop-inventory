import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({ message, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="text-slate-400">{icon ?? <Inbox className="h-10 w-10" />}</div>
      <p className="text-sm text-slate-600">{message}</p>
      {action}
    </div>
  );
}
