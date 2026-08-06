import React from 'react';
import Link from 'next/link';
import { StateCard } from '@/components/ui/StateCard';
import { buttonClass } from '@/components/ui/Button';

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
    <StateCard
      icon={icon}
      title={title}
      description={description}
      action={
        action ? (
          <Link href={action.href} className={buttonClass('primary', 'md')}>
            {action.label}
          </Link>
        ) : undefined
      }
    />
  );
};