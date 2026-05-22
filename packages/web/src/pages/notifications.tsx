import React from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons';

const GET_NOTIFICATIONS = gql`
  query GetNotifications($limit: Int) {
    notifications(limit: $limit) {
      id
      type
      entityId
      read
      createdAt
      actor {
        id
        username
        displayName
      }
    }
    unreadNotificationCount
  }
`;

const MARK_ALL_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'LIKE': return <Icons.Like className="w-5 h-5 text-red-500" />;
    case 'COMMENT': return <Icons.Comment className="w-5 h-5 text-blue-500" />;
    case 'FOLLOW': return <Icons.Profile className="w-5 h-5 text-green-500" />;
    case 'MESSAGE': return <Icons.Messages className="w-5 h-5 text-purple-500" />;
    default: return <Icons.Notifications className="w-5 h-5 text-slate-500" />;
  }
};

export default function NotificationsPage() {
  const { data, loading, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: { limit: 50 },
    fetchPolicy: 'network-only',
  });

  const [markAllRead] = useMutation(MARK_ALL_READ, {
    onCompleted: () => refetch(),
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadNotificationCount || 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-display">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={() => markAllRead()} className="btn-secondary-premium text-sm">
              Mark all read
            </button>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-4 animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-dark-100"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-dark-100 rounded-full w-48"></div>
                  <div className="h-3 bg-slate-200 dark:bg-dark-100 rounded-full w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-12 text-center">
          <Icons.Notifications className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No notifications yet</h3>
          <p className="text-slate-500 dark:text-slate-400">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification: any) => (
            <div
              key={notification.id}
              className={`bg-white dark:bg-dark-50 rounded-3xl border border-slate-200/60 dark:border-dark-100 shadow-soft p-4 cursor-pointer hover:shadow-md transition-all ${
                !notification.read ? 'border-l-4 border-brand-500 bg-brand-50/30 dark:bg-brand-900/10' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                {getNotificationIcon(notification.type)}
                <div className="flex-1">
                  <p className={`text-sm ${!notification.read ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    <span className="font-medium">{notification.actor.displayName}</span>
                    {' '}
                    {notification.type === 'LIKE' && 'liked your post'}
                    {notification.type === 'COMMENT' && 'commented on your post'}
                    {notification.type === 'FOLLOW' && 'started following you'}
                    {notification.type === 'MESSAGE' && 'sent you a message'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2.5 h-2.5 bg-brand-500 rounded-full"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
