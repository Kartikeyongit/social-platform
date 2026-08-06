import React from 'react';
import { cn } from '@/utils/cn';

export type CardVariant = 'flat' | 'bordered' | 'floating' | 'glass';

const VARIANTS: Record<CardVariant, string> = {
  flat: 'bg-surface',
  bordered: 'bg-surface border border-line',
  floating: 'bg-surface border border-line shadow-float',
  glass: 'glass-card',
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hover?: boolean;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant = 'bordered',
  hover = false,
  interactive = false,
  className,
  children,
  ...rest
}) => (
  <div
    className={cn(
      'rounded-3xl',
      VARIANTS[variant],
      hover && 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card',
      interactive &&
        'cursor-pointer select-none transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card active:scale-[0.99]',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
);