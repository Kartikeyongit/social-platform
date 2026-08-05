import React from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/components/icons';
import { getNotificationHref, getNotificationIcon } from '@/utils/notifications';
import { EmptyState } from '@/components/ui/EmptyState';
import Link from 'next/link';

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

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const { data, loading, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: { limit: 50 },
    fetchPolicy: 'network-only',
    skip: !isOpen,
  });

  const [markAllRead, { loading: markingRead }] = useMutation(MARK_ALL_READ, {
    onCompleted: () => refetch(),
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadNotificationCount || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-dark-0 z-50 shadow-2xl border-l border-slate-200/60 dark:border-dark-100 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200/60 dark:border-dark-100 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} unread</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    disabled={markingRead}
                    className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium disabled:opacity-50"
                  >
                    {markingRead ? 'Marking...' : 'Mark all read'}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-dark-50 transition-colors"
                  aria-label="Close notifications"
                >
                  <Icons.Back className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-dark-50 rounded-2xl border border-slate-200/60 dark:border-dark-100 p-4 animate-pulse">
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
                <EmptyState
                  icon={<Icons.Notifications className="w-8 h-8" />}
                  title="No notifications yet"
                  description="You're all caught up!"
                />
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification: any) => {
                    const href = getNotificationHref(notification);
                    const inner = (
                      <div className="flex items-center space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
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
                          <div className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    );
                    const base = `block bg-white dark:bg-dark-50 rounded-2xl border border-slate-200/60 dark:border-dark-100 p-3.5 hover:shadow-md transition-all ${
                      !notification.read ? 'border-l-4 border-brand-500 bg-brand-50/30 dark:bg-brand-900/10' : ''
                    }`;
                    return href ? (
                      <Link key={notification.id} href={href} onClick={onClose} className={base}>
                        {inner}
                      </Link>
                    ) : (
                      <div key={notification.id} className={base}>
                        {inner}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
