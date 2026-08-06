import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Icons } from '@/components/icons';

interface NotificationLike {
  type: string;
  entityId?: string | null;
  actor?: { username: string } | null;
}

export function getNotificationHref(n: NotificationLike): string | null {
  if (n.type === 'LIKE' || n.type === 'COMMENT') return n.entityId ? `/post/${n.entityId}` : null;
  if (n.type === 'FOLLOW') return n.actor?.username ? `/profile/${n.actor.username}` : null;
  if (n.type === 'MESSAGE') return '/messages';
  return null;
}

export const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'LIKE': return <Icons.Like className="w-5 h-5 text-red-500" />;
    case 'COMMENT': return <Icons.Comment className="w-5 h-5 text-brand-500" />;
    case 'FOLLOW': return <Icons.Profile className="w-5 h-5 text-green-500" />;
    case 'MESSAGE': return <Icons.Messages className="w-5 h-5 text-purple-500" />;
    default: return <Icons.Notifications className="w-5 h-5 text-muted" />;
  }
};

export interface DayGroup<T> {
  label: string;
  items: T[];
}

export interface NotificationItem {
  id: string;
  type: string;
  entityId?: string | null;
  read?: boolean;
  createdAt: string;
  actor: {
    id?: string;
    username: string;
    displayName: string;
  };
}

export function groupNotificationsByDay(items: NotificationItem[]): DayGroup<NotificationItem>[] {
  const groups: DayGroup<NotificationItem>[] = [];
  for (const item of items) {
    const d = new Date(item.createdAt);
    const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d');
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}