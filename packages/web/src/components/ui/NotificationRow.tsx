import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/utils/cn';
import { getNotificationHref, getNotificationIcon } from '@/utils/notifications';

const TYPE_TEXT: Record<string, string> = {
  LIKE: 'liked your post',
  COMMENT: 'commented on your post',
  FOLLOW: 'started following you',
  MESSAGE: 'sent you a message',
};

const TONE_TILES: Record<string, string> = {
  LIKE: 'bg-red-50 text-red-500 dark:bg-red-900/20',
  COMMENT: 'bg-brand-50 text-brand-500 dark:bg-brand-900/20',
  FOLLOW: 'bg-green-50 text-green-500 dark:bg-green-900/20',
  MESSAGE: 'bg-purple-50 text-purple-500 dark:bg-purple-900/20',
};

export interface NotificationRowNotification {
  id: string;
  type: string;
  entityId?: string | null;
  read?: boolean;
  createdAt: string;
  actor: {
    username: string;
    displayName: string;
  };
}

export interface NotificationRowProps {
  notification: NotificationRowNotification;
  onClick?: () => void;
  className?: string;
}

export const NotificationRow: React.FC<NotificationRowProps> = ({
  notification,
  onClick,
  className,
}) => {
  const href = getNotificationHref(notification);
  const unread = !notification.read;

  const inner = (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl',
          TONE_TILES[notification.type] ?? 'bg-brand-50 text-brand-500 dark:bg-brand-900/20',
        )}
      >
        {getNotificationIcon(notification.type)}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm leading-snug',
            unread ? 'font-medium text-ink' : 'text-ink/80',
          )}
        >
          <span className="font-semibold">{notification.actor.displayName}</span>{' '}
          {TYPE_TEXT[notification.type] ?? 'interacted with you'}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
      {unread && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-brand-500" />}
    </div>
  );

  const base = cn(
    'block rounded-2xl border border-line bg-surface p-3 transition-colors duration-200',
    unread
      ? 'border-brand-500/30 bg-brand-50/40 dark:bg-brand-900/10'
      : 'hover:bg-surface-2',
    className,
  );

  if (!href) {
    return (
      <div className={base} role="status">
        {inner}
      </div>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={base}>
      {inner}
    </Link>
  );
};