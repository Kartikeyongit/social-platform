import React from 'react';
import { cn } from '@/utils/cn';

export type StateTone = 'brand' | 'danger';

const TONE_ICON_TILE: Record<StateTone, string> = {
  brand: 'bg-brand-50 text-brand-500 dark:bg-brand-900/20',
  danger: 'bg-red-50 text-red-500 dark:bg-red-900/20',
};

export interface StateCardProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  tone?: StateTone;
  action?: React.ReactNode;
  className?: string;
}

export const StateCard: React.FC<StateCardProps> = ({
  icon,
  title,
  description,
  tone = 'brand',
  action,
  className,
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-3xl border border-line bg-surface p-12 text-center shadow-soft',
      className,
    )}
  >
    {icon && (
      <div
        className={cn(
          'mb-4 flex h-16 w-16 items-center justify-center rounded-3xl',
          TONE_ICON_TILE[tone],
        )}
      >
        {icon}
      </div>
    )}
    <h3 className="mb-2 text-lg font-semibold text-ink">{title}</h3>
    {description && <p className="mb-5 text-sm text-muted">{description}</p>}
    {action}
  </div>
);