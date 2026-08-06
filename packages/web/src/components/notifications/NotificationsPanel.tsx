import React, { useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/components/icons';
import { groupNotificationsByDay } from '@/utils/notifications';
import { EmptyState } from '@/components/ui/EmptyState';
import { NotificationRow } from '@/components/ui/NotificationRow';
import { IconButton } from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { spring } from '@/utils/motion';

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
  const groups = groupNotificationsByDay(notifications);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/30"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={spring}
            className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-surface shadow-float pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex flex-shrink-0 items-center justify-between border-b border-line p-4">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Notifications</h2>
                <p className="text-xs text-muted">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    disabled={markingRead}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 disabled:opacity-50 dark:text-brand-400 dark:hover:bg-brand-900/20"
                  >
                    {markingRead ? 'Marking...' : 'Mark all read'}
                  </button>
                )}
                <IconButton label="Close notifications" onClick={onClose} size="sm">
                  <Icons.Back className="h-5 w-5" />
                </IconButton>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
              {loading ? (
                <ListSkeleton rows={5} />
              ) : notifications.length === 0 ? (
                <EmptyState
                  icon={<Icons.Notifications className="h-8 w-8" />}
                  title="No notifications yet"
                  description="You're all caught up!"
                />
              ) : (
                <div className="space-y-6">
                  {groups.map((group) => (
                    <div key={group.label} className="space-y-2">
                      <p className="px-1 text-xs font-semibold uppercase tracking-widest text-muted">
                        {group.label}
                      </p>
                      {group.items.map((n) => (
                        <NotificationRow key={n.id} notification={n} onClick={onClose} />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};