import React from 'react';
import { StateCard } from '@/components/ui/StateCard';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/icons';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading data',
  onRetry,
}) => {
  return (
    <StateCard
      tone="danger"
      icon={<Icons.Alert className="h-8 w-8" />}
      title={title}
      description={message}
      action={
        onRetry ? (
          <Button size="md" onClick={onRetry}>
            Try Again
          </Button>
        ) : undefined
      }
    />
  );
};