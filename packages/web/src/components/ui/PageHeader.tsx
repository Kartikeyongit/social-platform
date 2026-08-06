import React from 'react';
import { cn } from '@/utils/cn';
import { IconButton } from '@/components/ui/Button';
import { Icons } from '@/components/icons';

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  back,
  onBack,
  actions,
  icon,
  className,
}) => (
  <div className={cn('mb-6 flex items-center justify-between gap-3', className)}>
    <div className="flex min-w-0 items-center gap-3">
      {back && (
        <IconButton label="Go back" onClick={onBack} className="flex-shrink-0">
          <Icons.Back className="h-5 w-5" />
        </IconButton>
      )}
      {icon && <span className="flex-shrink-0 text-brand-600 dark:text-brand-400">{icon}</span>}
      <div className="min-w-0">
        <h1 className="truncate font-display text-2xl font-bold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 truncate text-sm text-muted">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
  </div>
);