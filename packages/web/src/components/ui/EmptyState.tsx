import React from 'react';
import Link from 'next/link';
import { Icons } from '@/components/icons';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-12 text-center">
      <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
        <span className="text-slate-300 dark:text-slate-600">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{description}</p>
      )}
      {action && (
        <Link href={action.href} className="btn-primary-premium inline-block text-sm">
          {action.label}
        </Link>
      )}
    </div>
  );
};