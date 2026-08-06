import React from 'react';
import { cn } from '@/utils/cn';

export type BadgeTone = 'brand' | 'danger' | 'neutral';

const TONES: Record<BadgeTone, string> = {
  brand: 'bg-brand-600 text-white',
  danger: 'bg-red-500 text-white',
  neutral: 'border border-line bg-surface-2 text-muted',
};

export interface BadgeProps {
  count?: number;
  dot?: boolean;
  tone?: BadgeTone;
  max?: number;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ count, dot, tone = 'danger', max = 99, className }) => {
  if (dot) {
    return (
      <span
        aria-hidden
        className={cn('inline-block h-2 w-2 rounded-full bg-red-500', className)}
      />
    );
  }

  if (!count || count <= 0) return null;

  const label = count > max ? `${max}+` : `${count}`;

  return (
    <span
      aria-label={`${label} unread`}
      className={cn(
        'inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none',
        TONES[tone],
        className,
      )}
    >
      {label}
    </span>
  );
};