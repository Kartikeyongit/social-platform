import { useQuery, gql } from '@apollo/client';

const GET_UNREAD_COUNT = gql`
  query UnreadCount {
    unreadNotificationCount
  }
`;

export function useUnreadCount(pollInterval = 10000): number {
  const { data } = useQuery(GET_UNREAD_COUNT, { pollInterval });
  return data?.unreadNotificationCount || 0;
}