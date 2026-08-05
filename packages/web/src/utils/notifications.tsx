import React from 'react';
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
    case 'COMMENT': return <Icons.Comment className="w-5 h-5 text-blue-500" />;
    case 'FOLLOW': return <Icons.Profile className="w-5 h-5 text-green-500" />;
    case 'MESSAGE': return <Icons.Messages className="w-5 h-5 text-purple-500" />;
    default: return <Icons.Notifications className="w-5 h-5 text-slate-500" />;
  }
};
