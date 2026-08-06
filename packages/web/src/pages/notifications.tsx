import React, { useEffect } from 'react';
import { useQuery, useMutation, useSubscription, gql } from '@apollo/client';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons';
import { groupNotificationsByDay } from '@/utils/notifications';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { NotificationRow } from '@/components/ui/NotificationRow';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { staggerContainer, listItem } from '@/utils/motion';

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

const NEW_NOTIFICATION_SUB = gql`
  subscription NewNotification {
    newNotification {
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
  }
`;

export default function NotificationsPage() {
  const { data, loading, error, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: { limit: 50 },
    fetchPolicy: 'network-only',
  });

  const [markAllRead, { loading: markingRead }] = useMutation(MARK_ALL_READ, {
    onCompleted: () => refetch(),
  });

  useSubscription(NEW_NOTIFICATION_SUB, {
    onData: ({ client, data }) => {
      const n = data.data?.newNotification;
      if (!n) return;
      client.cache.updateQuery({ query: GET_NOTIFICATIONS, variables: { limit: 50 } }, (prev: any) => {
        if (!prev?.notifications) return prev;
        if (prev.notifications.some((x: any) => x.id === n.id)) return prev;
        return {
          ...prev,
          notifications: [n, ...prev.notifications].slice(0, 50),
          unreadNotificationCount: (prev.unreadNotificationCount || 0) + 1,
        };
      });
    },
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadNotificationCount || 0;

  // Visiting the page marks everything read
  useEffect(() => {
    if (unreadCount > 0 && !markingRead) markAllRead();
  }, [unreadCount, markingRead]); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = groupNotificationsByDay(notifications);

  return (
    <div className="w-full max-w-2xl space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
        actions={
          unreadCount > 0 ? (
            <Button variant="secondary" size="sm" onClick={() => markAllRead()} loading={markingRead}>
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {error && !loading && (
        <ErrorState
          title="Couldn't load notifications"
          message={error.message}
          onRetry={() => refetch()}
        />
      )}

      {loading ? (
        <ListSkeleton rows={5} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Icons.Notifications className="h-8 w-8" />}
          title="No notifications yet"
          description="You're all caught up!"
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {groups.map((group) => (
            <div key={group.label} className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-widest text-muted">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.items.map((n) => (
                  <motion.div key={n.id} variants={listItem}>
                    <NotificationRow notification={n} />
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}