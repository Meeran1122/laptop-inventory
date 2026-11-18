import type { ReactNode } from 'react';

type BadgeColor = 'green' | 'amber' | 'red' | 'blue' | 'slate';

interface BadgeProps {
  color?: BadgeColor;
  children: ReactNode;
}

const COLOR_CLASSES: Record<BadgeColor, string> = {
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  slate: 'bg-slate-100 text-slate-600',
};

export default function Badge({ color = 'slate', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${COLOR_CLASSES[color]}`}
    >
      {children}
    </span>
  );
}
