import { useQuery, gql } from '@apollo/client';

const GET_UNREAD_MESSAGES_COUNT = gql`
  query UnreadMessagesCount {
    unreadMessageCount
  }
`;

export function useUnreadMessagesCount(pollInterval = 10000): number {
  const { data } = useQuery(GET_UNREAD_MESSAGES_COUNT, { pollInterval });
  return data?.unreadMessageCount || 0;
}
